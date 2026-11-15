import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bots } from '../data/bots';
import { firstSentence, momentDiff, summaryMoments } from './summaryMoments';
import type { Review, ReviewPly } from './types';

const coach = bots[0];
const t = (key: string, values?: Record<string, string | number>) => (values ? `${key}:${JSON.stringify(values)}` : key);
const opts = { language: 'es', fmt: (s: string) => s, decimal: ',', t: t as never };

const ply = (over: Partial<ReviewPly>): ReviewPly => ({
  ply: 1,
  move: { san: 'e4', uci: 'e2e4', color: 'w', fenBefore: 'a b c d e 1', fenAfter: 'a b c d e 1' },
  quality: 'blunder',
  loss: 30,
  cpLoss: 300,
  great: false,
  highlight: true,
  scoreAfter: 200,
  bestUci: 'e2e4',
  bestSan: 'e4',
  replyUci: '',
  replySan: '',
  facts: {},
  ...over,
});

const review = (plies: ReviewPly[], scores: number[] = [0, 200]): Review => ({
  game: { white: 'Tú', black: 'Pipo', result: '1-0', startFen: 'a b c d e 1', moves: [] },
  scores,
  plies,
  highlights: plies.map((_, i) => i),
  accuracy: { w: 90, b: 80 },
});

test('la diferencia va en la perspectiva de quien jugó', () => {
  const black = ply({ ply: 2, move: { san: 'Nf6', uci: 'g8f6', color: 'b', fenBefore: 'a b c d e 1', fenAfter: 'a b c d e 1' } });
  const r = review([black], [0, 0, 200]);
  assert.equal(momentDiff(black, r, ','), '−2,0');
  const good = ply({ quality: 'best', great: true, scoreAfter: 200 });
  assert.equal(momentDiff(good, review([good], [0, 200]), ','), '+2,0');
});

test('el mate se muestra como M, no como peones ni como cero', () => {
  const mate = ply({ move: { san: 'Qxf7#', uci: 'd1f7', color: 'w', fenBefore: 'a b c d e 1', fenAfter: 'a b c d e 1' }, scoreAfter: 10000, ratedBefore: 9999, ratedAfter: 10000 });
  const r = review([mate], [9999, 10000]);
  assert.equal(momentDiff(mate, r, ','), '+M');
  const mateBlack = ply({ ply: 2, move: { san: 'Qxf1#', uci: 'd8f1', color: 'b', fenBefore: 'a b c d e 1', fenAfter: 'a b c d e 1' }, scoreAfter: -10000 });
  assert.equal(momentDiff(mateBlack, review([mateBlack], [0, -10000]), ','), '−M');
  const lost = ply({ scoreAfter: 1200 });
  assert.equal(momentDiff(lost, review([lost], [10000, 1200]), ','), '±M');
  // Una jugada de las negras que permite mate se muestra negativa desde su lado.
  const allows = ply({ ply: 2, move: { san: 'Nf6', uci: 'g8f6', color: 'b', fenBefore: 'a b c d e 1', fenAfter: 'a b c d e 1' }, scoreAfter: 10000 });
  assert.equal(momentDiff(allows, review([allows], [0, 10000]), ','), '−M');
});

test('el par profundo manda sobre la evaluación superficial para la diferencia', () => {
  const p = ply({ ratedBefore: 0, ratedAfter: -300, scoreAfter: 30 });
  assert.equal(momentDiff(p, review([p], [20, 30]), ','), '−3,0');
});

test('la calidad del mate es «Jaque mate» y la etiqueta accesible lleva número y comentario', () => {
  const p = ply({
    move: { san: 'Qxf7#', uci: 'd1f7', color: 'w', fenBefore: 'a b c d e 7', fenAfter: 'a b c d e 7' },
    scoreAfter: 10000,
  });
  const [m] = summaryMoments(review([p], [0, 10000]), 'w', coach, opts);
  assert.equal(m.quality, 'review.cat.mate');
  assert.match(m.aria, /"n":7/);
  assert.match(m.aria, /"text":/);
  assert.equal(m.san, 'Qxf7#');
});

test('con negras a mover la etiqueta usa el número del FEN', () => {
  const p = ply({ ply: 1, move: { san: 'e5', uci: 'e7e5', color: 'b', fenBefore: 'a b c d e 5', fenAfter: 'a b c d e 5' } });
  const [m] = summaryMoments(review([p], [0, 0]), 'b', coach, opts);
  assert.match(m.aria, /"n":5/);
});

test('unos hechos rotos no tiran el resumen', () => {
  const p = ply({ facts: { found: 'roto' } as never });
  const [m] = summaryMoments(review([p], [0, 200]), 'w', coach, opts);
  assert.equal(typeof m.text, 'string');
  assert.ok(m.text.length > 0);
});

test('firstSentence corta en el primer punto', () => {
  assert.equal(firstSentence('Uno. Dos. Tres.'), 'Uno.');
  assert.equal(firstSentence('Sin punto'), 'Sin punto');
});
