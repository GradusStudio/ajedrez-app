# Puzzles

## Origen y licencia
- **Base abierta de puzzles de Lichess:** https://database.lichess.org/#puzzles. Tiene 6.157.341 puzzles (archivo del 2 de octubre de 2026, 293 MB comprimido).
- **Licencia CC0** (dominio público): se puede usar, modificar y redistribuir sin pedir permiso, en una app gratuita o comercial, abierta o cerrada. No exige crédito, pero lo damos igual: la pantalla del puzzle muestra "Puzzle #id de Lichess" con enlace, y Créditos (hito 6) debe mencionarlo.

## Dos fuentes: la app nativa y la web
- **Celular (Expo Go y APK):** los 50.000 de `lichess-puzzles.json` vienen dentro de la app y funcionan sin conexión (`src/puzzles/puzzleSource.ts`).
- **Web (desde el 9-11-2026):** la **base completa** (6.157.341 puzzles), partida en trozos de 1.000 que se piden a `puzzles.graduschess.com` a medida que se usan (`puzzleSource.web.ts` y `chunks.ts`). La web ya no incluye `lichess-puzzles.json` (pesa 6,8 MB menos). Spec: `docs/superpowers/specs/2026-11-08-puzzles-por-trozos-design.md`.

Las dos ofrecen lo mismo a las pantallas (`PuzzleSource` en `src/puzzles/source.ts`): puzzle del día, siguiente de práctica, puzzle por id y cuántos hay por nivel y tema.

## La base completa por trozos (web)
La arma el mismo `npm run build:puzzles` (unos 5 minutos; valida cada puzzle con chess.js en 16 hilos, `scripts/puzzleValidator.js`). Reparto en `scripts/puzzleShards.js` (probado en `puzzleShards.test.ts`):
- **Formato:** `[id, fen, jugadas, rating, temas]`, con los temas como números (posición en `themes.json` › `known`, copiada en el índice). **No cambiar el orden de `known` sin armar una versión nueva** (`v2`).
- **Niveles:** Fácil (menos de 1200, incluye los de menos de 500), Medio (1200–1799), Difícil (1800–2499) y **Experto** (2500 o más; solo en la web: en el celular el botón no aparece porque la lista llega a 2500). Entran también los de más de 8 jugadas.
- **Grupos:** por nivel, `todos` y uno por cada tema de Práctica. Un puzzle con dos temas de Práctica está en `todos` y en los dos grupos (14,2 millones de entradas en total).
- **Capas de calidad**, dentro de cada grupo: A (popularidad ≥ 85, ≥ 1.000 partidas, desviación ≤ 80), B (≥ 50, ≥ 100, ≤ 110) y C (el resto). Cada trozo es de una sola capa, mezclada con semilla fija (dos armados dan los mismos archivos). Los trozos de un grupo se numeran seguidos: primero los de A.
- **Archivos:** `v1/<nivel>/<grupo>/<n>.json` (≈ 110 KB, ≈ 40 KB comprimido) y el puzzle del día por año, `v1/dia/<año>.json` (2026 a 2075), hecho con la fórmula de `dailyPuzzle` sobre los 15.000 de nivel 1000–1599 de `lichess-puzzles.json`: es el mismo que en el celular (lo comprueba una prueba para cada día de 2026 y 2027). 14.388 archivos, 1,5 GB, en `C:\dev\datos-lichess\trozos` (fuera del proyecto). El armado falla si pasa de 18.000 archivos (Cloudflare admite 20.000).
- **Índice:** `src/puzzles/manifest.json` (5 KB, en git): versión, dirección, temas y, por nivel y grupo, cuántos puzzles hay en cada capa. Así la pantalla de Práctica muestra cuántos hay sin conexión.
- Medido el 9-11-2026: ningún puzzle con jugadas ilegales; los 50.000 de la app nativa están todos en la base. Cantidades por nivel: Fácil 2.283.229, Medio 2.132.233, Difícil 1.508.693, Experto 233.186. Si la selección de 50.000 no cambia, el script no reescribe `lichess-puzzles.json`.
- `--muestra N` arma solo los primeros N (sin tocar `src/`; el índice queda en la carpeta de salida) y `--salida <carpeta>` cambia la carpeta.
- Se publican en el Worker `gradus-puzzles` (`wrangler.puzzles.jsonc`, cabeceras en `puzzles-public/_headers`): pasos en `docs/web/publicar-en-cloudflare.md`.

**Cómo elige la web** (`createChunkSource` en `chunks.ts`, probado en `chunks.test.ts`): con el nivel y el tema, toma un trozo al azar de la mejor capa que tenga trozos sin probar y, dentro, uno pendiente (no resuelto ni visto en esta sesión). Si el trozo no tiene pendientes, prueba otro (hasta 3) y si no, acepta uno repetido. Los trozos quedan en memoria (12), así que «Siguiente puzzle» sale sin esperar, y cuando quedan menos de 10 pendientes se pide otro de antemano.

