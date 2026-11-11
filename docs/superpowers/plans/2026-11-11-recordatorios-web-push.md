# Recordatorios diarios con Web Push: plan de implementación

> **Para agentes:** SUB-SKILL OBLIGATORIA: usar superpowers:subagent-driven-development (recomendado) o superpowers:executing-plans para seguir este plan tarea por tarea. Los pasos usan casillas (`- [ ]`).

**Objetivo:** que la web/PWA de Gradus pueda activar un recordatorio diario con Web Push, con los textos de los bots y las reglas de racha actuales, sin guardar datos personales.

**Arquitectura:** se extiende el Worker existente `gradus-sync`: rutas `POST/PUT/DELETE /v1/reminders` sobre la misma base D1 y un cron cada 5 minutos. El cliente pide permiso, se suscribe con la clave pública VAPID y manda el plan de 7 días; el service worker muestra el aviso salvo que la marca local de práctica sea del día actual.

**Tecnología:** TypeScript, Expo Router (web), Cloudflare Workers + D1, `@block65/webcrypto-web-push`, Workbox 7, `tsx --test` (node:test), wrangler 4.158.0.

**Spec:** `docs/superpowers/specs/2026-11-11-recordatorios-web-push-design.md` (leerlo junto con este plan).

## Restricciones globales

- Solo web/PWA. La app nativa sigue con `expo-notifications` y `reminders.ts` sin cambios de comportamiento.
- Se usa el Worker `gradus-sync` y la base D1 `gradus-sync`; no se crea otro Worker ni otra base.
- El servidor guarda solo `deviceId`, SHA-256 del secreto, `endpoint`, `p256dh`, `auth` y los avisos (`dueAt` UTC, título, texto). Nada de progreso, racha, nombre ni correo.
- La clave privada VAPID va como secreto `VAPID_PRIVATE_KEY` del Worker y nunca al repositorio. La pública va en `src/settings/pushConfig.ts` y en `vars` de `wrangler.sync.jsonc`.
- CORS solo para `https://graduschess.com`, `http://localhost:8081` y `http://localhost:8788`. No hay ruta GET de recordatorios.
- Máximo 7 avisos por plan; cuerpo ≤ 16 KB; título ≤ 120 caracteres; texto ≤ 300; endpoints solo de Google, Mozilla, Apple y Microsoft.
- `deviceId`: 16 bytes base64url (22 caracteres). Secreto: 32 bytes base64url (43). El servidor guarda el SHA-256 del secreto y compara en tiempo constante.
- Un aviso por día. Si hay varios vencidos, se envía solo el más reciente; un envío fallido se reintenta como máximo 1 hora; los dispositivos con 30 días sin actividad se borran.
- Textos en es, en, de, it y fr. Sin exclamaciones ni culpa. de, it y fr con gemma4 vía Ollama y revisión de puntuación.
- `npm test`, `npx tsc --noEmit` y `npx expo lint` pasan al terminar cada tarea. Un commit por tarea, autor `Gradus Studio`; nunca `git push --all`.

## Review Focus

1. **Práctica sin conexión después de programado el aviso:** el service worker no debe mostrar el aviso si la marca local es de hoy. Lo fijan `practiceMarkLogic.test.ts` («practicado hoy…») y la prueba manual de la tarea 10.
2. **Permiso revocado o notificaciones desactivadas:** al abrir la app, el recordatorio se apaga, se borra el registro del servidor y no queda un interruptor encendido sin efecto. Lo fija el recorrido manual de la tarea 10 y la lógica de `reminderIsUsable` de la tarea 4.
3. **Caída del Worker y avisos vencidos:** no debe haber una ráfaga de 7 avisos; solo el más reciente, y un fallo reintentable se reintenta hasta 1 hora. Lo fijan los tests de `scheduler.test.ts`.
4. **iPhone sin instalar o navegador sin soporte:** no se ofrece el recordatorio, la fila de Ajustes explica que hay que instalar (iOS) o no aparece (sin soporte). Lo fija la matriz de `detectReminderSupport` y la prueba manual de la tarea 10.
5. **Entrada maliciosa o rota:** endpoint fuera de la lista, cuerpo grande, más de 7 avisos, secreto incorrecto o JSON inválido se rechazan sin filtrar datos. Lo fijan los tests de `workers/reminders/handler.test.ts`.

---

### Task 1: API de recordatorios y CORS compartido

