# Sincronización con llave: plan de implementación

> **Para agentes:** SUB-SKILL OBLIGATORIA: usar superpowers:subagent-driven-development (recomendado) o superpowers:executing-plans para seguir este plan tarea por tarea. Los pasos usan casillas (`- [ ]`).

**Objetivo:** sincronizar el progreso de la web con un servidor propio usando una llave guardada una sola vez en Drive, sin ventanas de Google periódicas, y sincronizar más seguido (paso de lección, partida en curso, puzzles abandonados).

**Arquitectura:** un Worker de Cloudflare (`gradus-sync`, D1) guarda el progreso por resumen SHA-256 de la llave, con número de versión y marca de borrado. El motor actual (`syncEngine.ts`) pasa a hablar con un cliente con versión: si la escritura choca, baja, fusiona con `mergeProgress` y reintenta. Drive se usa solo al activar o borrar, para leer o escribir el archivo de la llave.

**Tecnología:** TypeScript, Expo Router (web), Cloudflare Workers + D1, wrangler 4.158.0, `tsx --test` (node:test).

**Diseño:** `docs/superpowers/specs/2026-11-09-sincronizacion-con-llave-design.md` (leerlo junto con este plan).

## Restricciones globales

- Solo la web sincroniza; en el celular `DriveSyncContext.tsx` sigue devolviendo `NOT_SUPPORTED`.
- El servidor no guarda correo, nombre ni token de Google: solo el SHA-256 (hex) de la llave, el progreso como texto, la versión y la fecha.
- Llave: 32 bytes de `crypto.getRandomValues`, en base64url sin relleno (43 caracteres). El servidor rechaza cualquier otro formato.
- Desactivar no borra nada del servidor. «Borrar mis datos del servidor» deja una marca de borrado permanente para ese resumen y borra la llave de Drive.
- Abandonar un puzzle no cambia el nivel de puzzles. El puzzle del día no se salta nunca.
- Campos nuevos del progreso sin subir `PROGRESS_VERSION` (patrón de `boardThemes` y `puzzleRating`: «Se agregó sin subir la versión: si falta, vale …»), con validación en `structure.ts` y combinación en `merge.ts`.
- Textos nuevos en los cinco idiomas (`src/i18n/{es,en,de,it,fr}.ts`); de, it y fr con gemma4 vía Ollama, revisando puntuación y términos. Sin exclamaciones en mensajes del sistema (`docs/design.md`). `noHardcoded.test.ts` tiene que seguir pasando.
- Commits con autor `Gradus Studio <349628194+GradusStudio@users.noreply.github.com>` (ya configurado), git desde Git Bash, un commit por tarea. Nunca `git push --all`.
- `npm test` y `npx expo lint` sin errores al terminar cada tarea.

## Puntos a vigilar en la revisión

1. Cerrar la pestaña o cambiar de app justo después de un paso de lección: tiene que sincronizarse igual (al quedar oculta la página se sincroniza sin esperar). Prueba en la tarea 5.
2. Borrado hecho en otro dispositivo: este recibe 410, olvida la llave, pasa a `revoked` y no vuelve a subir nada. Pruebas en las tareas 1 y 3.
3. Dos pestañas del mismo navegador escribiendo a la vez: la segunda recibe 409, fusiona y reintenta sin perder datos y sin quedar en un bucle (máximo 3 intentos). Prueba en la tarea 3.
4. Llave guardada dañada o con otro formato en `localStorage` o en Drive: se trata como «sin llave» (no se envía al servidor). Pruebas en las tareas 4 y 5.
5. Progreso más grande que el límite (512 KB): el servidor responde 413 y el motor muestra `error` sin reintentar en bucle. Pruebas en las tareas 1 y 3.

---

### Tarea 1: Worker `gradus-sync`

