# Dev Project Hub

Plataforma para que desarrolladores independientes organicen, gestionen y hagan seguimiento de sus proyectos personales.

## Primer MVP

- Autenticacion con email y contrasena.
- Dashboard personal de proyectos.
- Creacion y seguimiento de proyectos.
- Tareas con estado y prioridad.
- Acceso seguro a los datos mediante Supabase RLS.

## Puesta en marcha

1. Copia `.env.example` como `.env`.
2. Completa la URL y la clave publica de tu proyecto de Supabase.
3. Ejecuta el contenido de `supabase/migrations/001_initial_schema.sql` en Supabase.
4. Instala las dependencias con `npm install`.
5. Inicia la aplicacion con `npm run dev`.