**Files:**
- Crear: `workers/cors.ts`, `workers/reminders/handler.ts`, `workers/reminders/handler.test.ts`
- Modificar: `workers/sync/handler.ts` (usar `corsHeaders` de `workers/cors.ts`)

**Interfaces:**
- Produce `workers/cors.ts`:
  - `export const ALLOWED_ORIGINS = ['https://graduschess.com', 'http://localhost:8081', 'http://localhost:8788'];`
  - `export function corsHeaders(req: Request, methods: string): Record<string, string>`
- Produce `workers/reminders/handler.ts`:
  - `export type ReminderSubscription = { endpoint: string; keys: { p256dh: string; auth: string } };`
  - `export type ReminderNoticeInput = { dueAt: string; title: string; body: string };`
  - `export type ReminderStore = { createDevice(input: { id: string; secretHash: string; subscription: ReminderSubscription; notices: ReminderNoticeInput[]; now: string }): Promise<void>; findDevice(id: string): Promise<{ secretHash: string } | null>; replaceNotices(id: string, notices: ReminderNoticeInput[], now: string): Promise<void>; removeDevice(id: string): Promise<void>; };`
  - `export type ReminderLimiter = { limit(options: { key: string }): Promise<{ success: boolean }> };`
  - `export type PushSender = { send(sub: ReminderSubscription, payload: string): Promise<'ok' | 'gone' | 'retry'>; };`
  - `export async function handleReminders(req: Request, store: ReminderStore, now?: () => Date, limiter?: ReminderLimiter): Promise<Response>`
- API:
  - `POST /v1/reminders` con `{ subscription, notices }` → 201 `{ deviceId, secret }`.
  - `PUT /v1/reminders/:deviceId` con `Authorization: Bearer <secret>` y `{ notices }` → 204.
  - `DELETE /v1/reminders/:deviceId` con `Authorization: Bearer <secret>` → 204.
  - `OPTIONS` → 204 con CORS. Cualquier otro método o ruta → 404.

- [ ] **Step 1: escribir las pruebas que fallan** en `workers/reminders/handler.test.ts`, con un `memoryStore()` que implemente `ReminderStore` y capture el `secretHash`:
  - `POST crea el dispositivo y devuelve deviceId de 22 y secreto de 43 caracteres` → 201; `store.findDevice(deviceId)` no es null; el hash tiene 64 hex y no es el secreto.
  - `POST rechaza un endpoint que no es de Google, Mozilla, Apple o Microsoft` → 400.
  - `POST rechaza más de 7 avisos` → 400.
  - `POST rechaza un título de más de 120 caracteres` → 400.
  - `POST rechaza un cuerpo de más de 16 KB` → 413 (cabecera `Content-Length`).
  - `PUT con el secreto correcto reemplaza los avisos` → 204; el store recibe los avisos nuevos.
  - `PUT con el secreto incorrecto da 403`; `PUT de un id desconocido da 404`.
  - `DELETE con el secreto correcto borra el dispositivo` → 204; `findDevice` devuelve null.
  - `GET /v1/reminders no existe` → 404.
  - `OPTIONS desde https://graduschess.com da 204 con Allow-Origin; desde https://otro.example no lo trae`.
  - `el limitador solo se usa en POST y devuelve 429 cuando no permite` (con un `ReminderLimiter` falso).
- [ ] **Step 2:** `npx tsx --test workers/reminders/handler.test.ts` → fallan porque no existe `handleReminders`.
- [ ] **Step 3:** implementar `workers/cors.ts`, `handleReminders` y actualizar `workers/sync/handler.ts` para importar `corsHeaders(req, 'GET, PUT, DELETE')`. Constantes: `DEVICE_ID = /^[A-Za-z0-9_-]{22}$/`, `SECRET = /^[A-Za-z0-9_-]{43}$/`, `MAX_BODY_BYTES = 16 * 1024`, `MAX_NOTICES = 7`, `MAX_TITLE = 120`, `MAX_BODY_TEXT = 300`. Endpoints permitidos: `fcm.googleapis.com`, `updates.push.services.mozilla.com`, `web.push.apple.com`, `wns.windows.com` y cualquier host que termine en `.notify.windows.com`. Normalizar `dueAt` con `new Date(dueAt).toISOString()` y rechazar fechas inválidas. Generar `deviceId` y `secret` con `crypto.getRandomValues` y base64url sin relleno; hashear el secreto con `crypto.subtle.digest('SHA-256', ...)`.
- [ ] **Step 4:** `npx tsx --test workers/reminders/handler.test.ts` → pasan. `npx tsx --test workers/sync/handler.test.ts` → siguen pasando.
- [ ] **Step 5:** commit.

