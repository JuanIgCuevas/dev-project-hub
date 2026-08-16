# DevHub — caso de estudio

## Resumen

DevHub es una plataforma para desarrolladores independientes que centraliza
proyectos, tareas, ideas y sesiones de foco. Su objetivo es reducir la fricción
entre tener una idea y llevarla a una versión que pueda publicarse y mostrarse.

## Desafío

En un proyecto personal, la información suele quedar dispersa entre un gestor
de tareas, notas, commits y memoria. Después de una pausa cuesta reconstruir qué
se hizo, por qué se tomaron ciertas decisiones y cuál debería ser el próximo
paso. Un tablero tradicional registra trabajo, pero no conserva suficientemente
el contexto.

## Solución

Diseñé DevHub alrededor de tres preguntas:

1. ¿Qué estoy construyendo?
2. ¿Qué debería hacer ahora?
3. ¿Cómo puedo mostrar el proceso cuando termine?

La plataforma combina un dashboard de prioridades, Project Pulse, sesiones
Focus, memoria de avances, decisiones técnicas y páginas públicas por proyecto.
Una demo interactiva permite conocer el producto sin crear una cuenta.

## Decisiones principales

### Una interfaz con identidad

El sistema visual utiliza una estética técnica, alto contraste, grillas sutiles
y verde eléctrico como color de acción. Los temas claro y oscuro comparten los
mismos tokens para conservar jerarquía y legibilidad.

### Seguridad en la capa de datos

El frontend utiliza funciones RPC en lugar de consultar directamente las
tablas. PostgreSQL y Row Level Security aíslan la información por usuario. La
configuración de Vercel suma CSP, restricciones de permisos y protecciones para
enlaces externos.

### Calidad como parte del producto

Las funciones críticas cuentan con pruebas automáticas. GitHub Actions ejecuta
lint, tests, auditoría de dependencias y build antes de integrar cambios. La
rama `Development` recibe previews y `main` representa la versión estable.

### Una demo sin fricción

La ruta `/demo` utiliza datos ficticios y permite recorrer el dashboard,
proyectos, tareas e ideas. Esto reduce el costo de explicar el producto y evita
pedir un registro antes de demostrar su valor.

## Resultado actual

- Experiencia responsive en español e inglés.
- Tema claro, oscuro y preferencia del sistema.
- PWA instalable con estado de conexión y actualizaciones.
- Gestión de proyectos, tareas e ideas.
- Sesiones Focus, memoria de avances y Project Pulse.
- Presentaciones públicas por proyecto.
- Exportación de datos y controles de cuenta.
- Pipeline automatico de calidad y seguridad.

## Proximos pasos posibles

- Validar los flujos con usuarios reales antes de ampliar funcionalidades.
- Medir activación y uso solo cuando exista una etapa productiva.
- Mejorar la experiencia offline de los datos, no solamente del shell visual.
- Incorporar integraciones externas según necesidades observadas.

## Texto corto para portfolio

> Diseñé y desarrollé DevHub, una plataforma full-stack para que developers
> independientes organicen proyectos, mantengan el contexto y conviertan su
> proceso en una historia compartible. Construida con React, TypeScript,
> Supabase y PostgreSQL, incluye autenticación, RLS, sesiones Focus, una demo
> interactiva, páginas públicas, PWA y un pipeline automatizado de calidad.
