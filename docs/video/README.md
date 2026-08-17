# Video corto de producto

`devhub-product-demo-50s.mp4` presenta el recorrido de DevHub en 49,9 segundos:

1. capturar una idea;
2. convertirla en proyecto;
3. definir tareas concretas;
4. trabajar con una sesión Focus;
5. registrar el resultado.

## Formato

- MP4 con video H.264.
- 1080 × 1350 px, relación 4:5.
- 30 cuadros por segundo.
- Diseñado para LinkedIn y para insertarse en un portfolio.
- Sin audio: todos los mensajes importantes están incorporados visualmente y
  funcionan con reproducción automática silenciada.

La portada está disponible en `devhub-product-demo-cover.png`.

## Regenerarlo

Las capturas y escenas se conservan para poder modificar textos o tiempos. El
renderizador no agrega dependencias al proyecto: utiliza un entorno temporal.

```powershell
python -m pip install --target .tmp-video-tools pillow imageio-ffmpeg
python docs/video/render_product_video.py
Remove-Item .tmp-video-tools -Recurse
```

## Publicarlo

En LinkedIn conviene subir directamente el archivo MP4 en lugar de compartir un
enlace externo. Luego de desplegar `main`, también estará disponible en:

`https://dev-project-hub.vercel.app/video/devhub-product-demo-50s.mp4`

Para el portfolio puede utilizarse:

```html
<video controls poster="/video/devhub-product-demo-cover.png" playsinline>
  <source src="/video/devhub-product-demo-50s.mp4" type="video/mp4" />
</video>
```

## Texto de apoyo sugerido

> Una idea no necesita más ruido: necesita contexto y un próximo paso. DevHub
> reúne ideas, proyectos, tareas y sesiones Focus para convertir el proceso en
> algo que también se pueda mostrar. Demo: https://dev-project-hub.vercel.app/demo
