# Seguridad de DevHub

## Versiones cubiertas

La rama `main` representa la version estable. La rama `Development` se utiliza
para integrar y validar los cambios antes de publicarlos.

## Reportar una vulnerabilidad

No publiques detalles sensibles en un issue abierto. Utiliza **Security >
Advisories > Report a vulnerability** en el repositorio de GitHub para enviar
un reporte privado.

Inclui, cuando sea posible:

- la pantalla o funcion afectada;
- los pasos necesarios para reproducir el problema;
- el impacto esperado;
- una prueba de concepto que no contenga datos personales ni credenciales.

Nunca incluyas contrasenas, tokens, claves de Supabase o datos reales de otros
usuarios. El reporte se revisara antes de publicar cualquier detalle.

## Alcance

DevHub utiliza una clave publica de Supabase en el navegador. La seguridad de
los datos depende de las politicas RLS y de las funciones SQL incluidas en las
migraciones. Una `service_role` o cualquier otra clave privada nunca debe
exponerse mediante variables `VITE_*` o `NEXT_PUBLIC_*`.
