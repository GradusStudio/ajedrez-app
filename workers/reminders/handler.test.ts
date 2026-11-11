import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  handleReminders,
  type ReminderLimiter,
  type ReminderNoticeInput,
  type ReminderStore,
  type ReminderSubscription,
} from './handler';

type Row = { secretHash: string; subscription: ReminderSubscription; notices: ReminderNoticeInput[]; now: string };

// Store en memoria con la misma semántica que el de D1; guarda el hash tal como llega.
function memoryStore() {
  const rows = new Map<string, Row>();
  const store: ReminderStore = {
    async createDevice({ id, secretHash, subscription, notices, now }) {
      rows.set(id, { secretHash, subscription, notices, now });
    },
    async findDevice(id) {
      const row = rows.get(id);
      return row ? { secretHash: row.secretHash } : null;
    },
    async replaceNotices(id, notices, now) {
      const row = rows.get(id);
      if (row) rows.set(id, { ...row, notices, now });
    },
    async removeDevice(id) {
      rows.delete(id);
    },
  };
  return { store, rows };
}

const BASE = 'https://sync.graduschess.com';
const URL_REMINDERS = `${BASE}/v1/reminders`;
const SECRET = 'B'.repeat(43);

function subscription(endpoint = 'https://fcm.googleapis.com/fcm/send/abc'): ReminderSubscription {
  return { endpoint, keys: { p256dh: 'p'.repeat(20), auth: 'a'.repeat(10) } };
}

function notice(overrides: Partial<ReminderNoticeInput> = {}): ReminderNoticeInput {
  return { dueAt: '2026-11-12T09:00:00.000Z', title: 'Titán', body: 'Texto', ...overrides };
}

function req(
  method: string,
  path = '/v1/reminders',
  body?: unknown,
  options: { secret?: string; origin?: string } = {}
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.secret) headers.Authorization = `Bearer ${options.secret}`;
  if (options.origin) headers.Origin = options.origin;
  return new Request(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function created(store: ReminderStore) {
  const res = await handleReminders(req('POST', '/v1/reminders', { subscription: subscription(), notices: [notice()] }), store);
  assert.equal(res.status, 201);
  return (await res.json()) as { deviceId: string; secret: string };
}

function fakeLimiter(success: boolean) {
  const calls: string[] = [];
  const limiter: ReminderLimiter = {
    async limit({ key }) {
      calls.push(key);
      return { success };
    },
  };
  return { limiter, calls };
}

test('POST crea el dispositivo y devuelve deviceId de 22 y secreto de 43 caracteres', async () => {
  const { store } = memoryStore();
  const res = await handleReminders(req('POST', '/v1/reminders', { subscription: subscription(), notices: [notice()] }), store);
  assert.equal(res.status, 201);
  assert.equal(res.headers.get('Cache-Control'), 'no-store');
  const { deviceId, secret } = (await res.json()) as { deviceId: string; secret: string };
  assert.equal(deviceId.length, 22);
  assert.match(deviceId, /^[A-Za-z0-9_-]{22}$/);
  assert.equal(secret.length, 43);
  assert.match(secret, /^[A-Za-z0-9_-]{43}$/);

  const found = await store.findDevice(deviceId);
  assert.notEqual(found, null);
  assert.match(found!.secretHash, /^[0-9a-f]{64}$/);
  assert.notEqual(found!.secretHash, secret);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  assert.equal(found!.secretHash, hex);
});

test('POST rechaza un endpoint que no es de Google, Mozilla, Apple o Microsoft', async () => {
  const { store, rows } = memoryStore();
  const endpoints = [
    'https://malo.example/push',
    'https://fcm.googleapis.com.malo.example/push',
    'http://fcm.googleapis.com/push',
    'https://notify.windows.com/push',
    'https://malonotify.windows.com/push',
  ];
  for (const endpoint of endpoints) {
    const res = await handleReminders(req('POST', '/v1/reminders', { subscription: subscription(endpoint), notices: [notice()] }), store);
    assert.equal(res.status, 400, endpoint);
  }
  assert.equal(rows.size, 0);
});

test('POST rechaza más de 7 avisos', async () => {
  const { store, rows } = memoryStore();
  const notices = Array.from({ length: 8 }, (_, i) => notice({ dueAt: `2026-11-${12 + i}T09:00:00.000Z` }));
  const res = await handleReminders(req('POST', '/v1/reminders', { subscription: subscription(), notices }), store);
  assert.equal(res.status, 400);
  assert.equal(rows.size, 0);
});

test('POST rechaza un título de más de 120 caracteres', async () => {
  const { store, rows } = memoryStore();
  const res = await handleReminders(
    req('POST', '/v1/reminders', { subscription: subscription(), notices: [notice({ title: 'a'.repeat(121) })] }),
    store
  );
  assert.equal(res.status, 400);
  assert.equal(rows.size, 0);
});

test('POST rechaza un cuerpo de más de 16 KB', async () => {
  const { store, rows } = memoryStore();
  let read = false;
  const fake = {
    method: 'POST',
    url: URL_REMINDERS,
    headers: new Headers({ 'Content-Length': String(16 * 1024 + 1), Origin: 'https://graduschess.com' }),
    json: async () => {
      read = true;
      return {};
    },
    text: async () => {
      read = true;
      return '{}';
    },
  } as unknown as Request;
  const res = await handleReminders(fake, store);
  assert.equal(res.status, 413);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), 'https://graduschess.com');
  assert.equal(read, false);
  assert.equal(rows.size, 0);
});

