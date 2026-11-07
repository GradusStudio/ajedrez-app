import test from 'node:test';
import assert from 'node:assert/strict';
import { isQuizAnswer, turningPointKey, turningPoints } from './turningPoints';
import type { MoveQuality, Review, ReviewPly } from './types';

const FEN = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';

function ply(n: number, quality: MoveQuality, loss: number, extra: Partial<ReviewPly> = {}): ReviewPly {
  return {
    ply: n,
    move: { san: `m${n}`, uci: 'a2a3', color: n % 2 === 1 ? 'w' : 'b', fenBefore: `${FEN.slice(0, -1)}${n}`, fenAfter: FEN },
    quality,
    loss,
    cpLoss: 0,
    great: false,
    highlight: false,
    scoreAfter: 0,
    bestUci: 'e2e4',
    bestSan: 'e4',
    replyUci: '',
    replySan: '',
    facts: {},
    ...extra,
  };
}

const review = (plies: ReviewPly[]) => ({ plies } as unknown as Review);

test('elige solo errores y errores graves del bando del usuario', () => {
  const r = review([ply(1, 'blunder', 40), ply(2, 'blunder', 50), ply(3, 'inaccuracy', 10), ply(5, 'mistake', 20), ply(7, 'good', 0)]);
  assert.deepEqual(turningPoints(r, 'w').map((t) => t.ply), [1, 5]);
  assert.deepEqual(turningPoints(r, 'b').map((t) => t.ply), [2]);
});

test('se queda con los que más costaron, en el orden de la partida', () => {
  const r = review([ply(1, 'mistake', 15), ply(3, 'blunder', 60), ply(5, 'mistake', 12), ply(7, 'blunder', 35), ply(9, 'mistake', 20)]);
  assert.deepEqual(turningPoints(r, 'w').map((t) => t.ply), [3, 7, 9]);
});

test('descarta jugadas sin mejor jugada guardada o iguales a la jugada hecha', () => {
  const r = review([ply(1, 'blunder', 40, { bestUci: '' }), ply(3, 'blunder', 40, { bestUci: 'a2a3' }), ply(5, 'mistake', 20)]);
  assert.deepEqual(turningPoints(r, 'w').map((t) => t.ply), [5]);
});

test('sin errores no hay puntos de giro', () => {
  assert.deepEqual(turningPoints(review([ply(1, 'best', 0), ply(3, 'inaccuracy', 8)]), 'w'), []);
});

test('la posición es la de antes de la jugada mala', () => {
  const [tp] = turningPoints(review([ply(3, 'blunder', 40)]), 'w');
  assert.equal(tp.fen, `${FEN.slice(0, -1)}3`);
  assert.equal(tp.playedSan, 'm3');
  assert.equal(tp.bestSan, 'e4');
});

test('solo vale la mejor jugada; si corona, también la pieza', () => {
  const [tp] = turningPoints(review([ply(1, 'blunder', 40)]), 'w');
  assert.ok(isQuizAnswer(tp, 'e2e4'));
  assert.ok(!isQuizAnswer(tp, 'd2d4'));
  const promo = { ...tp, bestUci: 'e7e8q' };
  assert.ok(isQuizAnswer(promo, 'e7e8q'));
  assert.ok(!isQuizAnswer(promo, 'e7e8n'));
});

test('la clave ignora los contadores de jugadas del FEN', () => {
  const [a] = turningPoints(review([ply(1, 'blunder', 40)]), 'w');
  const b = { ...a, fen: a.fen.replace(/ \d+ \d+$/, ' 5 30') };
  assert.equal(turningPointKey(a), turningPointKey(b));
  assert.notEqual(turningPointKey(a), turningPointKey({ ...a, bestUci: 'd2d4' }));
});