```bash
git add workers/cors.ts workers/sync/handler.ts workers/reminders/handler.ts workers/reminders/handler.test.ts
git commit -m "Recordatorios: API del Worker y CORS compartido" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 2: D1, planificador y cron

> **Orden:** ejecutar después de la tarea 3. `workers/sync/index.ts` importa `createPushSender` de `workers/reminders/push.ts`.

**Files:**
- Crear: `workers/reminders/d1Store.ts`, `workers/reminders/scheduler.ts`, `workers/reminders/scheduler.test.ts`, `workers/reminders/schema.sql`
- Modificar: `workers/sync/index.ts`, `wrangler.sync.jsonc`

**Interfaces:**
- Consume `ReminderStore`, `ReminderSubscription` y `PushSender` de `workers/reminders/handler.ts`.
- `export type DueNotice = { noticeId: number; deviceId: string; endpoint: string; p256dh: string; auth: string; dueAt: string; title: string; body: string };`
- `export type ReminderSendStore = ReminderStore & { dueNotices(now: string): Promise<DueNotice[]>; deleteNotices(ids: number[]): Promise<void>; pruneDevices(before: string): Promise<void>; };`
- `export async function sendDueReminders(store: ReminderSendStore, sender: PushSender, now: Date): Promise<{ sent: number; gone: number; dropped: number }>`
- `export function createD1ReminderStore(db: D1Like): ReminderSendStore` (`D1Like` con `prepare`, `bind`, `first`, `all`, `run`).
- `Env` del Worker: `{ DB: D1Like; CREATE_LIMITER?: ReminderLimiter; VAPID_SUBJECT: string; VAPID_PUBLIC_KEY: string; VAPID_PRIVATE_KEY: string }`.

- [ ] **Step 1: escribir las pruebas que fallan** en `workers/reminders/scheduler.test.ts`, con un store en memoria que implemente `ReminderSendStore` y un sender falso que registra llamadas:
  - `envía solo el más reciente y borra los viejos`: 3 avisos vencidos del mismo dispositivo; el sender recibe el más nuevo; `deleteNotices` recibe los otros dos y luego el enviado.
  - `descarta un aviso de hace más de una hora sin enviarlo`.
  - `un 404 o 410 borra el dispositivo`.
  - `un fallo reintentable conserva el aviso para el próximo ciclo`.
  - `dos dispositivos reciben cada uno su aviso`.
  - `borra los dispositivos con más de 30 días sin actividad` (verifica `pruneDevices` con `now - 30 días`).
  - `no envía nada si no hay avisos`.
- [ ] **Step 2:** `npx tsx --test workers/reminders/scheduler.test.ts` → fallan.
- [ ] **Step 3:** implementar `scheduler.ts`, `d1Store.ts` y `schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY,
  secret_hash TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS reminder_notices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT NOT NULL,
  due_at TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS reminder_notices_due ON reminder_notices (due_at);
CREATE INDEX IF NOT EXISTS reminder_notices_device ON reminder_notices (device_id);
```

  El planificador agrupa por `deviceId`, ordena por `dueAt` descendente, borra los avisos viejos, descarta el más nuevo si tiene más de 1 hora, envía con `JSON.stringify({ title, body, url: '/app/' })`, borra al recibir `ok` y borra el dispositivo al recibir `gone`. `pruneDevices` borra primero los avisos de los dispositivos viejos y después las filas.
- [ ] **Step 4:** modificar `workers/sync/index.ts` para enrutar `pathname.startsWith('/v1/reminders')` a `handleReminders` y agregar:

```ts
scheduled: (event, env, ctx) =>
  ctx.waitUntil(sendDueReminders(createD1ReminderStore(env.DB), createPushSender(fetch, env), new Date(event.scheduledTime))),
```

  y `wrangler.sync.jsonc`:

```jsonc
"triggers": { "crons": ["*/5 * * * *"] },
"vars": { "VAPID_SUBJECT": "mailto:gradusstudioapp@gmail.com", "VAPID_PUBLIC_KEY": "REEMPLAZAR" }
```

- [ ] **Step 5:** `npx tsx --test workers/reminders/scheduler.test.ts` → pasan. Probar la base local: `npx wrangler d1 execute gradus-sync --local -c wrangler.sync.jsonc --file workers/reminders/schema.sql` y `npx wrangler dev -c wrangler.sync.jsonc --port 8790`; un `POST`/`PUT`/`DELETE` a `/v1/reminders` responde 201/204/204.
- [ ] **Step 6:** commit.

```bash
git add workers/reminders workers/sync/index.ts wrangler.sync.jsonc
git commit -m "Recordatorios: D1, planificador y cron" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 3: Envío Push con VAPID