**Archivos:**
- Crear: `workers/sync/handler.ts` (lógica pura: recibe `Request` y un `ProgressStore`), `workers/sync/d1Store.ts` (adaptador D1), `workers/sync/index.ts` (entrada del Worker), `workers/sync/schema.sql`, `wrangler.sync.jsonc`
- Probar: `workers/sync/handler.test.ts` (con un `ProgressStore` en memoria)
- Modificar: `package.json` (sumar `"workers/**/*.test.ts"` al script `test`)

**Interfaces:**
- Produce la API HTTP (base `https://sync.graduschess.com`), todas con `Authorization: Bearer <llave>`:
  - `GET /v1/progress` → 200 `{ version: number, data: string }` | 404 (no hay) | 410 (borrado)
  - `PUT /v1/progress` con `{ version: number, data: string }` (`version` = la que el cliente vio, 0 si no había) → 200 `{ version: number }` (la nueva = vista + 1) | 409 `{ version, data }` (lo que hay ahora) | 410 | 413 (más de 512 KB de `data`)
  - `DELETE /v1/progress` → 204 (deja la marca de borrado; repetir da 204)
  - Llave ausente o con otro formato → 400. Otra ruta → 404. `OPTIONS` → 204 con CORS.
  - CORS: `Access-Control-Allow-Origin` solo para `https://graduschess.com`, `http://localhost:8081` y `http://localhost:8788`; métodos `GET, PUT, DELETE`; cabeceras `Authorization, Content-Type`.
- `type ProgressStore = { get(id: string): Promise<{ version: number; data: string | null; deleted: boolean } | null>; put(id: string, expected: number, data: string, now: string): Promise<'ok' | 'conflict' | 'deleted'>; remove(id: string, now: string): Promise<void> }`
- `export async function handle(req: Request, store: ProgressStore, now?: () => Date): Promise<Response>`
- Tabla D1 `progress (id TEXT PRIMARY KEY, version INTEGER NOT NULL, data TEXT, deleted INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL)`. `put` en D1: `INSERT ... ON CONFLICT(id) DO UPDATE ... WHERE progress.version = ?expected AND progress.deleted = 0`, y si no cambió ninguna fila, leer para distinguir `conflict` de `deleted`. Con `expected = 0` y sin fila, inserta con `version = 1`.

- [ ] **Paso 1: escribir las pruebas que fallan** en `handler.test.ts`:
  - `GET sin datos da 404`; `PUT con version 0 crea y devuelve version 1`; `GET devuelve version y data`
  - `PUT con version vieja da 409 con lo actual`
  - `DELETE deja 410 en GET y en PUT, y repetir DELETE da 204`
  - `llave de 42 caracteres o con caracteres fuera de base64url da 400`
  - `data de 512 * 1024 + 1 bytes da 413`
  - `dos llaves distintas no ven el progreso de la otra`
  - `el store recibe el SHA-256 hex de la llave, nunca la llave` (el store en memoria guarda los ids que recibe; ninguno es la llave)
  - `OPTIONS desde https://graduschess.com da 204 con Allow-Origin; desde otro origen no lo trae`
- [ ] **Paso 2:** `npm test` → fallan (no existe `handle`).
- [ ] **Paso 3:** implementar `handle` (SHA-256 con `crypto.subtle.digest`), `d1Store.ts`, `index.ts` (`export default { fetch: (req, env) => handle(req, createD1Store(env.DB)) }`), `schema.sql` y `wrangler.sync.jsonc` (nombre `gradus-sync`, `main: workers/sync/index.ts`, `compatibility_date: "2026-11-04"`, ruta `sync.graduschess.com` con `custom_domain`, `workers_dev: false`, binding D1 `DB` con nombre `gradus-sync`; el `database_id` lo crea el autor con `npx wrangler d1 create gradus-sync`: dejar un comentario con el paso).
- [ ] **Paso 4:** `npm test` → pasan. Probar en la PC: `npx wrangler d1 execute gradus-sync --local --file workers/sync/schema.sql` y `npx wrangler dev -c wrangler.sync.jsonc --port 8790`; un `curl` con PUT y GET da 200.
- [ ] **Paso 5:** sumar a `docs/web/publicar-en-cloudflare.md` una sección «Servidor de sincronización» (crear la base, aplicar `schema.sql` con `--remote`, `npx wrangler deploy -c wrangler.sync.jsonc`). Commit: «Sincronización: Worker gradus-sync con D1».

