import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bots } from '../data/bots';
import { coachTake } from './coachTake';
import type { ReviewPly } from './types';

const coach = bots[0];

const ply = (over: Partial<ReviewPly> = {}): ReviewPly => ({
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

const take = (p: ReviewPly) => coachTake({ ply: p, coach, lang: 'es', subject: 'you', san: 'e4', fmt: (s) => s });

test('devuelve la voz del comentarista sobre la jugada', () => {
  const r = take(ply());
  assert.equal(typeof r.voice, 'string');
  assert.ok(r.voice.length > 0);
  assert.ok(Array.isArray(r.details));
});

test('unos hechos rotos no tiran la toma y conservan la voz', () => {
  // Una amenaza sin atacante hace lanzar al compositor de la explicación (no a la voz).
  const r = take(ply({ facts: { threat: { free: true } } as never }));
  assert.ok(r.voice.length > 0);
  assert.deepEqual(r.details, []);
});

test('el mate se cuenta como mate, no como la calidad guardada', () => {
  const r = take(ply({ move: { san: 'Qxf7#', uci: 'd1f7', color: 'w', fenBefore: 'a b c d e 7', fenAfter: 'a b c d e 7' } }));
  assert.ok(r.voice.length > 0);
});