**Sin conexión:** el service worker guarda cada trozo pedido en la caché `gradus-puzzles` (los 60 más usados, ≈ 6,5 MB). Al abrir la pestaña Puzzles con conexión, la app baja en segundo plano el archivo del año (y el del siguiente en diciembre) y un trozo de `todos` de cada nivel que no tenga uno guardado. Sin red busca: el trozo pedido; uno guardado del mismo nivel y tema; uno guardado de `todos` del nivel, filtrando por el tema. Si no hay nada, muestra «Sin conexión. Los puzzles se bajan de a poco…». La primera visita (antes de que el service worker tome el control) no guarda nada: la reserva se completa en la siguiente.

**Probar en la PC:** `npx wrangler dev -c wrangler.puzzles.jsonc --port 8789` (configuración `puzzles-trozos` de `.claude/launch.json`), compilar con `EXPO_PUBLIC_PUZZLES_URL=http://localhost:8789/ npm run build:web` (en Git Bash) y abrir la app con la configuración `web-compilada`. Esa variable suma localhost a la CSP de `dist/_headers`; la compilación sin ella falla si la CSP no permite `https://puzzles.graduschess.com` o menciona localhost, y en Cloudflare (`WORKERS_CI`) la variable hace fallar la compilación.

## Selección que trae la app nativa
`src/puzzles/lichess-puzzles.json`: **50.000 puzzles, 6,76 MB** (hasta octubre de 2026 eran 10.000, 1,36 MB). Hasta el 7-11-2026 se llamaba `puzzles.json`; se cambió el nombre porque el servidor de desarrollo de Metro confundía el trozo `puzzles.bundle` con `puzzles.ts`, y la pestaña Puzzles siempre mostraba el error de carga. Que no vuelva a compartir nombre con otro archivo de la carpeta. Lo genera `scripts/build-puzzles.js`:
```
npm run build:puzzles -- <ruta a lichess_db_puzzle.csv.zst>
```
El script lee el archivo descomprimiéndolo sobre la marcha (con `fzstd`), sin descomprimirlo a disco, y tarda menos de un minuto. De los 6,1 millones, 1,4 millones pasan los filtros normales. El archivo bajado está guardado en `C:\dev\datos-lichess\lichess_db_puzzle.csv.zst`, fuera del proyecto. Si se pierde, se vuelve a bajar de Lichess.

**Criterios:**
- **Ratings de 500 a 2500,** en 20 franjas de 100 puntos con 2.500 puzzles cada una. Las 20 se completan.
- **Calidad:** popularidad ≥ 85, al menos 1.000 partidas jugadas y desviación del rating ≤ 80.
  - En las franjas de menos de 800 no alcanzan, así que se completan con filtros más flexibles: popularidad ≥ 60, 300 partidas y desviación ≤ 110. Se usaron para 5.281 puzzles.
- **Largo:** como mucho 8 jugadas, es decir, la del rival más hasta 4 del usuario.
- **Subpromociones:** entran. El tablero tiene selector de coronación y la solución exige la pieza elegida (`e7e8n` = coronar a caballo). Hay 23 puzzles donde el usuario tiene que coronar en otra pieza que no sea dama.
- **Variedad:** dentro de cada franja se toma de a un puzzle por tema principal, en ronda. Los temas que se pueden elegir en Práctica reciben el doble de lugar. Mientras lee, el script guarda los 1.000 mejores candidatos de cada tema y franja (`KEEP_PER_THEME`), suficientes para llenar las 2.500.
- **Verificación:** cada puzzle elegido se comprueba con chess.js (todas sus jugadas son legales).

**Formato de cada puzzle:** `[id, fen, jugadas UCI, rating, temas]`. Igual que en Lichess, el FEN es la posición *antes* de la jugada del rival, y la primera jugada es la del rival.

## Cómo funciona en la app
- **Puzzle del día:** sale de los 15.000 puzzles de nivel 1000–1600. Cambia a medianoche y es el mismo para todos. No se repite en más de 40 años.
- **Práctica:** dificultad **Automático** (por defecto, ver «Nivel de puzzles» abajo) o **Elegir dificultad**: Fácil, Medio, Difícil o Experto (solo en la web), y "Todos" o un tema. En el celular: Fácil 500–1200 (17.500 puzzles), Medio 1200–1800 (15.000), Difícil 1800–2500 (17.500); el tema con menos puzzles es "Mate del pasillo" en Difícil (50). En la web, la base completa (ver arriba): el tema con menos, sin contar Experto, es "Mate del pasillo" en Difícil (1.730). Toca un puzzle pendiente al azar, que no haya salido en esta sesión; cuando no queda ninguno, se repiten.
- **Pantalla del puzzle:**
  - El rival juega la primera jugada.
  - El usuario busca la solución. Si se equivoca, la jugada se hace en el tablero y, en el lugar de los botones "Pista" y "Ver solución", aparece el aviso "Incorrecto" con el botón "Reintentar". "Reintentar" deshace la jugada equivocada y se sigue desde ahí. Mientras tanto, el tablero no acepta otras jugadas.
  - En práctica, "Siguiente puzzle" cambia el puzzle dentro de la misma pantalla, con un fundido de 0,2 s y sin navegar, para que no aparezca un fondo blanco.
  - Como en Lichess, cualquier jugada que dé mate también resuelve el puzzle.
  - "Pista" marca la pieza que hay que mover; "Ver solución" reproduce la solución.