### Tarea 2: cliente del servidor

**Archivos:**
- Crear: `src/sync/serverClient.ts`, `src/sync/serverClient.test.ts`
- Modificar: `src/sync/syncEngine.ts` (solo los tipos de error y de cliente, ver abajo)

**Interfaces:**
- Consume: la API de la tarea 1.
- Produce en `syncEngine.ts`:
  - `export type SyncErrorKind = 'offline' | 'revoked' | 'tooLarge' | 'other'` y `export class SyncError extends Error { kind: SyncErrorKind }` (reemplaza a `DriveError` en el motor; `driveRest.ts` y `googleAuth.web.ts` pasan a lanzar `SyncError` con `offline` u `other`, y `auth` de Google se traduce a `other` en ellos).
  - `export class SyncConflict extends Error { constructor(readonly remote: { version: number; text: string }) }`
  - `export type SyncClient = { read(): Promise<{ version: number; text: string } | null>; write(text: string, expected: number): Promise<number> }` (devuelve la versión nueva; lanza `SyncConflict` con 409, `SyncError('revoked')` con 410, `SyncError('tooLarge')` con 413, `SyncError('offline')` si `fetch` rechaza, `SyncError('other')` con el resto).
- `export function createServerClient(deps: { fetch: typeof fetch; baseUrl: string; getKey: () => string | null }): SyncClient` (sin llave: `SyncError('revoked')`). `export const SYNC_URL = 'https://sync.graduschess.com'`.

- [ ] **Paso 1: pruebas que fallan** (con un `fetch` falso, como `driveRest.test.ts`): `read con 404 devuelve null`; `read con 410 lanza revoked`; `write manda Bearer, version y data y devuelve la versión nueva`; `write con 409 lanza SyncConflict con version y text`; `413 lanza tooLarge`; `fetch que rechaza lanza offline`; `sin llave lanza revoked sin llamar a fetch`.
- [ ] **Paso 2:** `npm test` → fallan.
- [ ] **Paso 3:** implementar.
- [ ] **Paso 4:** `npm test` → pasan (incluidas las de `driveRest.test.ts`, ajustadas a `SyncError`). Commit: «Sincronización: cliente del servidor».

### Tarea 3: motor con versión, conflictos y llave revocada

**Archivos:**
- Modificar: `src/sync/syncEngine.ts`, `src/sync/syncEngine.test.ts`

**Interfaces:**
- Consume: `SyncClient`, `SyncConflict`, `SyncError` (tarea 2).
- Produce: `type SyncStatus = 'idle' | 'syncing' | 'ok' | 'offline' | 'revoked' | 'corrupt' | 'tooNew' | 'error'` (salen `needsAuth`, `quota` y `blocked`). `Deps.client: SyncClient`. `createSyncEngine` devuelve además `flush(): Promise<SyncResult>` (cancela la espera y sincroniza ya). `resume()` se queda (para reactivar tras `revoked`).

- [ ] **Paso 1: pruebas que fallan:**
  - `sin datos en el servidor escribe con version 0`
  - `con datos, fusiona y escribe con la versión leída solo si cambió algo` (la regla de `sameData` de hoy)
  - `con 409, fusiona lo que trae el conflicto y reintenta con su versión; al tercer conflicto seguido informa error`
  - `con revoked informa revoked, se pausa y requestSync no hace nada hasta resume`
  - `con tooLarge informa error y no reintenta solo`
  - `flush sincroniza sin esperar el debounce`
- [ ] **Paso 2:** `npm test` → fallan.
- [ ] **Paso 3:** implementar. El reintento usa el `{ version, text }` del conflicto como si fuera un `read` (no vuelve a pedir).
- [ ] **Paso 4:** `npm test` → pasan. Commit: «Sincronización: motor con versión y conflictos».

