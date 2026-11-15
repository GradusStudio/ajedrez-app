import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hasUsableStructure } from './structure';

// Datos que llegan de fuera (archivo importado, sincronización, almacenamiento): un campo nuevo con la forma
// equivocada se descarta antes de migrar, en vez de romper la pantalla después.

const base = {
  version: 4,
  deviceId: 'x',
  resetAt: null,
  lessons: {},
  streak: { current: 0, best: 0, lastActiveDate: null },
};

test('los temas de un puzzle son una lista corta de textos (o faltan)', () => {
  const puzzle = (extra: Record<string, unknown>) => ({ ...base, puzzles: { p1: { result: 'clean', at: 'x', ...extra } } });
  assert.equal(hasUsableStructure(puzzle({})), true);
  assert.equal(hasUsableStructure(puzzle({ themes: ['mate', 'fork'] })), true);
  assert.equal(hasUsableStructure(puzzle({ themes: 5 })), false);
  assert.equal(hasUsableStructure(puzzle({ themes: [1, 2] })), false);
  assert.equal(hasUsableStructure(puzzle({ themes: Array.from({ length: 51 }, () => 'x') })), false);
});

test('el historial del nivel es una lista de puntos válidos (o falta)', () => {
  const rating = (extra: Record<string, unknown>) => ({
    ...base,
    puzzleRating: { rating: 1400, rated: 1, at: null, pending: [], ...extra },
  });
  assert.equal(hasUsableStructure(rating({})), true);
  assert.equal(hasUsableStructure(rating({ history: [{ at: '2026-11-15T00:00:00.000Z', rating: 1400 }] })), true);
  assert.equal(hasUsableStructure(rating({ history: {} })), false);
  assert.equal(hasUsableStructure(rating({ history: 'x' })), false);
  assert.equal(hasUsableStructure(rating({ history: [{ at: 5, rating: 1400 }] })), false);
  assert.equal(hasUsableStructure(rating({ history: [{ at: 'x', rating: 'alta' }] })), false);
  assert.equal(hasUsableStructure(rating({ history: Array.from({ length: 61 }, () => ({ at: 'x', rating: 1 })) })), false);
});
