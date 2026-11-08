import test from 'node:test';
import assert from 'node:assert/strict';
import { DriveError } from './syncEngine';
import { createDriveRestClient, DRIVE_FILE_NAME } from './driveRest';

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
const text = (body: string, status = 200) => new Response(body, { status });
const apiError = (status: number, reason: string) => json({ error: { code: status, errors: [{ reason }] } }, status);

const client = (responses: (Response | Error)[]) => {
  const { f, calls } = fakeFetch(responses);
  return { calls, drive: createDriveRestClient({ fetch: f, getToken: async () => 'TOKEN' }) };
};

async function failsWith(p: Promise<unknown>, kind: DriveError['kind']) {
  await assert.rejects(p, (e: unknown) => e instanceof DriveError && e.kind === kind, kind);
}

test('read: si no hay archivo en la carpeta oculta devuelve null', async () => {
  const { drive, calls } = client([json({ files: [] })]);
  assert.equal(await drive.read(), null);
  assert.equal(calls.length, 1);
  const url = new URL(calls[0].url);
  assert.equal(url.origin + url.pathname, 'https://www.googleapis.com/drive/v3/files');
  assert.equal(url.searchParams.get('spaces'), 'appDataFolder');
  assert.match(url.searchParams.get('q') ?? '', new RegExp(DRIVE_FILE_NAME.replace('.', '\\.')));
  assert.equal(calls[0].headers.Authorization, 'Bearer TOKEN');
});

test('read: con archivo, lo baja como texto', async () => {
  const { drive, calls } = client([json({ files: [{ id: 'F1' }] }), text('{"hola":1}')]);
  assert.equal(await drive.read(), '{"hola":1}');
  assert.match(calls[1].url, /\/drive\/v3\/files\/F1\?alt=media/);
});

test('write: sin archivo lo crea en appDataFolder con subida multipart', async () => {
  const { drive, calls } = client([json({ files: [] }), json({ id: 'NEW' })]);
  await drive.write('{"a":1}');
  const create = calls[1];
  assert.equal(create.method, 'POST');
  assert.match(create.url, /upload\/drive\/v3\/files\?uploadType=multipart/);
  assert.match(create.headers['Content-Type'], /^multipart\/related; boundary=/);
  assert.match(create.body ?? '', /"parents":\["appDataFolder"\]/);
  assert.match(create.body ?? '', new RegExp(`"name":"${DRIVE_FILE_NAME}"`));
  assert.match(create.body ?? '', /\{"a":1\}/);
});

test('write: con archivo existente lo actualiza con PATCH y no lo busca otra vez', async () => {
  const { drive, calls } = client([json({ files: [{ id: 'F1' }] }), json({ id: 'F1' }), json({ id: 'F1' })]);
  await drive.write('uno');
  await drive.write('dos');
  assert.equal(calls.length, 3, 'una búsqueda y dos subidas');
  assert.equal(calls[1].method, 'PATCH');
  assert.match(calls[1].url, /upload\/drive\/v3\/files\/F1\?uploadType=media/);
  assert.equal(calls[1].body, 'uno');
  assert.equal(calls[2].body, 'dos');
});

test('write: si el archivo recordado ya no existe (404), lo vuelve a crear', async () => {
  const { drive, calls } = client([
    json({ files: [{ id: 'F1' }] }),
    json({ id: 'F1' }),
    apiError(404, 'notFound'),
    json({ files: [] }),
    json({ id: 'F2' }),
  ]);
  await drive.write('uno');
  await drive.write('dos');
  assert.equal(calls[calls.length - 1].method, 'POST');
});

test('read: un 404 al bajar el archivo cuenta como que no existe', async () => {
  const { drive } = client([json({ files: [{ id: 'F1' }] }), apiError(404, 'notFound')]);
  assert.equal(await drive.read(), null);
});

test('errores: 401 es auth', async () => {
  await failsWith(client([apiError(401, 'authError')]).drive.read(), 'auth');
});

test('errores: 403 con cuota llena es quota', async () => {
  await failsWith(client([json({ files: [] }), apiError(403, 'storageQuotaExceeded')]).drive.write('x'), 'quota');
});

test('errores: otro 403 es forbidden (cuenta que no lo permite)', async () => {
  await failsWith(client([apiError(403, 'forbidden')]).drive.read(), 'forbidden');
});

test('errores: 429 y 500 son other', async () => {
  await failsWith(client([apiError(429, 'rateLimitExceeded')]).drive.read(), 'other');
  await failsWith(client([json({}, 500)]).drive.read(), 'other');
});

test('errores: fetch que falla por red es offline', async () => {
  await failsWith(client([new TypeError('Failed to fetch')]).drive.read(), 'offline');
});

test('errores: si no hay permiso vigente se propaga como auth', async () => {
  const { f } = fakeFetch([]);
  const drive = createDriveRestClient({
    fetch: f,
    getToken: async () => {
      throw new DriveError('auth');
    },
  });
  await failsWith(drive.read(), 'auth');
});
