import assert from 'node:assert/strict';
import test from 'node:test';
import { CHUNK_RELOAD_WINDOW_MS, isChunkLoadError, shouldReloadForChunk } from './chunkError';

test('reconoce los mensajes de trozo que no carga', () => {
  assert.equal(isChunkLoadError(new Error('ChunkLoadError: Loading chunk 42 failed.')), true);
  assert.equal(isChunkLoadError(new Error('Failed to fetch dynamically imported module: https://graduschess.com/app/entry.js')), true);
  assert.equal(isChunkLoadError(new Error('error loading dynamically imported module')), true);
  assert.equal(isChunkLoadError(new Error('Importing a module script failed.')), true);
  assert.equal(isChunkLoadError('Loading chunk src_screens_Perfil_tsx failed'), true);
});

test('un trozo servido como HTML (404 con la página) se reconoce como error de trozo', () => {
  assert.equal(isChunkLoadError(new SyntaxError("Unexpected token '<'")), true);
  assert.equal(shouldReloadForChunk(new SyntaxError("Unexpected token '<'"), null, 0), true);
});

test('no confunde un error de la pantalla con uno de trozo', () => {
  assert.equal(isChunkLoadError(new Error('Cannot read properties of undefined')), false);
  assert.equal(isChunkLoadError(null), false);
  assert.equal(isChunkLoadError(undefined), false);
  assert.equal(isChunkLoadError({ message: 'ChunkLoadError' }), false);
});

test('recarga una vez por error de trozo y no entra en bucle con el mismo trozo roto', () => {
  const chunk = new Error('ChunkLoadError: Loading chunk 7 failed.');
  const t0 = 1_000_000;
  // Primera vez: no hay marca.
  assert.equal(shouldReloadForChunk(chunk, null, t0), true);
  // La marca se guarda al recargar; el trozo roto vuelve a fallar enseguida y no se recarga otra vez.
  assert.equal(shouldReloadForChunk(chunk, t0, t0 + 1_000), false);
  assert.equal(shouldReloadForChunk(chunk, t0, t0 + CHUNK_RELOAD_WINDOW_MS - 1), false);
  // Pasada la ventana, se permite un intento nuevo (por si la versión publicada ya cambió).
  assert.equal(shouldReloadForChunk(chunk, t0, t0 + CHUNK_RELOAD_WINDOW_MS), true);
  assert.equal(shouldReloadForChunk(chunk, t0, t0 + CHUNK_RELOAD_WINDOW_MS * 2), true);
});

test('una marca en el futuro (reloj atrasado) no provoca recargas', () => {
  const chunk = new Error('Importing a module script failed.');
  assert.equal(shouldReloadForChunk(chunk, 2_000_000, 1_000_000), false);
});

test('nunca recarga por un error que no es de trozo', () => {
  assert.equal(shouldReloadForChunk(new Error('otra cosa'), null, 0), false);
  assert.equal(shouldReloadForChunk(new Error('otra cosa'), 0, CHUNK_RELOAD_WINDOW_MS * 10), false);
});
