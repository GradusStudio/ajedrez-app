import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { GameMove, ReviewPly } from '../../review/types';
import { reviewView } from './reviewView';

const move = (san: string, uci: string, color: 'w' | 'b', fenBefore = 'a b c d e 1', fenAfter = 'a b c d e 1'): GameMove => ({ san, uci, color, fenBefore, fenAfter });
const ply = (san: string, uci: string, color: 'w' | 'b', over: Partial<ReviewPly> = {}): ReviewPly => ({
  ply: 1,
  move: move(san, uci, color),
  quality: 'best',
  loss: 0,
  cpLoss: 0,
  great: false,
  highlight: false,
  scoreAfter: 20,
  bestUci: 'e2e4',
  bestSan: 'e4',
  replyUci: '',
  replySan: '',
  facts: {},
  ...over,
});

const base = {
  fen: 'start',
  plies: [ply('e4', 'e2e4', 'w'), ply('e5', 'e7e5', 'b')],
  scores: [0, 20, -10],
  idx: 0,
  lastVar: null,
  preview: null,
  branch: null,
  me: 'w' as const,
  showBest: false,
};

test('en la posición inicial no hay jugada ni dueño', () => {
  const v = reviewView(base);
  assert.equal(v.ply, undefined);
  assert.equal(v.shownFen, 'start');
  assert.equal(v.lastMove, null);
  assert.equal(v.mine, false);
  assert.equal(v.badge, null);
  assert.deepEqual(v.colorArrows, []);
  assert.equal(v.score, 0);
});

test('una jugada de la partida trae posición, última jugada, dueño y evaluación', () => {
  const v = reviewView({ ...base, idx: 2, fen: 'b' });
  assert.equal(v.ply?.move.san, 'e5');
  assert.equal(v.shownFen, 'b');
  assert.deepEqual(v.lastMove, { from: 'e7', to: 'e5' });
  assert.equal(v.mine, false);
  assert.equal(v.pendingOwn, false);
  assert.equal(v.score, -10);
});

test('sin bando, ninguna jugada es del usuario', () => {
  const v = reviewView({ ...base, idx: 1, me: null });
  assert.equal(v.mine, false);
});

test('una variante propia sin calificar queda pendiente y usa su posición', () => {
  const varMove = { move: move('Qh5', 'd1h5', 'w', 'pre', 'post'), rated: null };
  const v = reviewView({ ...base, lastVar: varMove, fen: 'post', branch: { from: 0, moves: [varMove] } });
  assert.equal(v.pendingOwn, true);
  assert.equal(v.ply, undefined);
  assert.equal(v.shownFen, 'post');
  assert.deepEqual(v.lastMove, { from: 'd1', to: 'h5' });
  assert.equal(v.mine, true);
  assert.equal(v.score, 0);
});

test('una jugada mala marca la insignia y la flecha roja; con la mejor, también la verde', () => {
  const bad = ply('Nf6', 'g8f6', 'b', { quality: 'blunder', replyUci: 'd1f7' });
  const v = reviewView({ ...base, plies: [bad], idx: 1, showBest: true });
  assert.equal(v.bad, true);
  assert.equal(v.badge?.label, '??');
  assert.deepEqual(v.colorArrows.map((a) => a.move), ['d1f7', 'e2e4']);
});

test('la línea del motor enseña el paso y no las flechas', () => {
  const v = reviewView({ ...base, preview: { baseFen: 'base', moves: [{ fenAfter: 'p1', uci: 'a1a2' }, { fenAfter: 'p2', uci: 'b1b2' }], step: 2 } });
  assert.equal(v.shownFen, 'p2');
  assert.deepEqual(v.lastMove, { from: 'b1', to: 'b2' });
  assert.deepEqual(v.colorArrows, []);
});
