# JUEGASANO

Aplicación de fútbol para registrar minutos y escala de Borg por jugador y partido, aislada por club.

## Requisitos

- Node.js 20+
- Un proyecto nuevo de Supabase

## Puesta en marcha

1. Copiá `.env.example` a `.env.local` y completá sus variables con los datos
   de tu proyecto de Supabase.
2. En el SQL Editor de Supabase de **desarrollo**, ejecutá las migraciones en
   orden por fecha y luego `supabase/seed.sql` si necesitás datos mock.
3. Creá un usuario en Supabase Auth y asociá su UUID a un club mediante
   `insert into public.profiles (id, club_id) values ('UUID_DEL_USUARIO', 'UUID_DEL_CLUB');`.
4. Instalá dependencias: `npm install`.
5. Iniciá la app: `npm run dev`.

Abrí `http://localhost:3000`.

## Calidad y deploy

- `npm run lint`
- `npm run typecheck`
- `npm run build`

Para desplegar en Vercel, importá el repositorio y configurá las dos variables
`NEXT_PUBLIC_SUPABASE_*` con los mismos valores del entorno correspondiente.
No usar la service role key en el navegador.

## Base de desarrollo

La migración inicial y el seed reconstruyen el modelo para datos mock. No los
ejecutes sobre una instancia con datos reales; a partir de producción, usar
migraciones incrementales.