> **Orden:** ejecutar antes de la tarea 2. La tarea 2 importa `createPushSender` de este módulo.

**Files:**
- Crear: `workers/reminders/push.ts`, `workers/reminders/push.test.ts`
- Modificar: `package.json` (agregar `@block65/webcrypto-web-push`)

**Interfaces:**
- Consume `PushSender` y `ReminderSubscription` de `workers/reminders/handler.ts`.
- `export type PushEnv = { VAPID_SUBJECT: string; VAPID_PUBLIC_KEY: string; VAPID_PRIVATE_KEY: string };`
- `export type BuildPushPayload = (message: { data: string; options: { ttl: number } }, subscription: { endpoint: string; expirationTime: null; keys: { p256dh: string; auth: string } }, vapid: { subject: string; publicKey: string; privateKey: string }) => Promise<RequestInit>;`
- `export function createPushSender(fetchImpl: typeof fetch, env: PushEnv, build?: BuildPushPayload): PushSender`

- [ ] **Step 1:** `npm install @block65/webcrypto-web-push`.
- [ ] **Step 2: escribir las pruebas que fallan** en `workers/reminders/push.test.ts`, inyectando un `build` falso y un `fetch` falso:
  - `201 devuelve ok`; `404 y 410 devuelven gone`; `500 devuelve retry`; `un fetch que lanza devuelve retry`.
  - `arma el mensaje con data y ttl 3600` (el `build` falso captura los argumentos).
  - `usa VAPID_SUBJECT, VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY del entorno`.
- [ ] **Step 3:** implementar `push.ts` con `buildPushPayload` como valor por defecto del tercer parámetro; detectar `404`/`410` como `gone`, cualquier `res.ok` como `ok` y el resto, o una excepción, como `retry`.
- [ ] **Step 4:** `npx tsx --test workers/reminders/push.test.ts` → pasan; `npx tsc --noEmit` sin errores. Si el bundler de wrangler se queja de la librería ESM, agregar `"compatibility_flags": ["nodejs_compat"]` a `wrangler.sync.jsonc`; probar primero sin eso.
- [ ] **Step 5:** commit.