### Tarea 4: la llave en Drive

**Archivos:**
- Crear: `src/sync/syncKey.ts`, `src/sync/syncKey.test.ts`
- Modificar: `src/sync/driveRest.ts` (`fileName` como parámetro y `remove()`), `src/sync/driveRest.test.ts`

**Interfaces:**
- Produce:
  - `createDriveRestClient({ fetch, getToken, fileName }): DriveFile` con `type DriveFile = { read(): Promise<string | null>; write(text: string): Promise<void>; remove(): Promise<void> }` (`remove` sin archivo no hace nada). `export const KEY_FILE_NAME = 'gradus-llave.json'`; `DRIVE_FILE_NAME` se borra.
  - `export function newSyncKey(random?: (bytes: Uint8Array) => Uint8Array): string` (43 caracteres base64url)
  - `export function isSyncKey(s: unknown): s is string` (`/^[A-Za-z0-9_-]{43}$/`)
  - `export function keyToFile(key: string): string` → `{"gradus":"llave","v":1,"key":"…"}`; `export function keyFromFile(text: string): string | null`
  - `export async function fetchOrCreateKey(file: DriveFile, make?: () => string): Promise<string>`: si el archivo tiene una llave válida, la devuelve; si no existe o está dañado, crea una, la escribe y la devuelve.

- [ ] **Paso 1: pruebas que fallan:** `newSyncKey da 43 caracteres válidos y dos llamadas difieren`; `keyFromFile de keyToFile devuelve la llave`; `keyFromFile con JSON ajeno, llave corta o texto roto da null`; `fetchOrCreateKey devuelve la de Drive sin escribir`; `sin archivo crea, escribe y devuelve la nueva`; `con archivo dañado lo reemplaza`; en `driveRest.test.ts`: `usa fileName en la búsqueda`, `remove borra el archivo encontrado`, `remove sin archivo no llama a DELETE`.
- [ ] **Paso 2:** `npm test` → fallan.
- [ ] **Paso 3:** implementar.
- [ ] **Paso 4:** `npm test` → pasan. Commit: «Sincronización: llave guardada en Drive».

### Tarea 5: contexto web, Ajustes, privacidad y CSP

**Archivos:**
- Modificar: `src/sync/DriveSyncContext.web.tsx`, `src/sync/driveSyncTypes.ts`, `src/sync/DriveSyncContext.tsx` (solo `NOT_SUPPORTED`), `src/screens/SyncSection.tsx`, `src/screens/PrivacyScreen.tsx`, `src/app/resultado.tsx`, `src/screens/GameScreen.tsx` (quitar `SyncNudge`), `src/i18n/{es,en,de,it,fr}.ts`, `public/_headers`
- Borrar: `src/screens/SyncNudge.tsx`
- Crear: `src/sync/keyStorage.ts` y `src/sync/keyStorage.test.ts`

