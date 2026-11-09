import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { applyRating, currentRating, formatDelta, initialRating, ratingDelta } from './puzzleRating';

test('initialRating sale del nivel de la bienvenida', () => {
  assert.equal(initialRating('nuevo'), 800);
  assert.equal(initialRating('basico'), 1100);
  assert.equal(initialRating('casual'), 1400);
  assert.equal(initialRating(undefined), 1000);
});

test('currentRating usa el guardado y, si no hay, el inicial', () => {
  assert.equal(currentRating({ profile: { level: 'casual' } }), 1400);
  assert.equal(currentRating({ profile: { level: 'casual' }, puzzleRating: { rating: 1234, rated: 3, at: null, pending: [] } }), 1234);
});

test('ratingDelta: Elo con K 40 los primeros 20 y 20 después', () => {
  assert.equal(ratingDelta(1000, 0, 1000, 1), 20);
  assert.equal(ratingDelta(1000, 20, 1000, 0), -10);
  assert.equal(ratingDelta(1500, 5, 1100, 1), 4);
  assert.equal(ratingDelta(1500, 19, 1900, 0), -4);
});

test('applyRating suma uno, pone la fecha y recorta a 400–3000', () => {
  const now = new Date('2026-11-09T12:00:00Z');
  const up = applyRating({ rating: 2995, rated: 30, at: null, pending: [] }, 3300, 1, now);
  assert.equal(up.state.rating, 3000);
  assert.equal(up.delta, 5);
  assert.equal(up.state.rated, 31);
  assert.equal(up.state.at, now.toISOString());
  const down = applyRating({ rating: 405, rated: 30, at: null, pending: ['a'] }, 300, 0, now);
  assert.equal(down.state.rating, 400);
  assert.equal(down.delta, -5);
  assert.deepEqual(down.state.pending, ['a']);
});

test('formatDelta usa + y el signo menos', () => {
  assert.equal(formatDelta(8), '+8');
  assert.equal(formatDelta(-18), '−18');
  assert.equal(formatDelta(0), '0');
});