- **Resultado guardado** (`progress.puzzles`):
  - `clean`: sin errores ni pista.
  - `solved`: resuelto con errores o con pista.
  - `failed`: se miró la solución; el puzzle sigue pendiente en Práctica.

  Se guarda el mejor resultado de cada puzzle. Cada puzzle cuenta para la racha salvo que se haya mirado la solución. La primera vez que se resuelve da monedas: 2 sin errores ni pista, 1 con errores o pista (mirar la solución no da, pero el puzzle puede dar monedas después, al resolverlo).
- **Temas:** `src/puzzles/themes.json` (claves de Lichess y orden de la práctica). Los nombres en español son traducciones propias, no copiadas de Lichess, y están en `src/i18n/es.ts` (claves `puzzleTheme.<tema>`).

## Nivel de puzzles (9-11-2026)
Spec: `docs/superpowers/specs/2026-11-09-nivel-de-puzzles-design.md`. Cálculo en `src/progress/puzzleRating.ts` (probado).
- **Elo sencillo** con el rating de Lichess del puzzle como rival: `E = 1 / (1 + 10^((ratingPuzzle − nivel) / 400))`, cambio `round(K × (resultado − E))`, K = 40 en los primeros 20 puzzles y 20 después, entre 400 y 3000. Arranca en 800 (`nuevo`), 1100 (`basico`), 1400 (`casual`) o 1000 sin bienvenida.
- **Suma solo sin errores ni pista.** El fallo se cobra en el momento: con la primera jugada equivocada, la pista o «Ver solución» (`withPuzzleFailedNow`), aunque después se salga sin terminar. El acierto se cobra al resolverlo.
- **Solo la primera vez** que se juega cada puzzle. Los que bajaron el nivel y se abandonaron quedan en `progress.puzzleRating.pending` (tope 500) y salen de ahí al terminarlos.
- Todos los puzzles de Lichess mueven el nivel: Automático, Elegir dificultad y el puzzle del día. Los ejercicios de las lecciones y el quiz de la revisión no.
- **Automático** (`PuzzleSource.nextNear`): objetivo = nivel ± 100 al azar; busca un pendiente del tema a ±100, ±200 y ±400 del objetivo; si no hay, lo de siempre del nivel de dificultad del objetivo (en el celular, de toda la lista). En la web pide el trozo del nivel de dificultad del objetivo (el más cercano que tenga puzzles del tema).
- Se guarda en el progreso (campo opcional; la versión sigue siendo la 4). Al combinar copias gana el que contó más puzzles (`rated`), y si empatan el más reciente; `pending` se une. «Borrar progreso» lo borra.
- Ajustes › Práctica › «Mostrar mi nivel de puzzles» (`showPuzzleRating`): oculto, no se ve el número propio en ningún lado (el rating de cada puzzle sí) y se sigue calculando. La opción Automático / Elegir dificultad y el último nivel elegido a mano se recuerdan (`puzzleMode`, `puzzleLevel`).

## Pendiente
- Rating de puzzles del usuario: hoy no hay puntuación, solo resuelto o no resuelto, como pedía el mapa.
- Agregar más puzzles a la app nativa: cambiar `PER_BAND` o los filtros en el script y volver a generarlo (cambia el puzzle del día: las pruebas lo avisan). En la web ya está la base entera.
- Progreso en la web: vive en el almacenamiento del navegador (unos 5 MB por sitio) y cada puzzle resuelto ocupa unos 55 bytes, así que caben del orden de 80.000 resueltos. Si algún día importa, guardar los resueltos en un formato más compacto.
- La app nativa podría pedir trozos a `puzzles.graduschess.com` cuando tiene conexión (sin CSP ni CORS en nativo).
- Peso al abrir la app: `puzzles.ts` importa el JSON entero y Expo Router carga todas las pantallas al arrancar, así que los 6,76 MB se leen al abrir la app (en la PC tarda ~70 ms; el paquete de Android pasa a 12 MB). Si en el celular el arranque se nota lento, cargar los puzzles recién al entrar a Puzzles o a Perfil.