```bash
git add package.json package-lock.json workers/reminders/push.ts workers/reminders/push.test.ts
git commit -m "Recordatorios: envío Web Push con VAPID" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 4: Cliente de recordatorios

**Files:**
- Crear: `src/settings/reminderSupport.ts`, `src/settings/reminderClient.ts`, `src/settings/reminderClient.test.ts`, `src/settings/pushConfig.ts`
- Revisar: `src/settings/offers.test.ts` (ya cubre `remindersSupported: false`; no hace falta cambiarlo)
- Modificar: `src/settings/reminders.ts`, `src/settings/reminders.web.ts`, `src/settings/useReminderSync.ts`

**Interfaces:**
- `src/settings/reminderSupport.ts`: `export type ReminderSupport = 'supported' | 'ios-needs-install' | 'unsupported';`
- `src/settings/reminderClient.ts`:
  - `export const REMINDER_STORAGE_KEY = 'gradus:recordatorio';`
  - `export type ReminderCredentials = { deviceId: string; secret: string };`
  - `export type ReminderNoticePayload = { dueAt: string; title: string; body: string };`
  - `export function planToNotices(plan: PlannedReminder[]): ReminderNoticePayload[]`
  - `export function parseReminderCredentials(raw: string | null): ReminderCredentials | null`
  - `export function serializeReminderCredentials(c: ReminderCredentials): string`
  - `export function urlBase64ToUint8Array(base64: string): Uint8Array`
  - `export function detectReminderSupport(input: { hasServiceWorker: boolean; hasPushManager: boolean; hasNotification: boolean; platform: InstallPlatform }): ReminderSupport`
- `src/settings/pushConfig.ts`: `export const VAPID_PUBLIC_KEY = 'REEMPLAZAR';` (la clave real la pega el autor en la tarea 9).
- `reminders.ts` (nativo): `export const REMINDER_SUPPORT: ReminderSupport = 'supported';` y `export async function reminderIsUsable(): Promise<boolean> { return true; }`.
- `reminders.web.ts`: `REMINDER_SUPPORT`, `REMINDERS_SUPPORTED = REMINDER_SUPPORT === 'supported'`, `reminderIsUsable`, `ensureReminderPermission`, `syncReminders`, `cancelDailyReminder`.

- [ ] **Step 1: escribir las pruebas que fallan** en `reminderClient.test.ts`:
  - `planToNotices convierte las fechas a ISO UTC`.
  - `parseReminderCredentials acepta solo deviceId de 22 y secreto de 43 base64url`; `null`, JSON roto o longitudes malas → null.
  - `urlBase64ToUint8Array decodifica con y sin relleno` (comparar bytes conocidos).
  - `detectReminderSupport`: todo soportado + desktop → `supported`; todo soportado + ios → `ios-needs-install`; todo soportado + installed → `supported`; falta PushManager → `unsupported`.
  - El test existente de `offers.test.ts` ya cubre que no se ofrece con `remindersSupported: false`; no se toca.
- [ ] **Step 2:** `npx tsx --test src/settings/reminderClient.test.ts` → fallan.
- [ ] **Step 3:** implementar `reminderSupport.ts`, `reminderClient.ts`, `pushConfig.ts`. En `reminders.web.ts`:
  - Detectar el soporte con `navigator.serviceWorker`, `'PushManager' in window`, `'Notification' in window`, `detectInstallPlatform(navigator.userAgent, isStandalone(), navigator.maxTouchPoints)`.
  - `ensureReminderPermission`: si no es `supported` o la clave pública es `'REEMPLAZAR'`, devolver false; pedir permiso; obtener `navigator.serviceWorker.ready`; `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) })`; devolver true.
  - `syncReminders`: si no hay suscripción, salir; `planToNotices(planReminders(...))`; leer credenciales de `localStorage`; si existen, `PUT ${BASE_URL}/v1/reminders/${deviceId}` con `Authorization: Bearer ${secret}` y `{ notices }`; si responde 404/401/403, `POST` de nuevo y guardar las credenciales nuevas; si no existen, `POST` con `{ subscription: sub.toJSON(), notices }` y guardar `{ deviceId, secret }`. Ignorar errores de red. `BASE_URL = process.env.EXPO_PUBLIC_SYNC_URL || SYNC_URL`.
  - `cancelDailyReminder`: si hay credenciales, `DELETE` con el secreto; borrar `localStorage`; `sub.unsubscribe()`.
  - `reminderIsUsable`: si `Notification.permission !== 'granted'` o no hay suscripción, llamar a `cancelDailyReminder()` y devolver false; si no, true.
- [ ] **Step 4:** modificar `useReminderSync.ts`: llamar a `reminderIsUsable()` antes de `syncReminders`; si devuelve false, `update({ reminder: { enabled: false, hour } })`. Agregar `update` a las dependencias del efecto.
- [ ] **Step 5:** `npx tsx --test src/settings/reminderClient.test.ts` → pasan; `npx tsc --noEmit` sin errores.
- [ ] **Step 6:** commit.

```bash
git add src/settings/reminderSupport.ts src/settings/reminderClient.ts src/settings/reminderClient.test.ts src/settings/pushConfig.ts src/settings/reminders.ts src/settings/reminders.web.ts src/settings/useReminderSync.ts
git commit -m "Recordatorios: cliente web y suscripción Push" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 5: Marca local de práctica

**Files:**
- Crear: `src/progress/practiceMarkLogic.ts`, `src/progress/practiceMarkLogic.test.ts`, `src/progress/practiceMark.ts`, `src/progress/practiceMark.web.ts`
- Modificar: `src/progress/ProgressContext.tsx`

**Interfaces:**
- `practiceMarkLogic.ts`: `export const PRACTICE_CACHE = 'gradus-practica'; export const PRACTICE_KEY = '/app/practica-hoy'; export function practicedToday(streak: Streak, today: string): boolean;`
- `practiceMark.ts` (nativo): `export function markPracticed(_streak: Streak): void {}`
- `practiceMark.web.ts`: `export function markPracticed(streak: Streak): void` escribe `todayKey()` en `caches.open(PRACTICE_CACHE)` bajo `PRACTICE_KEY` solo si `practicedToday(streak, todayKey())`; cualquier error se ignora.

