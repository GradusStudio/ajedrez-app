import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findReview, isStoredReview, MAX_REVIEWS, reviewId, trimReviews, type StoredReview } from './store';
import type { Review } from './types';

const stored = (id: string, savedAt = '2026-11-14T10:00:00.000Z'): StoredReview => ({
  id,
  savedAt,
  me: 'w',
  coachId: 'lola',
  review: { plies: [] } as unknown as Review,
});

test('el id de una partida importada es estable y distinto por PGN', () => {
  const a = reviewId('1. e4 e5 2. Cf3');
  assert.equal(a, reviewId('1. e4 e5 2. Cf3'));
  assert.notEqual(a, reviewId('1. d4 d5 2. c4'));
  assert.match(a, /^pgn:[a-z0-9]+$/);
});

test('trimReviews pone la nueva al frente y descarta la del mismo id', () => {
  let list: StoredReview[] = [];
  for (let i = 0; i < 5; i++) list = trimReviews(list, stored(`b${i}`));
  assert.deepEqual(list.map((r) => r.id), ['b4', 'b3', 'b2', 'b1', 'b0']);
  const again = trimReviews(list, stored('b2'));
  assert.deepEqual(again.map((r) => r.id), ['b2', 'b4', 'b3', 'b1', 'b0']);
  assert.equal(again.length, 5);
});

test('trimReviews corta en 10 y conserva las más recientes', () => {
  let list: StoredReview[] = [];
  for (let i = 0; i < 14; i++) list = trimReviews(list, stored(`r${i}`));
  assert.equal(list.length, MAX_REVIEWS);
  assert.equal(list[0].id, 'r13');
  assert.equal(list[list.length - 1].id, 'r4');
});

test('un dato roto del almacenamiento se descarta', () => {
  assert.equal(isStoredReview(stored('x')), true);
  for (const bad of [null, 5, 'x', {}, { id: 'x' }, { ...stored('x'), me: 'z' }, { ...stored('x'), review: { plies: 'no' } }]) {
    assert.equal(isStoredReview(bad), false, JSON.stringify(bad));
  }
  assert.equal(isStoredReview({ ...stored('x'), me: null }), true);
});

test('findReview encuentra la revisión por el id de la partida o por el del PGN', () => {
  const byBot = stored('bot:abc');
  const byPgn = stored('pgn:xyz');
  assert.equal(findReview([byBot, byPgn], 'bot:abc')?.id, 'bot:abc');
  assert.equal(findReview([byBot, byPgn], 'bot:nope', 'pgn:xyz')?.id, 'pgn:xyz');
  assert.equal(findReview([byBot, byPgn], 'bot:nope'), undefined);
  assert.equal(findReview([], 'bot:abc'), undefined);
});
