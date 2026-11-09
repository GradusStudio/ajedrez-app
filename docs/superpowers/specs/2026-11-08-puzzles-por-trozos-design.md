# Toda la base de puzzles de Lichess, por trozos

Fecha: 8-11-2026. Estado: **borrador, espera aprobación**. Las decisiones que tiene que tomar el usuario están en la sección 11.

## 1. Problema

Hoy la app trae 50.000 puzzles elegidos de la base abierta de Lichess (`src/puzzles/lichess-puzzles.json`, 6,76 MB). En la web ese archivo es un trozo aparte: se baja entero la primera vez que se entra a Puzzles y queda en la caché `gradus-heavy` del service worker. Así anda sin conexión, pero no escala: la base completa no entra en un archivo ni en la memoria del celular.

Objetivo: en la web, ofrecer **toda la base** y bajar solo los puzzles que se van a usar, en trozos chicos, sin perder lo que ya funciona:

- el uso sin conexión con lo ya bajado (la PWA instalada abre y juega sin internet);
- la app nativa (Expo Go no tiene ni el service worker ni esta forma de cargar);
- el progreso guardado (`progress.puzzles`, por id de puzzle).

## 2. La base real (medida el 8-11-2026)

Archivo `C:\dev\datos-lichess\lichess_db_puzzle.csv.zst` (293 MB comprimido, 1.087 MB descomprimido), leído entero con un script de prueba en 81 s.

| Dato | Valor |
|---|---|
| Puzzles | **6.157.341** |
| Rating | 399 a 3323 |
| Entre 500 y 2500 y hasta 8 jugadas (los criterios de hoy, sin filtro de calidad) | 5.720.259 |
| Con el filtro de calidad de hoy (popularidad ≥ 85, ≥ 1.000 partidas, desviación ≤ 80) | 1.438.195 |
| Con un filtro mínimo (popularidad ≥ 50, ≥ 100 partidas, desviación ≤ 110) | 4.698.481 |
| Con más de 8 jugadas | 145.956 (el más largo pasa de 10) |
| Popularidad negativa | 55 |

Por nivel de la práctica (todos los puzzles):

| Nivel | Rating | Puzzles |
|---|---|---|
| Fácil | menos de 1200 | 2.283.229 (101.446 están por debajo de 500) |
| Medio | 1200 a 1799 | 2.132.233 |
| Difícil | 1800 a 2499 | 1.508.693 |
| Por encima de 2500 | 2500 a 3323 | 233.186 |

El tema de Práctica con menos puzzles, sin contar los de más de 2500, es «Mate del pasillo» en Difícil: 1.730 (hoy son 50).

**Tamaño en el formato de hoy** (`[id, fen, jugadas, rating, temas]`): 796 MB en JSON. Comprimido: gzip lo deja en 34 % (≈ 270 MB) y brotli en 26 % (≈ 207 MB). Un trozo de 500 puzzles pesa 68 KB y viaja como 25 KB con gzip.

## 3. Cómo se parte

### Formato de cada puzzle
El mismo de hoy, con los temas como números (posición en `themes.json` › `known`) para ahorrar un cuarto del tamaño:

```json
["5mYWI", "4kr2/p4p2/4p3/4Pp1Q/q1pR1PPP/1pP5/1P6/2K5 w - - 0 33", "h5g5 a4a1 c1d2 a1b2 d2d1 b2c2 d1e1 c2c3", 1300, [53, 11, 41, 33, 51]]
```
(Hoy los temas de ese puzzle se guardan como texto: `"crushing deflection endgame queensideAttack veryLong"`.)

### Grupos
Cada puzzle va a un grupo por **nivel** y por **tema**:

- `todos`: todos los puzzles del nivel (cada uno una sola vez).
- uno por cada tema de Práctica (`themes.json` › `practice`, 15 temas): los puzzles del nivel que tienen ese tema.

Un puzzle con dos temas de Práctica aparece en `todos` y en los dos grupos. Se duplica a propósito: es la única forma de que «Difícil · Mate del pasillo» pida un trozo y encuentre 1.000 puzzles de ese tema, en vez de bajar 100 trozos de `todos` para encontrar uno. Contando las copias son 14,2 millones de entradas.

### Trozos
Cada grupo se corta en trozos de **1.000 puzzles** (≈ 110 KB; ≈ 40 KB por la red, comprimido). Dentro de cada grupo:

1. Los puzzles se ordenan por **calidad**, en tres capas: A (el filtro de hoy), B (el filtro mínimo de la tabla) y C (el resto). Cada trozo tiene puzzles de una sola capa.
2. Dentro de cada capa se mezclan con una semilla fija, para que un trozo no sean 1.000 puzzles del mismo rating ni de la misma partida, y para que dos armados seguidos den los mismos archivos.
3. Cada puzzle se comprueba con chess.js (todas sus jugadas legales), como hoy. Los que fallan se descartan y se cuentan.

