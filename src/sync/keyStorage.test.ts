import test from 'node:test';
import assert from 'node:assert/strict';
import { clearKeyIf, KEY_STORAGE, OLD_FLAG_KEY, readKey, writeKey } from './keyStorage';
import { newSyncKey } from './syncKey';

/** Almacenamiento de mentira en memoria. */
function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

test('readKey con una llave válida la devuelve', () => {
  const key = newSyncKey();
  assert.equal(readKey(fakeStorage({ [KEY_STORAGE]: key })), key);
});

test('readKey con texto que no es llave da null', () => {
  assert.equal(readKey(fakeStorage({ [KEY_STORAGE]: 'hola' })), null);
  assert.equal(readKey(fakeStorage()), null);
});

test('readKey si getItem lanza da null', () => {
  const broken = { getItem: () => { throw new Error('bloqueado'); } };
  assert.equal(readKey(broken), null);
});

test('writeKey guarda la llave y writeKey(null) la borra', () => {
  const s = fakeStorage();
  const key = newSyncKey();
  writeKey(s, key);
  assert.equal(s.data.get(KEY_STORAGE), key);
  writeKey(s, null);
  assert.equal(s.data.has(KEY_STORAGE), false);
});

test('writeKey no lanza si el almacenamiento falla', () => {
  const broken = { setItem: () => { throw new Error('lleno'); }, removeItem: () => { throw new Error('x'); } };
  assert.doesNotThrow(() => writeKey(broken, newSyncKey()));
  assert.doesNotThrow(() => writeKey(broken, null));
});

test('readKey borra la clave vieja gradus:driveSync', () => {
  const s = fakeStorage({ [OLD_FLAG_KEY]: '1' });
  assert.equal(readKey(s), null);
  assert.equal(s.data.has(OLD_FLAG_KEY), false);
});

test('clearKeyIf borra la llave guardada si es la misma', () => {
  const key = newSyncKey();
  const s = fakeStorage({ [KEY_STORAGE]: key });
  clearKeyIf(s, key);
  assert.equal(s.data.has(KEY_STORAGE), false);
});

test('clearKeyIf deja la llave guardada si es otra (la escribió otra pestaña)', () => {
  const nueva = newSyncKey();
  const s = fakeStorage({ [KEY_STORAGE]: nueva });
  clearKeyIf(s, newSyncKey());
  assert.equal(s.data.get(KEY_STORAGE), nueva);
});

test('clearKeyIf sin nada guardado no hace nada, y con almacenamiento que lanza no lanza', () => {
  const s = fakeStorage();
  clearKeyIf(s, newSyncKey());
  assert.equal(s.data.size, 0);
  const broken = { getItem: () => { throw new Error('bloqueado'); }, removeItem: () => { throw new Error('bloqueado'); } };
  assert.doesNotThrow(() => clearKeyIf(broken, newSyncKey()));
});
