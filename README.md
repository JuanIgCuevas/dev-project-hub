# Dev Project Hub

[![Quality](https://github.com/JuanIgCuevas/dev-project-hub/actions/workflows/quality.yml/badge.svg?branch=Development)](https://github.com/JuanIgCuevas/dev-project-hub/actions/workflows/quality.yml)

Plataforma para que desarrolladores independientes organicen, gestionen y hagan seguimiento de sus proyectos personales.

## Producto

- Autenticacion con email y contrasena.
- Dashboard personal de proyectos.
- Creacion y seguimiento de proyectos.
- Tareas con estado y prioridad.
- Acceso seguro a los datos mediante Supabase RLS.
- Paginas publicas para compartir proyectos terminados.
- Interfaz en espanol e ingles, con tema claro y oscuro.
- Historial de sesiones Focus, decisiones tecnicas y memoria de avances.
- Aplicacion web instalable con aviso de conexion y acceso al contenido ya cargado.

## Puesta en marcha

1. Copia `.env.example` como `.env`.
2. Completa la URL y la clave publica de tu proyecto de Supabase.
3. Aplica en orden las migraciones disponibles en `supabase/migrations`.
4. Instala las dependencias con `npm install`.
5. Inicia la aplicacion con `npm run dev`.

## Calidad

Antes de compartir un cambio, ejecuta:

```bash
npm run check
```

Este comando revisa el codigo, ejecuta las pruebas automaticas y genera el
bundle de produccion. GitHub Actions repite los mismos controles en cada push
y pull request dirigido a `Development` o `main`.

## Aplicacion instalable

El modo instalable se activa solamente en builds de produccion. Para probarlo
localmente, ejecuta `npm run build` y luego `npm run preview`. El navegador
mostrara la opcion de instalacion cuando el sitio cumpla sus condiciones. Las
funciones que consultan Supabase siguen necesitando conexion a internet.

## Flujo de publicacion

- `Development`: integracion y previews para revisar cambios.
- `main`: version estable que Vercel publica en produccion.
- Los cambios pasan primero por un pull request y por el control `Quality / Validate application`.
- Vercel genera automaticamente una URL de preview para ramas que no sean la rama de produccion.
- Las variables de Supabase deben configurarse por separado en los entornos Preview y Production de Vercel.

Configuracion recomendada en GitHub para `main`:

1. Requerir un pull request antes de integrar cambios.
2. Requerir el control `Quality / Validate application` aprobado.
3. Bloquear integraciones mientras la rama este desactualizada.

## Acceso a datos

El frontend no accede directamente a las tablas de PostgreSQL. Todas las
lecturas y escrituras de datos de negocio deben implementarse como funciones
SQL seguras y consumirse mediante `supabase.rpc(...)`.

Las operaciones de identidad, sesiones, email y contrasena utilizan la API
oficial de Supabase Auth. ESLint bloquea nuevas llamadas `supabase.from(...)`
dentro del codigo fuente.
