# Decisiones — ajuste de navegación

- Se usará una prop visual `mobile` en `Actions` para compartir la ruta y el formulario de cierre de sesión entre ambas presentaciones.
- Los controles móviles reutilizarán la apariencia de `theme-toggle`, con dimensiones de 44 × 44 px limitadas al panel. No se modificará `ThemeToggle`.
- El selector de tema de escritorio conservará su icono actual; las acciones de crear partido y cerrar sesión conservarán sus textos.
- Se añadirá foco visible y hover compartidos para los controles del panel. El panel tendrá tres columnas de 44 px, sin ancho mínimo heredado.

# Decisiones de implementación — etapa 2

- C/D/E: el usuario eligió CSV B para todo usuario del club, administrador global exclusivo con su cuenta habitual y borrado incluyendo historial. Multiclub por cuenta aplazado y cuentas de otro club bloqueadas; estas decisiones sustituyen las alternativas originales del plan.
- Implementación técnica: permiso global singleton asociado a UUID/correo verificado, sin roles por club; inicialización administrativa separada de migraciones. Servicio Auth solo en servidor. Invitaciones de membresía separadas de identidad Auth, con 72 horas de vigencia del plan, reenvío revoca anterior y espera mínima de 60 segundos para evitar doble envío.
- CSV: Papa Parse, selección explícita de columnas/posiciones, duplicados omitidos salvo revisión; hash de snapshot y clave de operación por club. Se serializan todos los cambios de jugadores con el bloqueo ya usado por el cupo. Se conserva únicamente hash/resultado de operación, no archivo completo.
- Pruebas: no existe Supabase de desarrollo y Docker está apagado. PostgreSQL embebido PGlite prueba las migraciones y políticas con identidades sintéticas; no equivale a integración Auth ni concurrencia entre conexiones. No ejecutar pruebas de escritura en la base actual.

- Corrección del destello: inicializar tema en head conservando localStorage y sincronizar los dos botones existentes; no cambiar el envío de filtros. El HTML modifica sus atributos antes de hidratar, por eso se limita suppressHydrationWarning a html.

- Primera entrega A/B: el usuario había confirmado implementar solo interfaz e informes. En la continuación autorizó C/D/E con las decisiones indicadas arriba.
- Filtros: aceptar año o año-mes al cambiar el selector existente; mensual requiere mes. Usar límites inclusivos de calendario para soportar 0001–9999 sin el ajuste de Date.UTC para años menores a 100 ni un año 10000.
- Exportación: una única tabla responsive, texto manual seleccionable y fecha de generación en zona America/Argentina/Buenos_Aires. No cambiar las métricas ni la ventana reciente existente.
