import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchOrCreateKey, isSyncKey, keyFromFile, keyToFile, newSyncKey } from './syncKey';
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