test('PUT con el secreto correcto reemplaza los avisos', async () => {
  const { store, rows } = memoryStore();
  const { deviceId, secret } = await created(store);
  const nuevos = [
    notice({ dueAt: '2026-11-13T18:00:00+01:00', title: 'Nuevo', body: 'Primero' }),
    notice({ dueAt: '2026-11-14T09:00:00Z', title: 'Nuevo 2', body: 'Segundo' }),
  ];
  const res = await handleReminders(req('PUT', `/v1/reminders/${deviceId}`, { notices: nuevos }, { secret }), store);
  assert.equal(res.status, 204);
  assert.equal(res.headers.get('Cache-Control'), 'no-store');
  assert.deepEqual(rows.get(deviceId)?.notices, [
    { dueAt: '2026-11-13T17:00:00.000Z', title: 'Nuevo', body: 'Primero' },
    { dueAt: '2026-11-14T09:00:00.000Z', title: 'Nuevo 2', body: 'Segundo' },
  ]);
});

test('PUT con el secreto incorrecto da 403', async () => {
  const { store, rows } = memoryStore();
  const { deviceId, secret } = await created(store);
  const incorrecto = (secret[0] === 'A' ? 'B' : 'A') + secret.slice(1);
  const antes = rows.get(deviceId)?.notices;
  const res = await handleReminders(req('PUT', `/v1/reminders/${deviceId}`, { notices: [] }, { secret: incorrecto }), store);
  assert.equal(res.status, 403);
  assert.deepEqual(rows.get(deviceId)?.notices, antes);
  const sin = await handleReminders(req('PUT', `/v1/reminders/${deviceId}`, { notices: [] }), store);
  assert.equal(sin.status, 403);
});

test('PUT de un id desconocido da 404', async () => {
  const { store } = memoryStore();
  const res = await handleReminders(req('PUT', `/v1/reminders/${'C'.repeat(22)}`, { notices: [notice()] }, { secret: SECRET }), store);
  assert.equal(res.status, 404);
});

test('DELETE con el secreto correcto borra el dispositivo', async () => {
  const { store, rows } = memoryStore();
  const { deviceId, secret } = await created(store);
  const res = await handleReminders(req('DELETE', `/v1/reminders/${deviceId}`, undefined, { secret }), store);
  assert.equal(res.status, 204);
  assert.equal(await store.findDevice(deviceId), null);
  assert.equal(rows.size, 0);
});

test('GET /v1/reminders no existe', async () => {
  const { store } = memoryStore();
  const res = await handleReminders(req('GET', '/v1/reminders'), store);
  assert.equal(res.status, 404);
});

test('OPTIONS desde https://graduschess.com da 204 con Allow-Origin; desde https://otro.example no lo trae', async () => {
  const { store } = memoryStore();
  const ok = await handleReminders(req('OPTIONS', '/v1/reminders', undefined, { origin: 'https://graduschess.com' }), store);
  assert.equal(ok.status, 204);
  assert.equal(ok.headers.get('Access-Control-Allow-Origin'), 'https://graduschess.com');
  assert.equal(ok.headers.get('Access-Control-Allow-Methods'), 'POST, PUT, DELETE');
  const otro = await handleReminders(req('OPTIONS', '/v1/reminders', undefined, { origin: 'https://otro.example' }), store);
  assert.equal(otro.status, 204);
  assert.equal(otro.headers.get('Access-Control-Allow-Origin'), null);
});

test('el limitador solo se usa en POST y devuelve 429 cuando no permite', async () => {
  const { store } = memoryStore();
  const { deviceId, secret } = await created(store);
  const { limiter, calls } = fakeLimiter(false);

  const bloqueado = await handleReminders(
    req('POST', '/v1/reminders', { subscription: subscription(), notices: [notice()] }, { origin: 'https://graduschess.com' }),
    store,
    undefined,
    limiter
  );
  assert.equal(bloqueado.status, 429);
  assert.equal(bloqueado.headers.get('Access-Control-Allow-Origin'), 'https://graduschess.com');
  assert.equal(calls.length, 1);

  assert.equal(
    (await handleReminders(req('PUT', `/v1/reminders/${deviceId}`, { notices: [notice()] }, { secret }), store, undefined, limiter)).status,
    204
  );
  assert.equal((await handleReminders(req('DELETE', `/v1/reminders/${deviceId}`, undefined, { secret }), store, undefined, limiter)).status, 204);
  assert.equal(
    (await handleReminders(req('OPTIONS', '/v1/reminders', undefined, { origin: 'https://graduschess.com' }), store, undefined, limiter)).status,
    204
  );
  assert.equal(calls.length, 1);
});
