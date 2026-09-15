# Carga Deportiva

MVP para registrar minutos y escala de Borg por jugador y partido.

## Requisitos

- Node.js 20+
- Un proyecto nuevo de Supabase

## Puesta en marcha

1. Copiá `.env.example` a `.env.local` y completá sus variables con los datos
   de tu proyecto de Supabase.
2. En el SQL Editor de Supabase, ejecutá primero
   `supabase/migrations/202609140001_initial_schema.sql` y luego
   `supabase/seed.sql`.
3. Instalá dependencias: `npm install`.
4. Iniciá la app: `npm run dev`.

Abrí `http://localhost:3000`.

## Calidad y deploy

- `npm run lint`
- `npm run typecheck`
- `npm run build`

Para desplegar en Vercel, importá el repositorio y configurá las dos variables
`NEXT_PUBLIC_SUPABASE_*` con los mismos valores del entorno correspondiente.
No usar la service role key en el navegador.
