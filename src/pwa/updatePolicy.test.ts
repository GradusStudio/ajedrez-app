import test from 'node:test';
import assert from 'node:assert/strict';
import { isInsideActivity } from './updatePolicy';

test('dentro de una lección, un puzzle, una partida, una revisión, el quiz o el análisis libre', () => {
  for (const path of [
    '/leccion/u1-l01',
    '/leccion/u1-l01/',
    '/puzzle',
    '/puzzle/',
    '/partida',
    '/quiz-partida',
    '/revision',
    '/analisis-libre',
  ]) {
    assert.equal(isInsideActivity(path), true, path);
  }
});

test('fuera de una actividad: pestañas, ajustes, resultados de listas y páginas de la web', () => {
  for (const path of ['/', '', '/puzzles', '/bots', '/analisis', '/perfil', '/ajustes', '/instalar', '/privacidad', '/bot/lola', '/apertura/italiana', '/leccionario', '/revisiones']) {
    assert.equal(isInsideActivity(path), false, path);
  }
});