- [ ] **Step 1: escribir las pruebas que fallan** en `practiceMarkLogic.test.ts`:
  - `practicedToday: una acción hecha hoy cuenta`; `acciones de ayer no cuentan`; `sin acciones no cuenta`; `cualquier acción (lección, puzzle, bot) cuenta`.
  - `una lección de apertura cuenta como lección`: `withLessonFinished(emptyProgress, { lessonId: 'london-l01', lessonCoins: 15, errors: 0, mistakes: [], seconds: 60 }, new Date(2026, 9, 30, 10, 0))` deja `progress.streak.actions.lesson === true`. Esto fija el RF-07.
- [ ] **Step 2:** `npx tsx --test src/progress/practiceMarkLogic.test.ts` → fallan.
- [ ] **Step 3:** implementar `practiceMarkLogic.ts`, `practiceMark.ts` y `practiceMark.web.ts`. En `ProgressContext.tsx`, importar `markPracticed` y llamarlo con `next.streak` dentro de `commit`, y con `r.progress.streak` después de `loadProgress()`.
- [ ] **Step 4:** `npx tsx --test src/progress/practiceMarkLogic.test.ts` → pasan; `npx tsc --noEmit` sin errores.
- [ ] **Step 5:** commit.

```bash
git add src/progress/practiceMarkLogic.ts src/progress/practiceMarkLogic.test.ts src/progress/practiceMark.ts src/progress/practiceMark.web.ts src/progress/ProgressContext.tsx
git commit -m "Recordatorios: marca local de práctica del día" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 6: Service worker que muestra el aviso

**Files:**
- Crear: `scripts/push-sw.js`, `scripts/pushSw.test.ts`
- Modificar: `scripts/build-sw.js`, `public/_headers`

**Interfaces:**
- `scripts/push-sw.js` (script clásico, sin módulos): constantes `PRACTICE_CACHE = 'gradus-practica'`, `PRACTICE_KEY = '/app/practica-hoy'`, `APP_URL = '/app/'`; función `todayKey()`; manejadores `push` y `notificationclick`.
- `scripts/build-sw.js`: copia `scripts/push-sw.js` a `dist/app/push-sw.js` y agrega `importScripts: ['/app/push-sw.js']` a `generateSW`.
- `public/_headers`: regla `/app/push-sw.js` con `Cache-Control: no-cache`.

- [ ] **Step 1: escribir las pruebas que fallan** en `scripts/pushSw.test.ts` (leen los archivos como texto):
  - `push-sw.js registra un manejador push y uno notificationclick`.
  - `push-sw.js usa la misma caché y clave que practiceMarkLogic` (comparar los literales).
  - `build-sw.js copia push-sw.js e importa /app/push-sw.js`.
- [ ] **Step 2:** `npx tsx --test scripts/pushSw.test.ts` → fallan.
- [ ] **Step 3:** implementar `push-sw.js`: en `push`, leer la marca con `caches.match(PRACTICE_KEY)` y comparar con `todayKey()`; si coincide, no mostrar nada. Si no, parsear `event.data.json()` con `try/catch`, usar `title`/`body`/`url` con valores por defecto y `self.registration.showNotification(title, { body, icon: '/app/icons/icon-192.png', badge: '/app/icons/icon-192.png', data: { url } })`. En `notificationclick`, cerrar la notificación, buscar una ventana en `/app/`, enfocarla o abrir `data.url`.
- [ ] **Step 4:** modificar `scripts/build-sw.js` para copiar el archivo antes de `generateSW` y pasar `importScripts`; agregar la regla en `public/_headers`.
- [ ] **Step 5:** `npx tsx --test scripts/pushSw.test.ts` → pasan. `npm run build:web` → `dist/app/push-sw.js` existe y `dist/app/sw.js` contiene `importScripts("/app/push-sw.js")` (o con comillas simples).
- [ ] **Step 6:** commit.

```bash
git add scripts/push-sw.js scripts/pushSw.test.ts scripts/build-sw.js public/_headers
git commit -m "Recordatorios: service worker con push y notificationclick" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 7: Ajustes e idiomas del recordatorio

**Files:**
- Modificar: `src/screens/SettingsScreen.tsx`, `src/i18n/es.ts`, `src/i18n/en.ts`, `src/i18n/de.ts`, `src/i18n/it.ts`, `src/i18n/fr.ts`

**Interfaces:**
- Nuevas claves: `settings.reminder.installFirst`, `settings.reminder.installAction`.
- `REMINDER_SUPPORT` se importa desde `../settings/reminders`.