**Interfaces:**
- Consume: tareas 2 a 4.
- Produce:
  - `keyStorage.ts`: `readKey(storage: Pick<Storage, 'getItem'>): string | null` (solo si `isSyncKey`), `writeKey(storage, key: string | null): void`, clave `'gradus:syncKey'` (reemplaza a `'gradus:driveSync'`, que se borra al leer si existe). Todo con try/catch.
  - `DriveSyncValue = { supported: boolean; enabled: boolean; status: SyncStatus | 'off'; enable(): Promise<void>; disable(): Promise<void>; deleteServerData(): Promise<void> }` (salen `reconnect` y `noteCompletion`).
  - `enable`: `auth.signIn()` (la única ventana) → `fetchOrCreateKey` → `writeKey` → `auth.revoke()` (el permiso ya no hace falta) → `engine.resume()` y `syncNow()`.
  - `disable`: `writeKey(null)`, estado `off`, el progreso del servidor queda.
  - `deleteServerData`: lo llama Ajustes después de confirmar; primero `auth.signIn()` (la ventana tiene que abrirse dentro del toque: después de un `await` de red el navegador la bloquea), luego `DELETE /v1/progress`, `file.remove()` de la llave en Drive, `auth.revoke()`, `writeKey(null)`, estado `off`. Si el DELETE falla (sin conexión), no se borra la llave de Drive, no cambia nada más y se muestra el aviso.
  - Con `revoked` desde el motor: `writeKey(null)` y queda el estado `revoked` hasta que la persona vuelva a activar.
  - Disparadores: cambio de progreso (`DEBOUNCE_MS = 1500`), al volver a la pestaña, al recuperar la conexión y, al quedar oculta (`visibilitychange` con `hidden` y `pagehide`), `engine.flush()`.
  - Textos nuevos (claves en `sync.*`): estado `revoked` («Se borraron los datos de la nube desde otro dispositivo. Para volver a sincronizar, activala de nuevo.»), botón «Borrar mis datos del servidor», diálogo con título «¿Borrar tus datos de la nube?» y mensaje «Se borra tu progreso guardado en nuestro servidor y la sincronización se desactiva en todos tus dispositivos. El progreso de este dispositivo queda. No se puede deshacer.», botones «Cancelar» y «Borrar» (destructivo, `showDialog`), aviso «No se pudo borrar: revisá la conexión.». Se borran `sync.reconnect`, `sync.status.needsAuth`, `sync.status.quota`, `sync.status.blocked` y los del cartel. La descripción de la sección dice que la ventana de Google aparece solo al activar.
  - Privacidad: el progreso se guarda en un servidor de Gradus Studio (Cloudflare), asociado a una llave al azar guardada en el Drive de la persona, sin correo ni nombre; se borra desde Ajustes.
  - `public/_headers`: sumar `https://sync.graduschess.com` a `connect-src`.

- [ ] **Paso 1: pruebas que fallan** en `keyStorage.test.ts`: `readKey con una llave válida la devuelve`, `con texto que no es llave da null`, `si getItem lanza da null`, `writeKey(null) la borra`, `readKey borra la clave vieja gradus:driveSync`.
- [ ] **Paso 2:** `npm test` → fallan.
- [ ] **Paso 3:** implementar el contexto, Ajustes, privacidad, textos (de/it/fr con gemma4) y la CSP; borrar `SyncNudge`.
- [ ] **Paso 4:** `npm test` y `npx expo lint` → sin errores.
- [ ] **Paso 5: verificar en el navegador** con el Worker local (tarea 1) y la app web en desarrollo, con `SYNC_URL` apuntando a `http://localhost:8790` solo en desarrollo (`__DEV__`): activar (una ventana de Google), hacer un paso de lección y ver el PUT en las peticiones de red; cerrar y abrir la pestaña: sin ventana y sincroniza; «Borrar mis datos del servidor» → diálogo → GET da 410. Capturas para el autor.
- [ ] **Paso 6:** commit: «Sincronización: llave en el dispositivo, sin ventanas periódicas».

### Tarea 6: partida contra un bot en curso

**Archivos:**
- Modificar: `src/progress/progressStore.ts`, `src/progress/merge.ts`, `src/progress/structure.ts`, `src/progress/ProgressContext.tsx`, `src/screens/GameScreen.tsx`, `src/app/partida.tsx`, `src/screens/BotsScreen.tsx`, `src/i18n/{es,en,de,it,fr}.ts`
- Probar: las pruebas existentes de `progressStore` y `merge` (sumar casos)

