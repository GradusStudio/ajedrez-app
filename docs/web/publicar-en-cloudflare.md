# Publicar la versión web en Cloudflare

Gradus web se sirve como archivos estáticos desde `dist/` con Cloudflare (`wrangler.jsonc`, `public/_headers`).

**Desde el 8-11-2026 la raíz es la portada y la app vive en `/app`** (spec: `docs/superpowers/specs/2026-11-08-portada-y-bienvenida-design.md`). `npm run build:web` exporta la app a `dist/app` (`experiments.baseUrl` en `app.json`), arma la portada estática desde `sitio/` con `scripts/build-portada.ts` y genera `dist/app/sw.js` (solo controla `/app/`). Cloudflare usa `not_found_handling: "404-page"`: una ruta de la app que no es un archivo (`/app/leccion/u1-l02`) recibe `dist/app/404.html`, que es el HTML de la app (responde con estado 404, pero la página funciona; `instalar`, `privacidad` y `terminos` tienen su propio `.html` y responden 200). Las rutas viejas de la raíz redirigen a `/app/...` (`public/_redirects`). La portada manda directo a `/app/` a quien tiene la app instalada o progreso guardado; con `?portada` se ve igual.

Para probar lo compilado en la PC como lo sirve Cloudflare: `npm run build:web` y después `npx wrangler dev -c wrangler.local.jsonc --port 8788` (en el navegador integrado: la configuración `web-compilada` de `.claude/launch.json`). Dominio: `graduschess.com` (comprado en Cloudflare, datos del titular ocultos). Correo público: `gradusstudioapp@gmail.com`.

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

## Puzzles: el Worker `gradus-puzzles` (puzzles.graduschess.com)
La web saca los puzzles de la base completa de Lichess (6,16 millones), partida en 14.388 archivos (1,5 GB) que no van en git ni en la compilación de Cloudflare. Se publican desde la PC en un segundo Worker, sin código, solo con archivos (gratis: los pedidos a archivos estáticos no tienen límite; el plan gratis admite 20.000 archivos por versión). Hay que hacerlo **antes** de abrir el sitio: sin él, Puzzles muestra el error de carga.
1. Armar los trozos (una vez, o cuando cambie la base): `npm run build:puzzles -- C:\dev\datos-lichess\lichess_db_puzzle.csv.zst`. Tarda unos 5 minutos y deja todo en `C:\dev\datos-lichess\trozos` (con su `_headers`). Si cambia `src/puzzles/manifest.json`, guardarlo en git: la app tiene que coincidir con los trozos publicados.
2. Iniciar sesión en wrangler (una vez): `npx wrangler login`.
3. Publicar: `npx wrangler deploy -c wrangler.puzzles.jsonc`. La primera vez sube 1,5 GB y puede tardar; después sube solo lo que cambió.
4. El dominio `puzzles.graduschess.com` se conecta solo al publicar (`routes` en `wrangler.puzzles.jsonc`). Si falla, conectarlo a mano: panel de Cloudflare > Worker `gradus-puzzles` > Ajustes > Dominios y rutas > Agregar > Dominio personalizado.
5. Comprobar: `curl -sI https://puzzles.graduschess.com/v1/dia/2026.json` da 200 con `Access-Control-Allow-Origin: *`, `Cache-Control: public, max-age=31536000, immutable` y `X-Robots-Tag: noindex`.

Si algún día se vuelve a armar la base con otro formato, se publica como `v2` (constante `VERSION` de `scripts/build-puzzles.js`) junto con la versión de la app que trae el índice nuevo.

## Servidor de sincronización: el Worker `gradus-sync` (sync.graduschess.com)

Guarda el progreso por llave (solo el SHA-256 de la llave, el texto del progreso, la versión y la fecha). Código en `workers/sync/`, configuración en `wrangler.sync.jsonc`. Todo se hace desde la PC, una sola vez:

1. Crear la base: `npx wrangler d1 create gradus-sync`. Copiar el `database_id` que muestra y pegarlo en `wrangler.sync.jsonc`.
2. Crear la tabla: `npx wrangler d1 execute gradus-sync --remote --file workers/sync/schema.sql`.
3. Publicar: `npx wrangler deploy -c wrangler.sync.jsonc` (el dominio `sync.graduschess.com` se conecta solo).

Para probar en la PC: `npx wrangler d1 execute gradus-sync --local --file workers/sync/schema.sql` y `npx wrangler dev -c wrangler.sync.jsonc --port 8790`. Las pruebas del manejador corren con `npm test`.

## Comprobaciones en producción
```bash
curl -sI https://graduschess.com/
curl -sI https://graduschess.com/app/
curl -sI https://graduschess.com/app/sw.js
curl -sI https://graduschess.com/app/manifest.webmanifest
curl -sI https://graduschess.com/app/instalar
curl -sI https://graduschess.com/app/privacidad
curl -sI https://graduschess.com/app/leccion/u1-l02
curl -sI https://graduschess.com/leccion/u1-l02
```
- `/`, `/app/`, `/app/instalar` y `/app/privacidad`: 200; `/app/leccion/u1-l02`: 404 con el HTML de la app; `/leccion/u1-l02`: 301 a `/app/leccion/u1-l02`. Todas con `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` y `Permissions-Policy`.
- `/app/sw.js`, `/app/` y `/`: `Cache-Control: no-cache`. `/app/manifest.webmanifest`: `application/manifest+json`.
- Un archivo de `/app/_expo/static/js/web/` (tomar el nombre del código fuente de la página): `Cache-Control: public, max-age=31536000, immutable`.
- Un trozo que no existe debajo de `/app/_expo/static/` no debería devolver un HTML con 200: si lo hace, el service worker ya lo rechaza (`cacheWillUpdate`), pero conviene saberlo.
- Abrir el sitio en Chrome: consola sin avisos de CSP, instalar la app en el Redmi, escuchar una vez un sonido de jugada (se verificó que carga, no que se oiga) y activar HSTS desde el panel (SSL/TLS > Servidor perimetral > HSTS) cuando el sitio ande bien.

## Qué no hace la versión 1
Sin sincronización con Google Drive (versión 2) ni recordatorio diario (versión 3). El progreso vive en el navegador de cada dispositivo; Ajustes > Datos permite guardar y cargar una copia. En iPhone, Safari y la app instalada no comparten datos: por eso se ofrece instalar antes de empezar y se recuerda guardar una copia.

## Probar la rama en el Redmi con Expo Go
La versión web sube el progreso guardado a la versión 4 y lo guarda al abrir. Expo Go comparte almacenamiento entre ramas: si se prueba `web-v1` en el teléfono y después se vuelve a `main`, `main` lee la versión 4 como dañada y el progreso queda en la clave de respaldo. Fusionar a `main` antes de probar en el teléfono, o no volver a una rama vieja con el mismo Expo Go.
