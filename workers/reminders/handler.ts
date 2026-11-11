// Lógica pura de la API de recordatorios Web Push: solo APIs web (Request, Response, crypto.subtle), así corre igual
// en el Worker y en las pruebas. El servidor guarda el SHA-256 del secreto (nunca el secreto), la suscripción y los
// avisos pendientes: sin progreso, racha, nombre ni correo.

import { corsHeaders } from '../cors';

export type ReminderSubscription = { endpoint: string; keys: { p256dh: string; auth: string } };

export type ReminderNoticeInput = { dueAt: string; title: string; body: string };

export type ReminderStore = {
  createDevice(input: {
    id: string;
    secretHash: string;
    subscription: ReminderSubscription;
    notices: ReminderNoticeInput[];
    now: string;
  }): Promise<void>;
  findDevice(id: string): Promise<{ secretHash: string } | null>;
  replaceNotices(id: string, notices: ReminderNoticeInput[], now: string): Promise<void>;
  removeDevice(id: string): Promise<void>;
};

export type ReminderLimiter = { limit(options: { key: string }): Promise<{ success: boolean }> };

export type PushSender = { send(sub: ReminderSubscription, payload: string): Promise<'ok' | 'gone' | 'retry'> };

const DEVICE_ID = /^[A-Za-z0-9_-]{22}$/;
const SECRET = /^[A-Za-z0-9_-]{43}$/;
const MAX_BODY_BYTES = 16 * 1024;
const MAX_NOTICES = 7;
const MAX_TITLE = 120;
const MAX_BODY_TEXT = 300;

// Solo los servicios Push reales: un endpoint cualquiera convertiría al Worker en un emisor hacia terceros.
const PUSH_HOSTS = ['fcm.googleapis.com', 'updates.push.services.mozilla.com', 'web.push.apple.com', 'wns.windows.com'];

const DEVICE_PATH = /^\/v1\/reminders\/([^/]+)$/;
const BEARER = /^Bearer (.+)$/;

type Reply = (status: number, body?: unknown) => Response;
type Authorized = { ok: true } | { ok: false; response: Response };

function isPushEndpoint(endpoint: string): boolean {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:') return false;
  return PUSH_HOSTS.includes(url.hostname) || url.hostname.endsWith('.notify.windows.com');
}

function parseSubscription(value: unknown): ReminderSubscription | null {
  if (typeof value !== 'object' || value === null) return null;
  const { endpoint, keys } = value as { endpoint?: unknown; keys?: unknown };
  if (typeof endpoint !== 'string' || typeof keys !== 'object' || keys === null) return null;
  const { p256dh, auth } = keys as { p256dh?: unknown; auth?: unknown };
  if (typeof p256dh !== 'string' || p256dh.length === 0) return null;
  if (typeof auth !== 'string' || auth.length === 0) return null;
  if (!isPushEndpoint(endpoint)) return null;
  return { endpoint, keys: { p256dh, auth } };
}

function parseNotices(value: unknown): ReminderNoticeInput[] | null {
  if (!Array.isArray(value) || value.length > MAX_NOTICES) return null;
  const notices: ReminderNoticeInput[] = [];
  for (const raw of value) {
    if (typeof raw !== 'object' || raw === null) return null;
    const { dueAt, title, body } = raw as { dueAt?: unknown; title?: unknown; body?: unknown };
    if (typeof dueAt !== 'string' || typeof title !== 'string' || typeof body !== 'string') return null;
    if (title.length > MAX_TITLE || body.length > MAX_BODY_TEXT) return null;
    const date = new Date(dueAt);
    if (Number.isNaN(date.getTime())) return null;
    notices.push({ dueAt: date.toISOString(), title, body });
  }
  return notices;
}

