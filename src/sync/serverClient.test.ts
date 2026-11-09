import test from 'node:test';
import assert from 'node:assert/strict';
import { SyncConflict, SyncError, type SyncErrorKind } from './syncEngine';
import { createServerClient } from './serverClient';

type Call = { url: string; method: string; headers: Record<string, string>; body?: string };

/** `fetch` de mentira: responde en orden con lo que se le da y anota cada llamada. */
function fakeFetch(responses: (Response | Error)[]) {
  const calls: Call[] = [];
  const f = (async (input: unknown, init?: RequestInit) => {
    calls.push({
      url: String(input),
      method: init?.method ?? 'GET',
      headers: Object.fromEntries(Object.entries((init?.headers ?? {}) as Record<string, string>)),
      body: typeof init?.body === 'string' ? init.body : undefined,
    });
    const next = responses.shift();
    if (!next) throw new Error('sin respuesta preparada');
    if (next instanceof Error) throw next;
    return next;
  }) as typeof fetch;
  return { f, calls };
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

const make = (responses: (Response | Error)[], key: string | null = 'LLAVE') => {
  const { f, calls } = fakeFetch(responses);
  return { calls, client: createServerClient({ fetch: f, baseUrl: 'https://sync.test', getKey: () => key }) };
};

async function failsWith(p: Promise<unknown>, kind: SyncErrorKind) {
  await assert.rejects(p, (e: unknown) => e instanceof SyncError && e.kind === kind, kind);
}

test('read con 404 devuelve null', async () => {
  const { client, calls } = make([new Response(null, { status: 404 })]);
  assert.equal(await client.read(), null);
  assert.equal(calls[0].url, 'https://sync.test/v1/progress');
  assert.equal(calls[0].headers.Authorization, 'Bearer LLAVE');
});

test('read con 200 devuelve versión y texto', async () => {
  const { client } = make([json({ version: 3, data: 'hola' })]);
  assert.deepEqual(await client.read(), { version: 3, text: 'hola' });
});

test('read con 410 lanza revoked', async () => {
  const { client } = make([new Response(null, { status: 410 })]);
  await failsWith(client.read(), 'revoked');
});

test('write manda Bearer, version y data y devuelve la versión nueva', async () => {
  const { client, calls } = make([json({ version: 5 })]);
  assert.equal(await client.write('texto', 4), 5);
  assert.equal(calls[0].method, 'PUT');
  assert.equal(calls[0].headers.Authorization, 'Bearer LLAVE');
  assert.deepEqual(JSON.parse(calls[0].body!), { version: 4, data: 'texto' });
});

test('write con 409 lanza SyncConflict con version y text', async () => {
  const { client } = make([json({ version: 7, data: 'remoto' }, 409)]);
  await assert.rejects(client.write('x', 1), (e: unknown) => e instanceof SyncConflict && e.remote.version === 7 && e.remote.text === 'remoto');
});

test('write con 410 lanza revoked y con 413 tooLarge', async () => {
  const { client } = make([new Response(null, { status: 410 }), new Response(null, { status: 413 })]);
  await failsWith(client.write('x', 1), 'revoked');
  await failsWith(client.write('x', 1), 'tooLarge');
});

test('otros códigos lanzan other', async () => {
  const { client } = make([new Response(null, { status: 500 })]);
  await failsWith(client.read(), 'other');
});

test('fetch que rechaza lanza offline', async () => {
  const { client } = make([new TypeError('Failed to fetch')]);
  await failsWith(client.read(), 'offline');
});

test('sin llave lanza revoked sin llamar a fetch', async () => {
  const { client, calls } = make([], null);
  await failsWith(client.read(), 'revoked');
  await failsWith(client.write('x', 0), 'revoked');
  assert.equal(calls.length, 0);
});

const html = (status: number) => new Response('<html>portal</html>', { status });

test('read con 200 que no es JSON lanza other', async () => {
  const { client } = make([html(200)]);
  await failsWith(client.read(), 'other');
});

test('write con 409 que no es JSON lanza other, no SyncConflict', async () => {
  const { client } = make([html(409)]);
  await failsWith(client.write('x', 1), 'other');
});

test('200 con tipos incorrectos lanza other (read y write)', async () => {
  const { client } = make([json({ version: 'a', data: 'x' }), json({ version: 1, data: 5 }), json({ version: null })]);
  await failsWith(client.read(), 'other');
  await failsWith(client.read(), 'other');
  await failsWith(client.write('x', 1), 'other');
});

test('cuerpo que falla al leerse a mitad de la respuesta lanza offline', async () => {
  const res = new Response('{}', { status: 200 });
  res.json = () => Promise.reject(new TypeError('terminated'));
  const { client } = make([res]);
  await failsWith(client.read(), 'offline');
});

test('deleteProgress manda DELETE con Bearer y acepta 204 y 410', async () => {
  const { client, calls } = make([new Response(null, { status: 204 }), new Response(null, { status: 410 })]);
  await client.deleteProgress();
  await client.deleteProgress();
  assert.equal(calls[0].method, 'DELETE');
  assert.equal(calls[0].url, 'https://sync.test/v1/progress');
  assert.equal(calls[0].headers.Authorization, 'Bearer LLAVE');
});

test('deleteProgress sin red lanza offline, con 500 other y sin llave revoked', async () => {
  const a = make([new TypeError('Failed to fetch')]);
  await failsWith(a.client.deleteProgress(), 'offline');
  const b = make([new Response(null, { status: 500 })]);
  await failsWith(b.client.deleteProgress(), 'other');
  const c = make([], null);
  await failsWith(c.client.deleteProgress(), 'revoked');
});