- [ ] **Step 1:** agregar en `es.ts`:
  - `'settings.reminder.installFirst': 'Para recibir avisos, agregá Gradus a la pantalla de inicio.'`
  - `'settings.reminder.installAction': 'Instalar'`
  Y en `en.ts` sus equivalentes. Traducir de, it y fr con gemma4 vía Ollama (cuerpo UTF-8, `stream: false`, `think: false`), revisar puntuación y que no haya exclamaciones.
- [ ] **Step 2:** en `SettingsScreen.tsx`, importar `REMINDER_SUPPORT` y `router` de `expo-router`. Reemplazar el bloque `REMINDERS_SUPPORTED && (...)`:
  - `REMINDER_SUPPORT === 'supported'`: la fila con interruptor y las horas, como hoy.
  - `REMINDER_SUPPORT === 'ios-needs-install'`: `<SettingRow label={t('settings.reminder')} description={t('settings.reminder.installFirst')} detail={t('settings.reminder.installAction')} onPress={() => router.push('/instalar')} />`.
  - `REMINDER_SUPPORT === 'unsupported'`: no renderizar nada.
- [ ] **Step 3:** `npm test` (i18n, validate, noHardcoded), `npx tsc --noEmit`, `npx expo lint` → sin errores.
- [ ] **Step 4:** comprobar en el navegador: en desktop con soporte aparece el interruptor; en un navegador sin `PushManager` no aparece; en iPhone sin instalar aparece la fila que lleva a `/instalar`.
- [ ] **Step 5:** commit.

```bash
git add src/screens/SettingsScreen.tsx src/i18n/es.ts src/i18n/en.ts src/i18n/de.ts src/i18n/it.ts src/i18n/fr.ts
git commit -m "Recordatorios: fila de Ajustes según el soporte" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 8: Política de privacidad

**Files:**
- Modificar: `src/screens/PrivacyScreen.tsx`, `src/i18n/es.ts`, `src/i18n/en.ts`, `src/i18n/de.ts`, `src/i18n/it.ts`, `src/i18n/fr.ts`

- [ ] **Step 1:** agregar `'reminders'` a `SECTIONS` después de `'drive'` en `PrivacyScreen.tsx`.
- [ ] **Step 2:** en `es.ts`, agregar:
  - `'privacy.reminders.title': 'Recordatorios'`
  - `'privacy.reminders.text': 'Si activás el recordatorio diario, Gradus guarda en su servidor un identificador del dispositivo, la dirección de envío que da el navegador, las claves de la suscripción y los avisos pendientes (hora, título y texto). No guarda tu progreso, tu racha, tu nombre ni tu correo. Podés desactivarlo en Ajustes; al hacerlo se borra el registro del servidor. Los dispositivos sin actividad durante 30 días se borran solos.'`
  - Actualizar `privacy.updated` a `'... Última actualización: 11 de noviembre de 2026.'`
  - Actualizar `privacy.summary` para mencionar el recordatorio opcional además de la sincronización.
- [ ] **Step 3:** traducir las claves nuevas a en, de, it y fr (gemma4 vía Ollama; revisar puntuación y términos).
- [ ] **Step 4:** `npm test`, `npx tsc --noEmit`, `npx expo lint` → sin errores. Abrir `/app/privacidad` y comprobar la sección nueva.
- [ ] **Step 5:** commit.

```bash
git add src/screens/PrivacyScreen.tsx src/i18n/es.ts src/i18n/en.ts src/i18n/de.ts src/i18n/it.ts src/i18n/fr.ts
git commit -m "Recordatorios: política de privacidad" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 9: Claves VAPID, publicación y documentación

**Files:**
- Crear: `scripts/generate-vapid.ts`
- Modificar: `docs/web/publicar-en-cloudflare.md`, `CLAUDE.md`, `wrangler.sync.jsonc`, `src/settings/pushConfig.ts`
- Notas del vault (fuera del repo): `C:\Bobeda obsidian\ideas\Gradus\Gradus - Próxima sesión.md`, `Gradus - Estado del proyecto.md`