Rutas: `v1/<nivel>/<grupo>/<n>.json` (ej. `v1/medio/fork/37.json`). El `v1` cambia si se vuelve a armar la base con otro formato o con otros grupos.

### Índice
`src/puzzles/manifest.json`, generado por el script y guardado en git (unos pocos KB): versión, dirección de los trozos y, por nivel y grupo, cuántos puzzles hay y cuántos trozos tiene cada capa. Va **dentro de la app**: así la pantalla de Práctica muestra cuántos puzzles hay de cada tema sin conexión y sin esperar a la red.

### Puzzle del día
Tiene que seguir siendo **el mismo para todos y el mismo que hoy**, también en la app nativa y para quien ya lo resolvió hoy. El script arma un archivo por año, `v1/dia/2026.json` (366 puzzles, ≈ 50 KB), aplicando la fórmula de hoy (`dailyPuzzle`) sobre el mismo grupo de 15.000 puzzles de nivel 1000–1600 de `lichess-puzzles.json`. Se generan los años 2026 a 2075. Una prueba compara el archivo con `dailyPuzzle` para todos los días de 2026 y 2027.

## 4. Dónde se alojan

### Lo que dice la documentación de Cloudflare (consultada el 8-11-2026)
- Recursos estáticos de un Worker: **20.000 archivos por versión en el plan gratis** (100.000 en el pago, con wrangler 4.34 o posterior) y **25 MiB por archivo**. Los pedidos a recursos estáticos son gratis e ilimitados. (developers.cloudflare.com/workers/platform/limits/#static-assets)
- Con `run_worker_first`, cada pedido que coincide pasa por el código del Worker y cuenta para el límite gratis de 100.000 pedidos por día; pasado el límite, esos pedidos reciben un error 429. (developers.cloudflare.com/workers/static-assets/billing-and-limitations/)
- R2 gratis: 10 GB guardados, 1 millón de escrituras y 10 millones de lecturas por mes, salida sin costo. Wrangler sube un objeto por vez; para miles de archivos recomiendan rclone u otra herramienta S3, con una clave de API de R2. (developers.cloudflare.com/r2/pricing/, /r2/objects/upload-objects/)

### El problema de fondo
Hoy Cloudflare compila el sitio desde GitHub (`npm ci && npm run build:web`). Los trozos (≈ 1,5 GB) no pueden ir en git, y el archivo de Lichess de 293 MB no está en la compilación de Cloudflare. Por eso los trozos **no pueden ir dentro de `dist/`** del Worker `gradus`: hay que armarlos en la PC y subirlos aparte.

### Opción recomendada: un segundo Worker solo con archivos, en `puzzles.graduschess.com`
- Un Worker nuevo, `gradus-puzzles`, sin código: solo recursos estáticos (la carpeta de trozos). Se publica desde la PC con `npx wrangler deploy -c wrangler.puzzles.jsonc` después de armar los trozos. No pasa por GitHub.
- Cuántos archivos: 6.157 (`todos`) + 8.077 (temas) + unos 200 trozos incompletos (el último de cada grupo y capa) + 50 años del puzzle del día ≈ **14.500**, debajo de los 20.000 del plan gratis. Si la base crece y se acerca al límite, se suben los trozos a 1.500 puzzles.
- Costo: cero. Los pedidos a archivos estáticos son ilimitados y no cuentan como pedidos al Worker.
- Lo que cambia en el sitio: la CSP de `public/_headers` suma `https://puzzles.graduschess.com` en `connect-src`. El Worker de puzzles responde con `Access-Control-Allow-Origin: *` (son datos CC0, públicos), `Cache-Control: public, max-age=31536000, immutable` (las rutas llevan versión) y `X-Robots-Tag: noindex`.
- El código de la app sigue siendo libre: el script que arma los trozos está en el repositorio, y los datos son CC0.
- Primera subida: ≈ 1,5 GB desde la PC (una vez; después wrangler sube solo los archivos que cambiaron).

### Alternativa: R2 detrás del Worker de siempre, en la misma dirección
Un balde R2 `gradus-puzzles` y unas líneas de código en el Worker `gradus` con `run_worker_first: ["/app/puzzles/*"]`. Ventajas: misma dirección (sin tocar la CSP ni CORS) y sin límite de archivos. En contra: hace falta activar R2 en la cuenta, crear una clave de API de R2 y guardarla fuera de git para subir los 14.500 archivos con rclone, escribir y probar código de Worker, y cada trozo pedido cuenta para los 100.000 pedidos diarios gratis. Conviene si algún día se pasa del límite de archivos.

## 5. Cómo elige la app (web)

### Práctica
1. Con el nivel y el tema elegidos (o `todos`), mira en el índice la primera capa de calidad que tiene trozos.
2. Elige un trozo al azar de esa capa y lo pide (o lo saca de la caché).
3. Dentro del trozo, elige al azar uno **pendiente**: que no esté resuelto (`isPuzzleSolved`, como hoy; los que se miraron con «Ver solución» siguen pendientes) y que no haya salido ya en esta sesión.
4. Si en ese trozo no queda ninguno pendiente, prueba con otro trozo (hasta 3 intentos). Si tampoco, acepta uno repetido, como hoy cuando se resolvieron todos.
5. El trozo queda en memoria: «Siguiente puzzle» sale de ahí sin esperar, y cuando quedan pocos pendientes se pide el siguiente de antemano.

La capa B se usa recién cuando en la capa A de ese nivel y tema no quedan trozos con pendientes, y lo mismo con la C. En la práctica, casi nadie pasa de la capa A (1,4 millones de puzzles).

### Repetidos
Con 1.000 puzzles por trozo y cientos o miles de trozos por grupo, que salga dos veces el mismo es muy raro; los pasos 3 y 4 lo evitan del todo para los resueltos. No hace falta guardar nada nuevo: el progreso ya dice qué puzzles se resolvieron.

### Un puzzle por id
`/puzzle?id=...` se usa para el puzzle del día. En la web se busca en el archivo del año y en los trozos que ya están en memoria. Si no aparece (un enlace viejo escrito a mano), vuelve a la pestaña Puzzles, como hoy.

## 6. Sin conexión

Lo que funciona hoy tiene que seguir funcionando: la PWA instalada abre sin internet y se puede jugar con lo ya bajado.

- El service worker (`scripts/build-sw.js`) guarda cada trozo que se pide de `puzzles.graduschess.com` en una caché propia, `gradus-puzzles`, con CacheFirst y un máximo de **60 trozos** (≈ 6,5 MB; los menos usados se borran solos). Solo guarda respuestas 200 que no sean HTML (el mismo control que `heavyCachePlugin`).
- **Reserva**: cuando se abre la pestaña Puzzles con conexión, la app baja en segundo plano lo que necesitaría sin conexión: el archivo del puzzle del día de este año (y el del año siguiente desde diciembre) y un trozo de `todos` de cada nivel. Son 4 o 5 pedidos de ≈ 40 KB.
- **Sin red**: la app busca un trozo en este orden: el pedido; cualquier trozo ya guardado del mismo nivel y tema; cualquier trozo guardado de `todos` del mismo nivel, filtrando por el tema. Con la reserva, siempre hay al menos 1.000 puzzles por nivel sin conexión, aunque se repitan antes.
- Si no hay nada guardado para lo pedido (nunca se abrió Puzzles con conexión), la pantalla de error de siempre (`PuzzlesStatus`) con un texto nuevo: «Sin conexión. Los puzzles se bajan de a poco: conectate una vez para tener puzzles guardados.» (en los cinco idiomas; de, it y fr con gemma4).
- Quien ya tiene la PWA: la versión nueva deja de pedir el trozo de los 50.000; la caché `gradus-heavy` lo borra sola (guarda solo los últimos usados) y pasa a tener solo las tres redes de Maia.

## 7. La app nativa (Expo Go y APK)

No cambia: sigue trayendo los 50.000 puzzles adentro y funciona sin conexión.

- La carga se separa por plataforma, como el resto de lo propio de la web: `puzzleSource.ts` (nativo, lee `lichess-puzzles.json`) y `puzzleSource.web.ts` (trozos). Las dos ofrecen lo mismo: puzzle del día, siguiente de práctica, puzzle por id y cuántos hay por nivel y tema. Las pantallas (`PuzzlesScreen`, `app/puzzle.tsx`) pasan a usar esa interfaz en vez de recibir la lista entera.
- La web deja de incluir `lichess-puzzles.json`: la app web pesa 6,8 MB menos.
- La cuenta de «cuántos puzzles hay» en nativo sigue saliendo de la lista de 50.000; en la web, del índice.
- Más adelante, la app nativa podría pedir trozos a `puzzles.graduschess.com` cuando tiene conexión (sin CSP ni CORS en nativo). Queda fuera de este trabajo.

## 8. Progreso guardado

- Los ids son los de Lichess y no cambian. Los 50.000 de hoy salen del mismo archivo, así que están todos en la base completa (el script lo comprueba y avisa si falta alguno). Nada que migrar: `progress.puzzles`, las monedas, la racha y las copias de Ajustes > Datos siguen igual, y una copia hecha en el celular se carga en la web sin problemas.
- Límite conocido: en la web el progreso vive en el almacenamiento del navegador (unos 5 MB por sitio). Cada puzzle resuelto ocupa unos 55 bytes, así que caben del orden de 80.000 puzzles resueltos. Con 50.000 nunca importó; con millones podría importar algún día. No se cambia ahora: se anota en `docs/puzzles.md` como pendiente (guardar los puzzles resueltos en un formato más compacto).

## 9. Qué se programa

1. **`scripts/build-puzzles.js`**: arma los trozos en una carpeta fuera del proyecto (`C:\dev\datos-lichess\trozos\`, por defecto), el índice `src/puzzles/manifest.json` y los archivos del puzzle del día. Sigue generando `lichess-puzzles.json` para la app nativa, igual que hoy. La lógica de repartir en grupos, capas y trozos va en un módulo puro (`scripts/puzzleShards.js`) para poder probarla. Opción `--muestra N` para armar un juego chico de prueba.
2. **`wrangler.puzzles.jsonc`** y `puzzles-public/_headers` (CORS, caché, noindex) para el Worker `gradus-puzzles`, y los pasos para publicarlo en `docs/web/publicar-en-cloudflare.md`.
3. **App**: `src/puzzles/puzzleSource.ts` y `.web.ts`, el elegido de trozos (`src/puzzles/chunks.ts`, puro), la reserva para sin conexión, el texto nuevo en los cinco idiomas y el cambio de las dos pantallas.
4. **Service worker**: `build-sw.js` espera 3 trozos pesados (las redes de Maia), ya no 4, y suma la regla de `gradus-puzzles`. Se actualiza `swChecks.test.ts`.
5. **CSP**: `connect-src` suma `https://puzzles.graduschess.com`.
6. **Pruebas** (`npm test`): reparto en grupos, capas y trozos (cada puzzle en `todos` una vez y en cada uno de sus temas; nada se pierde ni se duplica dentro de un grupo); el índice coincide con los trozos; el puzzle del día de los archivos coincide con `dailyPuzzle` en 2026 y 2027; elección de pendientes, reintentos y caída a repetidos; el orden de búsqueda sin conexión.
7. **Comprobación en el navegador**: `npm run build:web` y `wrangler dev` de la app (puerto 8788) más un `wrangler dev` del Worker de puzzles con un juego de muestra (puerto 8789). Para esa prueba, la compilación local apunta los trozos a `http://localhost:8789` y la CSP de prueba lo permite (solo en la compilación local; la de producción falla si encuentra `localhost`). Se prueba: puzzle del día, práctica por nivel y tema, «Siguiente puzzle», y sin conexión (desconectando la red en el navegador) con lo ya bajado.
8. **Documentos**: `docs/puzzles.md` y `CLAUDE.md`.

Fuera de este trabajo: publicar de verdad el Worker de puzzles y el dominio `puzzles.graduschess.com` (lo hace el usuario cuando publique el sitio, con los pasos del documento), el rating de puzzles del usuario y los puzzles por trozos en la app nativa.

## 10. Riesgos

- **Subida de 1,5 GB** desde la PC la primera vez: puede tardar. Si molesta, se baja con la capa C fuera (ver decisión 1).
- **Volver a armar la base** cambia el contenido de los trozos: se publica como `v2` y el índice nuevo va con la versión nueva de la app. Una pestaña abierta con la versión vieja pediría trozos `v1` que ya no están (el Worker publica una carpeta entera por vez): verá el error y «Reintentar» aplica la versión nueva, como ya hace `PuzzlesStatus`.
- **Límite de 20.000 archivos**: hoy se usa el 73 %. Una prueba del script falla si pasa de 18.000.
- **El puzzle del día no puede cambiar**: lo cuida la prueba que lo compara con `dailyPuzzle`.

## 11. Decisiones para el usuario

1. **¿Qué parte de la base?**
   - (Recomendado) **Toda** (6,16 millones), con la calidad en capas: primero se juegan los de calidad alta y los demás quedan de reserva.
   - Solo las capas A y B (4,7 millones): sube menos datos y deja fuera los puzzles con pocas partidas o rating dudoso.
2. **Puzzles por encima de 2500 (233.000) y por debajo de 500 (101.000).**
   - (Recomendado) Los de menos de 500 entran en Fácil. Los de más de 2500 forman un nivel nuevo, **Experto**, con su botón en Práctica (un texto nuevo en los cinco idiomas).
   - Sin nivel nuevo: Difícil pasa a ser «1800 o más».
3. **Puzzles largos (más de 8 jugadas, 146.000).** (Recomendado) Entran: el tablero ya los soporta. La otra opción es dejarlos fuera como hoy.
4. **Dónde se alojan.** (Recomendado) El segundo Worker solo con archivos en `puzzles.graduschess.com` (sección 4). La otra opción es R2.
