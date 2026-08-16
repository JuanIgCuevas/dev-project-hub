# Publicar DevHub con confianza

Esta lista sirve para revisar un preview de `Development` y convertirlo en una
versión estable en `main`. No requiere instalar herramientas adicionales ni
activar servicios de seguimiento.

## 1. Preparar la revisión

- [ ] Confirmar que Supabase esté activo.
- [ ] Confirmar que Vercel haya creado el preview de `Development`.
- [ ] Revisar que las variables públicas de Supabase existan en el entorno de
      Vercel y que ninguna clave privada utilice `VITE_` o `NEXT_PUBLIC_`.
- [ ] Ejecutar `npm run release:check` en la computadora.
- [ ] Confirmar que la acción **Quality** de GitHub esté en verde.

## 2. Recorrido sin iniciar sesión

Abrir el preview en una ventana privada para comprobar la experiencia de una
persona nueva.

- [ ] La pantalla de acceso carga sin mensajes de configuración.
- [ ] El cambio entre español e inglés actualiza toda la interfaz visible.
- [ ] El modo claro y oscuro conserva contraste y legibilidad.
- [ ] `/demo` funciona sin crear una cuenta y permite recorrer sus secciones.
- [ ] Una dirección inexistente muestra la página 404 de DevHub.
- [ ] El favicon, el título y la imagen al compartir corresponden a DevHub.

## 3. Cuenta y datos

Usar una cuenta de prueba, nunca datos personales de otra persona.

- [ ] Crear una cuenta, cerrar sesión y volver a ingresar.
- [ ] Solicitar la recuperación de contraseña y comprobar el enlace recibido.
- [ ] Crear, editar y eliminar un proyecto de prueba.
- [ ] Crear tareas, cambiar su estado y revisar las vistas Lista y Kanban.
- [ ] Crear una idea y convertirla en proyecto.
- [ ] Iniciar y finalizar una sesión Focus; revisar que aparezca en el historial.
- [ ] Exportar los datos y comprobar que se descargue un archivo JSON.
- [ ] Probar el cierre de sesión únicamente con la cuenta de prueba.

La eliminación total de cuenta es permanente. Probarla solamente con una
cuenta creada específicamente para esa verificación.

## 4. Presentación pública

- [ ] Activar la página pública de un proyecto de prueba.
- [ ] Abrir el enlace en una ventana privada.
- [ ] Comprobar nombre, descripción, progreso, tecnologías e hitos.
- [ ] Verificar que repositorio y sitio abran en una pestaña nueva.
- [ ] Desactivar la publicación y confirmar que el enlace deje de mostrar datos.

## 5. Celular e instalación

- [ ] Revisar acceso, demo, proyectos, tareas, ideas y configuración en un ancho
      aproximado de 390 px.
- [ ] Confirmar que no exista desplazamiento horizontal.
- [ ] En Android, revisar la instalación desde Chrome.
- [ ] En iPhone/iPad, revisar **Compartir → Añadir a pantalla de inicio** en Safari.
- [ ] Abrir la aplicación instalada y comprobar su icono y pantalla inicial.
- [ ] Desconectar internet momentáneamente y verificar el aviso sin conexión.

## 6. Publicar la versión estable

- [ ] Crear un pull request desde `Development` hacia `main`.
- [ ] Revisar el resumen de cambios y la evidencia visual.
- [ ] Esperar a que todas las comprobaciones automáticas terminen correctamente.
- [ ] Integrar el pull request en `main`.
- [ ] Confirmar que el deployment de producción de Vercel finalice correctamente.
- [ ] Repetir en producción el recorrido sin sesión, el inicio de sesión y una
      operación de escritura sencilla.

## 7. Cierre y recuperación

- [ ] Guardar la dirección definitiva de producción en el portfolio y el README.
- [ ] Crear una versión `v1.0.0` cuando la revisión productiva esté aprobada.
- [ ] Si aparece un problema crítico, volver a desplegar desde Vercel el último
      deployment estable y corregir el problema primero en `Development`.

No es necesario activar analítica o monitoreo mientras DevHub sea una muestra
de portfolio. Esas herramientas pueden evaluarse cuando existan usuarios
reales y una necesidad concreta de medir o diagnosticar el producto.