function base64url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomBase64url(bytes: number): string {
  return base64url(crypto.getRandomValues(new Uint8Array(bytes)));
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Los dos valores son SHA-256 hex de 64 caracteres: se recorren enteros, sin cortar en la primera diferencia.
function sameHash(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

type BodyResult = { ok: true; value: unknown } | { ok: false; status: 400 | 413 };

// Mira el Content-Length antes de leer; si falta o miente, mide el texto ya leído.
async function readJsonBody(req: Request): Promise<BodyResult> {
  const declared = Number(req.headers.get('Content-Length'));
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return { ok: false, status: 413 };
  const text = await req.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) return { ok: false, status: 413 };
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, status: 400 };
  }
}

export async function handleReminders(
  req: Request,
  store: ReminderStore,
  now: () => Date = () => new Date(),
  limiter?: ReminderLimiter
): Promise<Response> {
  const cors = corsHeaders(req, 'POST, PUT, DELETE');
  const reply: Reply = (status, body) =>
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: body === undefined ? cors : { ...cors, 'Content-Type': 'application/json' },
    });

  if (req.method === 'OPTIONS') return reply(204);

  const path = new URL(req.url).pathname;
  const candidate = DEVICE_PATH.exec(path)?.[1];
  const deviceId = candidate && DEVICE_ID.test(candidate) ? candidate : null;

  // Un fallo del almacén responde 500 con las cabeceras CORS: sin ellas el navegador lo mostraría como un fallo opaco.
  try {
    if (req.method === 'POST' && path === '/v1/reminders') return await create(req, store, now, limiter, reply);
    if (req.method === 'PUT' && deviceId) return await replace(req, store, deviceId, now, reply);
    if (req.method === 'DELETE' && deviceId) return await remove(req, store, deviceId, reply);
  } catch {
    return reply(500, { error: 'error del servidor' });
  }

  return reply(404);
}

async function create(
  req: Request,
  store: ReminderStore,
  now: () => Date,
  limiter: ReminderLimiter | undefined,
  reply: Reply
): Promise<Response> {
  const body = await readJsonBody(req);
  if (!body.ok) return reply(body.status);

  const input = body.value as { subscription?: unknown; notices?: unknown } | null;
  const subscription = parseSubscription(input?.subscription);
  const notices = parseNotices(input?.notices);
  if (!subscription || !notices) return reply(400, { error: 'cuerpo inválido' });

  // Crear dispositivos es lo que llena la base: se limita por IP. Actualizar o borrar no cuenta.
  if (limiter) {
    const { success } = await limiter.limit({ key: req.headers.get('CF-Connecting-IP') ?? 'unknown' });
    if (!success) return reply(429, { error: 'demasiadas altas, prueba más tarde' });
  }

  const id = randomBase64url(16);
  const secret = randomBase64url(32);
  await store.createDevice({ id, secretHash: await sha256Hex(secret), subscription, notices, now: now().toISOString() });
  return reply(201, { deviceId: id, secret });
}

async function replace(req: Request, store: ReminderStore, id: string, now: () => Date, reply: Reply): Promise<Response> {
  const auth = await authorize(req, store, id, reply);
  if (!auth.ok) return auth.response;

  const body = await readJsonBody(req);
  if (!body.ok) return reply(body.status);
  const notices = parseNotices((body.value as { notices?: unknown } | null)?.notices);
  if (!notices) return reply(400, { error: 'cuerpo inválido' });

  await store.replaceNotices(id, notices, now().toISOString());
  return reply(204);
}

async function remove(req: Request, store: ReminderStore, id: string, reply: Reply): Promise<Response> {
  const auth = await authorize(req, store, id, reply);
  if (!auth.ok) return auth.response;
  await store.removeDevice(id);
  return reply(204);
}

async function authorize(req: Request, store: ReminderStore, id: string, reply: Reply): Promise<Authorized> {
  const match = BEARER.exec(req.headers.get('Authorization') ?? '');
  if (!match || !SECRET.test(match[1])) return { ok: false, response: reply(403, { error: 'secreto inválido' }) };
  const device = await store.findDevice(id);
  if (!device) return { ok: false, response: reply(404) };
  if (!sameHash(await sha256Hex(match[1]), device.secretHash)) {
    return { ok: false, response: reply(403, { error: 'secreto inválido' }) };
  }
  return { ok: true };
}
