import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handle, type ProgressStore } from './handler';

type Row = { version: number; data: string | null; deleted: boolean };

// Store en memoria con la misma semántica que el de D1.
function memoryStore() {
  const rows = new Map<string, Row>();
  const store: ProgressStore = {
    async get(id) {
      const r = rows.get(id);
      return r ? { ...r } : null;
    },
    async put(id, expected, data) {
      const r = rows.get(id);
      if (!r) {
        if (expected !== 0) return 'conflict';
        rows.set(id, { version: 1, data, deleted: false });
        return 'ok';
      }
      if (r.deleted) return 'deleted';
      if (r.version !== expected) return 'conflict';
      rows.set(id, { version: expected + 1, data, deleted: false });
      return 'ok';
    },
    async remove(id) {
      rows.set(id, { version: rows.get(id)?.version ?? 0, data: null, deleted: true });
    },
  };
  return { store, rows };
}

const KEY = 'A'.repeat(43);
const KEY2 = 'B'.repeat(43);
const URL = 'https://sync.graduschess.com/v1/progress';

function req(method: string, key: string | null, body?: unknown, origin?: string) {
  const headers: Record<string, string> = {};
  if (key !== null) headers.Authorization = `Bearer ${key}`;
  if (origin) headers.Origin = origin;
  return new Request(URL, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
}

test('GET sin datos da 404', async () => {
  const { store } = memoryStore();
  assert.equal((await handle(req('GET', KEY), store)).status, 404);
});

test('PUT con version 0 crea y devuelve version 1; GET devuelve version y data', async () => {
  const { store } = memoryStore();
  const put = await handle(req('PUT', KEY, { version: 0, data: 'hola' }), store);
  assert.equal(put.status, 200);
  assert.deepEqual(await put.json(), { version: 1 });
  const get = await handle(req('GET', KEY), store);
  assert.equal(get.status, 200);
  assert.deepEqual(await get.json(), { version: 1, data: 'hola' });
});

test('PUT con version vieja da 409 con lo actual', async () => {
  const { store } = memoryStore();
  await handle(req('PUT', KEY, { version: 0, data: 'a' }), store);
  await handle(req('PUT', KEY, { version: 1, data: 'b' }), store);
  const res = await handle(req('PUT', KEY, { version: 1, data: 'c' }), store);
  assert.equal(res.status, 409);
  assert.deepEqual(await res.json(), { version: 2, data: 'b' });
});

test('DELETE deja 410 en GET y en PUT, y repetir DELETE da 204', async () => {
  const { store } = memoryStore();
  await handle(req('PUT', KEY, { version: 0, data: 'a' }), store);
  assert.equal((await handle(req('DELETE', KEY), store)).status, 204);
  assert.equal((await handle(req('GET', KEY), store)).status, 410);
  assert.equal((await handle(req('PUT', KEY, { version: 1, data: 'x' }), store)).status, 410);
  assert.equal((await handle(req('DELETE', KEY), store)).status, 204);
});

test('llave de 42 caracteres o con caracteres fuera de base64url da 400', async () => {
  const { store } = memoryStore();
  assert.equal((await handle(req('GET', 'A'.repeat(42)), store)).status, 400);
  assert.equal((await handle(req('GET', 'A'.repeat(42) + '+'), store)).status, 400);
  assert.equal((await handle(req('GET', 'A'.repeat(42) + '='), store)).status, 400);
  assert.equal((await handle(req('GET', null), store)).status, 400);
});

test('data de 512 * 1024 + 1 bytes da 413', async () => {
  const { store } = memoryStore();
  const ok = await handle(req('PUT', KEY, { version: 0, data: 'a'.repeat(512 * 1024) }), store);
  assert.equal(ok.status, 200);
  const big = await handle(req('PUT', KEY2, { version: 0, data: 'a'.repeat(512 * 1024 + 1) }), store);
  assert.equal(big.status, 413);
});

test('dos llaves distintas no ven el progreso de la otra', async () => {
  const { store } = memoryStore();
  await handle(req('PUT', KEY, { version: 0, data: 'a' }), store);
  assert.equal((await handle(req('GET', KEY2), store)).status, 404);
});

test('el store recibe el SHA-256 hex de la llave, nunca la llave', async () => {
  const { store, rows } = memoryStore();
  await handle(req('PUT', KEY, { version: 0, data: 'a' }), store);
  const ids = [...rows.keys()];
  assert.equal(ids.length, 1);
  assert.notEqual(ids[0], KEY);
  assert.match(ids[0], /^[0-9a-f]{64}$/);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(KEY));
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  assert.equal(ids[0], hex);
});

test('OPTIONS desde graduschess.com da 204 con Allow-Origin; desde otro origen no lo trae', async () => {
  const { store } = memoryStore();
  const ok = await handle(req('OPTIONS', null, undefined, 'https://graduschess.com'), store);
  assert.equal(ok.status, 204);
  assert.equal(ok.headers.get('Access-Control-Allow-Origin'), 'https://graduschess.com');
  assert.equal(ok.headers.get('Access-Control-Allow-Methods'), 'GET, PUT, DELETE');
  const otro = await handle(req('OPTIONS', null, undefined, 'https://malo.example'), store);
  assert.equal(otro.status, 204);
  assert.equal(otro.headers.get('Access-Control-Allow-Origin'), null);
});

test('otra ruta da 404', async () => {
  const { store } = memoryStore();
  const res = await handle(new Request('https://sync.graduschess.com/otra', { headers: { Authorization: `Bearer ${KEY}` } }), store);
  assert.equal(res.status, 404);
});

test('PUT con version mayor que 0 y sin fila da 409, no crea nada', async () => {
  const { store, rows } = memoryStore();
  const res = await handle(req('PUT', KEY, { version: 5, data: 'x' }), store);
  assert.equal(res.status, 409);
  assert.equal(rows.size, 0);
});

test('Content-Length mayor que el tope da 413 sin leer el cuerpo', async () => {
  const { store } = memoryStore();
  let read = false;
  const fake = {
    method: 'PUT',
    url: URL,
    headers: new Headers({ Authorization: `Bearer ${KEY}`, 'Content-Length': String(3 * 1024 * 1024) }),
    json: async () => {
      read = true;
      return {};
    },
  } as unknown as Request;
  assert.equal((await handle(fake, store)).status, 413);
  assert.equal(read, false);
});

test('un PUT normal con Content-Length razonable sigue funcionando', async () => {
  const { store } = memoryStore();
  const withLen = new Request(URL, { method: 'PUT', headers: { Authorization: `Bearer ${KEY}`, 'Content-Length': '30' }, body: JSON.stringify({ version: 0, data: 'hola' }) });
  assert.equal((await handle(withLen, store)).status, 200);
  assert.equal((await handle(req('PUT', KEY2, { version: 0, data: 'hola' }), store)).status, 200);
});

test('si el almacén falla responde 500 con las cabeceras CORS', async () => {
  const boom = async () => {
    throw new Error('D1 caído');
  };
  const store: ProgressStore = { get: boom, put: boom, remove: boom };
  for (const m of ['GET', 'PUT', 'DELETE']) {
    const res = await handle(req(m, KEY, m === 'PUT' ? { version: 0, data: 'x' } : undefined, 'https://graduschess.com'), store);
    assert.equal(res.status, 500, m);
    assert.equal(res.headers.get('Access-Control-Allow-Origin'), 'https://graduschess.com', m);
  }
});
