# Publicar la versión web en Cloudflare

Gradus web se sirve como archivos estáticos desde `dist/` con Cloudflare (`wrangler.jsonc`, `public/_headers`). Dominio: `graduschess.com` (comprado en Cloudflare, datos del titular ocultos). Correo público: `gradusstudioapp@gmail.com`.

## Antes de conectar
1. El código de la versión web está en la rama `web-v1`. Hay que fusionarla a `main` (o elegir otra rama de producción a propósito): `main` sin esa fusión no tiene el script `build:web` ni `public/_headers`.
2. El repositorio `GradusStudio/ajedrez-app` es privado y la GPL v3 pide que el código de lo publicado sea público. Antes de compartir el sitio: hacerlo público y etiquetar la versión (`web-v1.0.0`). Mientras sea privado, el enlace «Código de la app» de Créditos da 404.
3. `.node-version` fija Node 22 (wrangler lo necesita).

## Pasos en el panel de Cloudflare
1. Workers y Pages > Crear > Importar un repositorio. Conectar con la app de GitHub de Cloudflare: autorizar la cuenta `GradusStudio` y dar acceso al repositorio `ajedrez-app`.
2. Rama de producción: `main`. Nombre del Worker: `gradus` (igual que en `wrangler.jsonc`). Directorio raíz: el del repositorio.
3. Comando de compilación: `npm ci && npm run build:web`. Comando de despliegue: `npx wrangler deploy`. Las ramas que no son de producción usan `npx wrangler versions upload`.
4. Si el registro de compilación muestra otra versión de Node, agregar la variable de compilación `NODE_VERSION=22` en Ajustes > Compilación > Variables.
5. Tras el primer despliegue: Worker > Ajustes > Dominios y rutas > Agregar > Dominio personalizado > `graduschess.com`.
6. Si `wrangler deploy` rechaza `compatibility_date`, bajarla a la fecha que indique el mensaje (hoy es la del runtime incluido, 2026-11-04).

## Comprobaciones en producción
```bash
curl -sI https://graduschess.com/
curl -sI https://graduschess.com/sw.js
curl -sI https://graduschess.com/manifest.webmanifest
curl -sI https://graduschess.com/instalar
curl -sI https://graduschess.com/privacidad
curl -sI https://graduschess.com/leccion/u1-l02
```
- `/`, `/instalar`, `/privacidad` y las rutas profundas: 200 con `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` y `Permissions-Policy`.
- `/sw.js` y `/`: `Cache-Control: no-cache`. `/manifest.webmanifest`: `application/manifest+json`.
- Un archivo de `/_expo/static/js/web/` (tomar el nombre del código fuente de la página): `Cache-Control: public, max-age=31536000, immutable`.
- Un trozo que no existe debajo de `/_expo/static/` no debería devolver el `index.html` con 200: si lo hace, el service worker ya lo rechaza (`cacheWillUpdate`), pero conviene saberlo.
- Abrir el sitio en Chrome: consola sin avisos de CSP, instalar la app en el Redmi, escuchar una vez un sonido de jugada (se verificó que carga, no que se oiga) y activar HSTS desde el panel (SSL/TLS > Servidor perimetral > HSTS) cuando el sitio ande bien.

## Qué no hace la versión 1
Sin sincronización con Google Drive (versión 2) ni recordatorio diario (versión 3). El progreso vive en el navegador de cada dispositivo; Ajustes > Datos permite guardar y cargar una copia. En iPhone, Safari y la app instalada no comparten datos: por eso se ofrece instalar antes de empezar y se recuerda guardar una copia.

## Probar la rama en el Redmi con Expo Go
La versión web sube el progreso guardado a la versión 4 y lo guarda al abrir. Expo Go comparte almacenamiento entre ramas: si se prueba `web-v1` en el teléfono y después se vuelve a `main`, `main` lee la versión 4 como dañada y el progreso queda en la clave de respaldo. Fusionar a `main` antes de probar en el teléfono, o no volver a una rama vieja con el mismo Expo Go.
