import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchOrCreateKey, isSyncKey, keyFromFile, keyToFile, newSyncKey, resolveActiveKey } from './syncKey';
import type { DriveFile } from './driveRest';

const KEY = 'A'.repeat(43);

function fakeFile(initial: string | null) {
  const writes: string[] = [];
  const file: DriveFile = {
    read: async () => initial,
    write: async (t) => {
      writes.push(t);
    },
    remove: async () => {},
  };
  return { file, writes };
}

test('newSyncKey da 43 caracteres válidos y dos llamadas difieren', () => {
  const a = newSyncKey();
  const b = newSyncKey();
  assert.equal(a.length, 43);
  assert.ok(isSyncKey(a));
  assert.notEqual(a, b);
});

test('keyFromFile de keyToFile devuelve la llave', () => {
  assert.equal(keyFromFile(keyToFile(KEY)), KEY);
  assert.equal(keyToFile(KEY), `{"gradus":"llave","v":1,"key":"${KEY}"}`);
});

test('keyFromFile con JSON ajeno, llave corta o texto roto da null', () => {
  assert.equal(keyFromFile('{"otra":"cosa"}'), null);
  assert.equal(keyFromFile('{"gradus":"llave","v":1,"key":"corta"}'), null);
  assert.equal(keyFromFile('{"gradus":"progreso","v":1,"key":"' + KEY + '"}'), null);
  assert.equal(keyFromFile('no es json{'), null);
});

test('fetchOrCreateKey devuelve la de Drive sin escribir', async () => {
  const { file, writes } = fakeFile(keyToFile(KEY));
  assert.equal(await fetchOrCreateKey(file, () => 'B'.repeat(43)), KEY);
  assert.equal(writes.length, 0);
});

test('sin archivo crea, escribe y devuelve la nueva', async () => {
  const { file, writes } = fakeFile(null);
  const nueva = 'B'.repeat(43);
  assert.equal(await fetchOrCreateKey(file, () => nueva), nueva);
  assert.deepEqual(writes, [keyToFile(nueva)]);
});

test('con archivo dañado lo reemplaza', async () => {
  const { file, writes } = fakeFile('basura');
  const nueva = 'C'.repeat(43);
  assert.equal(await fetchOrCreateKey(file, () => nueva), nueva);
  assert.deepEqual(writes, [keyToFile(nueva)]);
});

test('si tras escribir Drive tiene otra llave válida (ganó otro dispositivo), devuelve esa', async () => {
  const ajena = 'Z'.repeat(43);
  let reads = 0;
  const file: DriveFile = {
    read: async () => (reads++ === 0 ? null : keyToFile(ajena)),
    write: async () => {},
    remove: async () => {},
  };
  assert.equal(await fetchOrCreateKey(file, () => 'B'.repeat(43)), ajena);
});

test('newSyncKey con bytes fijos: ceros dan 43 A y 0xFB/0xFF dan - y _', () => {
  assert.equal(newSyncKey((b) => b.fill(0)), 'A'.repeat(43));
  const k = newSyncKey((b) => {
    b[0] = 0xfb;
    b[1] = 0xff;
    return b;
  });
  assert.equal(k.slice(0, 3), '-_8');
});

test('si la relectura tras escribir lanza, devuelve la llave generada', async () => {
  let reads = 0;
  const file: DriveFile = {
    read: async () => {
      if (reads++ === 0) return null;
      throw new Error('red caída');
    },
    write: async () => {},
    remove: async () => {},
  };
  assert.equal(await fetchOrCreateKey(file, () => 'B'.repeat(43)), 'B'.repeat(43));
});

test('si la relectura tras escribir da null, devuelve la llave generada', async () => {
  const file: DriveFile = { read: async () => null, write: async () => {}, remove: async () => {} };
  assert.equal(await fetchOrCreateKey(file, () => 'B'.repeat(43)), 'B'.repeat(43));
});

// Archivo de Drive en memoria: remove lo vacía.
function memoryFile(initial: string | null) {
  let text = initial;
  let removed = 0;
  const file: DriveFile = {
    read: async () => text,
    write: async (t) => {
      text = t;
    },
    remove: async () => {
      removed++;
      text = null;
    },
  };
  return { file, removed: () => removed, text: () => text };
}

test('resolveActiveKey: llave aceptada se devuelve y Drive no se toca', async () => {
  const m = memoryFile(keyToFile(KEY));
  assert.equal(await resolveActiveKey(m.file, async () => 'ok'), KEY);
  assert.equal(m.removed(), 0);
});

test('resolveActiveKey: llave revocada borra el archivo una vez y devuelve otra, ya guardada', async () => {
  const m = memoryFile(keyToFile(KEY));
  const key = await resolveActiveKey(m.file, async (k) => (k === KEY ? 'revoked' : 'ok'));
  assert.equal(m.removed(), 1);
  assert.notEqual(key, KEY);
  assert.ok(isSyncKey(key));
  assert.equal(keyFromFile(m.text()!), key);
});

test('resolveActiveKey: sin conexión se propaga y Drive no se toca', async () => {
  const m = memoryFile(keyToFile(KEY));
  await assert.rejects(resolveActiveKey(m.file, async () => { throw new Error('offline'); }), /offline/);
  assert.equal(m.removed(), 0);
  assert.equal(keyFromFile(m.text()!), KEY);
});

test('resolveActiveKey: si la llave nueva también sale revocada, lanza sin repetir', async () => {
  const m = memoryFile(keyToFile(KEY));
  let calls = 0;
  await assert.rejects(resolveActiveKey(m.file, async () => { calls++; return 'revoked'; }));
  assert.equal(calls, 2);
  assert.equal(m.removed(), 1);
});