**Interfaces:**
- Produce:
  - `export type OngoingGame = { botId: string; userColor: 'w' | 'b'; practiceCourseId?: string; moves: string[]; startedAt: string }` y en `Progress`: `ongoingGame?: OngoingGame` (sin subir la versión) y `stamps.ongoingGame?: string`.
  - `export function withOngoingGame(p: Progress, game: OngoingGame | null, now?: Date): Progress` (pone o quita el valor y actualiza `stamps.ongoingGame`).
  - En `mergeProgress`: `lastChanged` con `stamps.ongoingGame` (gana el último cambio, también si el último fue quitarla).
  - `ProgressContext`: `saveOngoingGame(game: OngoingGame | null): void`.
  - `GameScreen` recibe `initialMoves?: string[]`: las aplica al `Chess` antes de empezar; guarda `ongoingGame` después de cada jugada (del usuario y del bot) y la quita en `end()`. `partida.tsx` acepta el parámetro `continuar=1`: toma bot, color, curso y jugadas de `progress.ongoingGame` (si no hay, redirige a `/bots`). Empezar una partida nueva reemplaza la guardada sin registrar nada.
  - `BotsScreen`: si hay `ongoingGame` y el bot existe, una tarjeta arriba «Partida sin terminar contra {bot}» con el botón «Continuar» (avatar del bot).

- [ ] **Paso 1: pruebas que fallan:** `withOngoingGame guarda y pone stamp`; `withOngoingGame(null) la quita y pone stamp`; `merge: gana la más reciente`; `merge: quitarla después le gana a una vieja`; `structure: ongoingGame con moves que no es lista se descarta`.
- [ ] **Paso 2:** `npm test` → fallan.
- [ ] **Paso 3:** implementar (textos en los cinco idiomas).
- [ ] **Paso 4:** `npm test` y `npx expo lint` → sin errores. Verificar en el navegador: jugar 3 jugadas, cerrar la pestaña, abrir Bots → «Continuar» deja la misma posición; terminarla → la tarjeta desaparece.
- [ ] **Paso 5:** commit: «Bots: la partida sin terminar se guarda y se puede continuar».

### Tarea 7: puzzles abandonados

**Archivos:**
- Modificar: `src/progress/progressStore.ts`, `src/progress/merge.ts`, `src/progress/structure.ts`, `src/progress/ProgressContext.tsx`, `src/app/puzzle.tsx`
- Probar: pruebas de `progressStore` y `merge`

**Interfaces:**
- Produce:
  - En `Progress`: `puzzlesOpened?: string[]` (sin subir la versión; los últimos `MAX_OPENED = 200`, el más reciente primero).
  - `export function withPuzzleOpened(p: Progress, id: string): Progress` (lo pone primero, sin repetir, con tope).
  - En `mergeProgress`: unión con tope de 200, sin los ids que ya están en `puzzles` (resueltos o con la solución vista).
  - `ProgressContext`: `openPuzzle(id: string): void`.
  - `puzzle.tsx`: al mostrar un puzzle de práctica llama a `openPuzzle(id)`; el conjunto que pasa a `next` y `nextNear` es la unión de `seen.current` y `progress.puzzlesOpened`. El puzzle del día no se agrega ni se salta. No toca el nivel de puzzles.

- [ ] **Paso 1: pruebas que fallan:** `withPuzzleOpened lo pone primero sin repetir`; `tope de 200`; `merge une, respeta el tope y quita los ya terminados`.
- [ ] **Paso 2:** `npm test` → fallan.
- [ ] **Paso 3:** implementar.
- [ ] **Paso 4:** `npm test` y `npx expo lint` → sin errores. Verificar en el navegador: abrir un puzzle de práctica, salir sin resolverlo, volver a Practicar → sale otro; el nivel no cambió.
- [ ] **Paso 5:** commit: «Puzzles: el que se abandona no vuelve a salir».

### Tarea 8: documentos

- [ ] Actualizar `CLAUDE.md` (Versión web: la sincronización ya no es con Drive sino con llave y servidor; Pruebas: los nuevos archivos de prueba), `docs/superpowers/specs/2026-11-07-version-web-design.md` (sección 4: remitir al diseño nuevo) , `docs/web/` (Safari en iPhone sin instalar puede pedir la ventana de nuevo tras unos 7 días sin visitas) y el estado del diseño nuevo («implementado»; la partida en curso entró sin subir la versión del progreso, no como versión 5). Commit: «Sincronización con llave: documentos».
