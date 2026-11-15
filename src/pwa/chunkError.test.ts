import assert from 'node:assert/strict';
import test from 'node:test';
import { isChunkLoadError, shouldReloadForChunk } from './chunkError';

test('reconoce los mensajes de trozo que no carga', () => {
  assert.equal(isChunkLoadError(new Error('ChunkLoadError: Loading chunk 42 failed.')), true);
  assert.equal(isChunkLoadError(new Error('Failed to fetch dynamically imported module: https://graduschess.com/app/entry.js')), true);
  assert.equal(isChunkLoadError(new Error('error loading dynamically imported module')), true);
  assert.equal(isChunkLoadError(new Error('Importing a module script failed.')), true);
  assert.equal(isChunkLoadError('Loading chunk src_screens_Perfil_tsx failed'), true);
});

test('no confunde un error de la pantalla con uno de trozo', () => {
  assert.equal(isChunkLoadError(new Error('Cannot read properties of undefined')), false);
  assert.equal(isChunkLoadError(null), false);
  assert.equal(isChunkLoadError(undefined), false);
  assert.equal(isChunkLoadError({ message: 'ChunkLoadError' }), false);
});

test('recarga una sola vez por error de trozo', () => {
  const chunk = new Error('ChunkLoadError: Loading chunk 7 failed.');
  assert.equal(shouldReloadForChunk(chunk, false), true);
  assert.equal(shouldReloadForChunk(chunk, true), false);
  assert.equal(shouldReloadForChunk(new Error('otra cosa'), false), false);
});
