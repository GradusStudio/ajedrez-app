import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findReview, isStoredReview, MAX_REVIEWS, reviewId, trimReviews, type StoredReview } from './store';
import type { Review, ReviewPly } from './types';

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const AFTER = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
const move = { san: 'e4', uci: 'e2e4', color: 'w' as const, fenBefore: START, fenAfter: AFTER };
const ply: ReviewPly = {
  ply: 1,
  move,
  quality: 'best',
  loss: 0,
  cpLoss: 0,
  great: false,
  highlight: true,
  scoreAfter: 20,
  bestUci: 'e2e4',
  bestSan: 'e4',
  replyUci: 'e7e5',
  replySan: 'e5',
  facts: {},
};
const game = { white: 'Tú', black: 'Pipo', result: '1-0', startFen: START, moves: [move] };
const review = (over: Partial<Review> = {}): Review => ({
  game,
  scores: [0, 20],
  plies: [ply],
  highlights: [0],
  accuracy: { w: 90, b: 80 },
  ...over,
});
const stored = (id: string, savedAt = '2026-11-14T10:00:00.000Z', value: Review = review()): StoredReview => ({
  id,
  savedAt,
  me: 'w',
  coachId: 'lola',
  review: value,
});

test('el id de una partida importada es estable y distinto por PGN', () => {
  const a = reviewId('1. e4 e5 2. Cf3');
  assert.equal(a, reviewId('1. e4 e5 2. Cf3'));
  assert.notEqual(a, reviewId('1. d4 d5 2. c4'));
  assert.match(a, /^pgn:[a-z0-9]+$/);
});

test('el id no cambia por las cabeceras Event, Site ni Date (la partida en vivo no las trae)', () => {
  const live = '[White "Tú"]\n[Black "Pipo"]\n[Result "1-0"]\n\n1. e4 e5 2. Nf3 1-0';
  const saved = '[Event "Gradus"]\n[Site "Gradus"]\n[Date "2026.11.15"]\n[White "Tú"]\n[Black "Pipo"]\n[Result "1-0"]\n\n1. e4 e5 2. Nf3 1-0';
  assert.equal(reviewId(live), reviewId(saved));
  assert.notEqual(reviewId(live), reviewId(live.replace('1. e4', '1. d4')));
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

test('una revisión completa y válida se acepta', () => {
  assert.equal(isStoredReview(stored('x')), true);
  assert.equal(isStoredReview({ ...stored('x'), me: null }), true);
  // Sin jugadas sigue siendo válida mientras la evaluación tenga la posición inicial.
  assert.equal(isStoredReview(stored('x', undefined, review({ plies: [], scores: [0], highlights: [] }))), true);
});

test('un dato roto del almacenamiento se descarta', () => {
  const noAccuracy = { ...review(), accuracy: undefined } as unknown as Review;
  const shortScores = review({ scores: [0] });
  const badPly = review({ plies: [{ ...ply, move: { ...move, san: undefined } } as unknown as ReviewPly] });
  const badQuality = review({ plies: [{ ...ply, quality: 'rara' } as unknown as ReviewPly] });
  const badHighlights = review({ highlights: [5] });
  const badPv = review({ plies: [{ ...ply, bestPv: 'e2e4' } as unknown as ReviewPly] });
  const badFen = review({ plies: [{ ...ply, move: { ...move, fenBefore: 'no es un fen' } } as unknown as ReviewPly] });
  const badOrder = review({ plies: [{ ...ply, ply: 2 } as unknown as ReviewPly] });
  const badHighlightsOrder = review({ highlights: [1, 0] });
  for (const bad of [
    null,
    5,
    'x',
    {},
    { id: 'x' },
    { ...stored('x'), me: 'z' },
    stored('x', undefined, noAccuracy),
    stored('x', undefined, shortScores),
    stored('x', undefined, badPly),
    stored('x', undefined, badQuality),
    stored('x', undefined, badHighlights),
    stored('x', undefined, badPv),
    stored('x', undefined, badFen),
    stored('x', undefined, badOrder),
    stored('x', undefined, badHighlightsOrder),
    { ...stored('x'), review: { plies: 'no', scores: [] } },
    { ...stored('x'), review: { plies: [], scores: [] } },
  ]) {
    assert.equal(isStoredReview(bad), false, JSON.stringify(bad));
  }
});

test('findReview encuentra la revisión por el id de la partida o por el del PGN', () => {
  const byBot = stored('bot:abc');
  const byPgn = stored('pgn:xyz');
  assert.equal(findReview([byBot, byPgn], 'bot:abc')?.id, 'bot:abc');
  assert.equal(findReview([byBot, byPgn], 'bot:nope', 'pgn:xyz')?.id, 'pgn:xyz');
  assert.equal(findReview([byBot, byPgn], 'bot:nope'), undefined);
  assert.equal(findReview([], 'bot:abc'), undefined);
});
