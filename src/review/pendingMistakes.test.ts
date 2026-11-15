import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pendingMistakes } from './pendingMistakes';
import type { StoredReview } from './store';
import { turningPointKey, type TurningPoint } from './turningPoints';
import type { Review, ReviewPly } from './types';

// Un error mínimo de la revisión: lo que necesitan turningPoints y turningPointKey.
const blunder = (ply: number, color: 'w' | 'b', bestUci: string, fen = `fen${ply}`): ReviewPly =>
  ({
    ply,
    move: { color, san: `Qh${ply}?`, uci: `a1a${ply}`, fenBefore: fen, fenAfter: fen },
    quality: 'blunder',
    loss: 30 - ply,
    cpLoss: 300,
    great: false,
    highlight: false,
    scoreAfter: 0,
    bestUci,
    bestSan: `Qd${ply}`,
    replyUci: '',
    replySan: '',
    facts: {},
  }) as unknown as ReviewPly;

const stored = (id: string, me: 'w' | 'b' | null, plies: ReviewPly[]): StoredReview => ({
  id,
  savedAt: '2026-11-14T10:00:00.000Z',
  me,
  coachId: 'lola',
  review: { plies } as unknown as Review,
});

const keyOf = (review: StoredReview, i: number): string => {
  const tp: TurningPoint = {
    ply: review.review.plies[i].ply,
    fen: review.review.plies[i].move.fenBefore,
    playedSan: review.review.plies[i].move.san,
    quality: 'blunder',
    bestUci: review.review.plies[i].bestUci,
    bestSan: review.review.plies[i].bestSan,
  };
  return turningPointKey(tp);
};

test('junta los puntos de varias revisiones y descuenta los ya practicados', () => {
  const a = stored('a', 'w', [blunder(1, 'w', 'd1d4')]);
  const b = stored('b', 'b', [blunder(2, 'b', 'd8d5'), blunder(4, 'b', 'c8g4')]);
  const all = pendingMistakes([b, a], []);
  assert.ok(all);
  assert.equal(all.points.length, 3);
  assert.equal(all.me, 'b');
  assert.equal(all.coachId, 'lola');
  const done = keyOf(a, 0);
  const rest = pendingMistakes([b, a], [done]);
  assert.ok(rest);
  assert.equal(rest.points.length, 2);
  assert.equal(rest.points[0].ply, 2);
});

test('sin revisiones con bando conocido no hay errores pendientes', () => {
  assert.equal(pendingMistakes([], []), null);
  assert.equal(pendingMistakes([stored('x', null, [blunder(1, 'w', 'd1d4')])], []), null);
});

test('corta en el máximo pedido', () => {
  const many = stored('m', 'w', [blunder(1, 'w', 'a1a2'), blunder(2, 'w', 'a1a3'), blunder(3, 'w', 'a1a4')]);
  const pending = pendingMistakes([many, many], [], 2);
  assert.ok(pending);
  assert.equal(pending.points.length, 2);
});

test('si todas las posiciones están practicadas devuelve null', () => {
  const only = stored('o', 'w', [blunder(1, 'w', 'd1d4')]);
  assert.equal(pendingMistakes([only], [keyOf(only, 0)]), null);
});
