# Activación de administración, CSV y borrado

Código preparado localmente; las migraciones no se aplican automáticamente. No ejecutar pruebas sobre datos reales. Mantener una copia de respaldo antes de cualquier cambio de producción.

## Base de datos

1. Validar primero en un proyecto Supabase de desarrollo las dos migraciones nuevas, sobre 001–004 ya aplicadas:
   - `migrations/202609210005_player_import_and_delete.sql`
   - `migrations/202609210006_global_administration.sql`
2. No reejecutar la inicial ni el seed en la instancia actual.
3. Con la cuenta `mastropierro.francisco@gmail.com` existente y correo verificado, ejecutar `setup-platform-admin.sql`. Resuelve el UUID en Auth sin cambiar el club del usuario; falla si no hay una cuenta verificada o si ya hay otro administrador.
4. Comprobar con dos cuentas que solo la designada accede a `/admin` y a RPC administrativas; usuarios normales no pueden leer invitaciones ni la tabla de administración. El permiso no se toma de metadata editable del usuario.

## Variables de servidor

- `SUPABASE_SERVICE_ROLE_KEY`: clave administrativa del mismo proyecto. Solo en entorno del servidor/Vercel; nunca `NEXT_PUBLIC`, navegador ni repositorio.
- `APP_URL`: origen HTTPS exacto de la aplicación. En desarrollo se acepta `http://localhost:3000`.
- Conservar las dos variables públicas actuales.

Sin estas variables el envío muestra un error de configuración; no se crea una membresía.

## Supabase Auth

1. Configurar SMTP/remitente y revisar límites de envío. Desactivar altas públicas si no se quieren identidades sin invitación; la aplicación nunca concede club por registro público.
2. En URL Configuration, Site URL debe coincidir con APP_URL; permitir las URLs `/auth/confirm` con query de invitación y `/auth/callback` de recuperación para el origen usado. Añadir localhost solo para desarrollo.
3. Plantilla **Invite user** (invitación de cuenta nueva):

   ```html
   <h2>Invitación a JUEGASANO</h2>
   <p>Verificá tu correo para revisar la invitación al club y crear tu contraseña.</p>
   <a href="{{ .RedirectTo }}&amp;token_hash={{ .TokenHash }}&amp;type=invite">Revisar invitación</a>
   ```

4. Plantilla **Magic Link** (cuenta existente sin club / reintento):

   ```html
   <h2>Acceso a JUEGASANO</h2>
   <p>Verificá tu correo para revisar la invitación al club.</p>
   <a href="{{ .RedirectTo }}&amp;token_hash={{ .TokenHash }}&amp;type=email">Revisar invitación</a>
   ```

   Estas plantillas presuponen el RedirectTo que envía esta aplicación: `APP_URL/auth/confirm?invitation=UUID`. Los enlaces se confirman por botón POST, para no consumirlos en una vista previa automática del correo. No reutilizar estas plantillas para otros flujos OTP que no incluyan esa query.

5. Mantener la plantilla de recuperación separada. Callback permite únicamente dashboard o reset-password como destinos.
6. La membresía dura 72 horas pendiente; el token Auth puede vencer antes según configuración. Reenviar desde Administración crea nueva invitación y revoca la anterior; no restablece contraseñas de cuentas existentes. El botón requiere al menos 60 segundos desde el envío anterior.

## Uso

- Solo el administrador ve el acceso **Administración de clubes y usuarios**. Crear un club no cambia su pertenencia actual. Seleccionar club y correo para enviar invitación.
- Una cuenta de otro club se rechaza sin trasladarla; una del mismo club ya vinculada no se duplica.
- El invitado verifica correo, define contraseña si no tiene una y acepta. Sin perfil ve una pantalla propia con instrucciones y salida.
- En Jugadores: **Cargar CSV**, revisar columnas/posiciones, duplicados y cupo; confirmar. Nuevos jugadores activos/Disponible. No se fusionan ni reactivan existentes.
- **Eliminar** advierte que borra el jugador y todas sus estadísticas. Cancelar no envía ninguna operación. Confirmar conserva partidos y otros jugadores, y actualiza informes.

## Verificación

`npm test` usa PostgreSQL embebido con fixtures sintéticas, sin conectarse a Supabase. `npm run lint`, `npm run typecheck`, `npm run build`.

Antes de habilitar en producción siguen siendo necesarias pruebas de integración con Auth/SMTP reales y concurrencia con conexiones independientes: 49 activos + dos altas simultáneas; reenvío del mismo lote; edición durante revisión; insertar estadísticas mientras se elimina al jugador. Verificar que cada rechazo revierte la transacción y ninguna acción afecta al otro club. PGlite no sustituye esas pruebas de conexiones concurrentes ni la configuración real de Supabase.

Fuentes de configuración: [invitaciones Supabase](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail), [plantillas de correo](https://supabase.com/docs/guides/auth/auth-email-templates), [autenticación por correo](https://supabase.com/docs/guides/auth/auth-email-passwordless).