- [ ] **Step 1:** escribir `scripts/generate-vapid.ts` con `node:crypto` WebCrypto: generar un par ECDSA P-256, exportar la pública en `raw` base64url y la privada como `jwk.d` base64url, e imprimir `VAPID_PUBLIC_KEY=...` y `VAPID_PRIVATE_KEY=...`.
- [ ] **Step 2 (autor):** ejecutar `npx tsx scripts/generate-vapid.ts`. Pegar la pública en `src/settings/pushConfig.ts` (constante `VAPID_PUBLIC_KEY`) y en `wrangler.sync.jsonc` (`vars.VAPID_PUBLIC_KEY`). Guardar la privada solo como secreto: `npx wrangler secret put VAPID_PRIVATE_KEY -c wrangler.sync.jsonc`. No pegarla en el chat, en el repo ni en la documentación.
- [ ] **Step 3:** agregar en `docs/web/publicar-en-cloudflare.md` una sección «Recordatorios: Web Push en el Worker gradus-sync» con: generar las claves, pegar la pública, `wrangler secret put`, aplicar `workers/reminders/schema.sql` con `--remote`, desplegar con `wrangler deploy -c wrangler.sync.jsonc` (incluye el cron `*/5 * * * *`) y probar con DevTools > Application > Service Workers > Push.
- [ ] **Step 4:** actualizar `CLAUDE.md` con un párrafo de la versión 3: módulos del cliente, ruta `/v1/reminders`, tablas, cron, VAPID, marca local `gradus-practica`, comando de pruebas y dónde está la guía de publicación.
- [ ] **Step 5:** actualizar las notas del vault: en «Próxima sesión», marcar la versión 3 como implementada y pendiente de publicación; en «Estado del proyecto», agregar el estado y los pendientes de prueba en iPhone/Android. Mantener la fecha 11-11-2026.
- [ ] **Step 6:** `npm test`, `npx tsc --noEmit`, `npx expo lint` → sin errores. Commit.

```bash
git add scripts/generate-vapid.ts docs/web/publicar-en-cloudflare.md CLAUDE.md wrangler.sync.jsonc src/settings/pushConfig.ts
git commit -m "Recordatorios: claves VAPID y guía de publicación" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 10: Validación

**Files:** ninguno nuevo; usar la spec y este plan.

- [ ] **Step 1:** `npx tsc --noEmit` → sin errores.
- [ ] **Step 2:** `npx expo lint` → sin errores ni avisos nuevos.
- [ ] **Step 3:** `npm test` → todas las pruebas pasan, incluidas `workers/reminders/*.test.ts`, `scripts/pushSw.test.ts`, `src/settings/reminderClient.test.ts`, `src/settings/offers.test.ts` y `src/progress/practiceMarkLogic.test.ts`.
- [ ] **Step 4:** `npm run build:web` → `dist/app/push-sw.js` existe y `dist/app/sw.js` importa `/app/push-sw.js`.
- [ ] **Step 5:** en Chrome de escritorio o Android: activar el recordatorio, conceder permiso, simular un push desde DevTools (Application > Service Workers > Push) y comprobar que aparece el título del bot y el texto; tocar la notificación y comprobar que abre `/app/`.
- [ ] **Step 6:** practicar hoy (lección, puzzle o partida), simular otro push y comprobar que **no** aparece. Borrar la marca (`caches.delete('gradus-practica')` en la consola) y comprobar que vuelve a aparecer.
- [ ] **Step 7:** en un iPhone con la app instalada en la pantalla de inicio: activar, recibir un aviso y tocar la notificación.
- [ ] **Step 8:** denegar el permiso o revocarlo desde el navegador: la fila queda apagada, el registro del servidor se borra y no queda un interruptor encendido sin efecto.
- [ ] **Step 9:** comprobar el Worker en producción: `POST /v1/reminders` con un endpoint de prueba y avisos con `dueAt` lejano → 201; `PUT` y `DELETE` con el secreto → 204; sin secreto → 403; después borrar el dispositivo de prueba. Revisar `SELECT COUNT(*) FROM reminders;` y `SELECT COUNT(*) FROM reminder_notices;` con `wrangler d1 execute`.
- [ ] **Step 9b:** con la sincronización activa en dos dispositivos, abrir el segundo y comprobar que el plan se recalcula cuando llega la racha combinada (el efecto de `useReminderSync` depende de `progress.streak`; no hace falta un pedido extra de sincronización).
- [ ] **Step 10:** recorrer la spec requisito por requisito y anotar qué test o recorrido lo cubre. Si algo no está cubierto, decirlo antes de dar la versión por terminada. Actualizar la spec si el comportamiento final cambió.
- [ ] **Step 11 (autor):** desplegar con `npx wrangler deploy -c wrangler.sync.jsonc`, etiquetar `web-v3.0.0` después de comprobar producción y subir solo `main` (nunca `git push --all`).
