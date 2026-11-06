import test from 'node:test';
import assert from 'node:assert/strict';
import type { UciEngine } from '../engine/uci';
import { evaluatePosition, refineCandidates, refineGame, REFINE_DEPTH } from './analyze';
import { parseGame } from './pgn';
import type { ReviewPly } from './types';

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const BLACK_TO_MOVE = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
const MATE = 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3';

function fakeEngine(bestmove: string, lines: { rank: number; score: number; move: string; pv: string[] }[]) {
  return { search: async () => ({ bestmove, lines }) } as unknown as UciEngine;
}

test('evaluatePosition guarda la variante de la primera linea recortada a 8 jugadas', async () => {
  const pv = ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1b5', 'a7a6', 'b5a4', 'g8f6', 'e1g1', 'f8e7'];
  const r = await evaluatePosition(fakeEngine('e2e4', [{ rank: 1, score: 30, move: 'e2e4', pv }]), START);
  assert.deepEqual(r.pv, pv.slice(0, 8));
  assert.equal(r.pv?.length, 8);
});

test('evaluatePosition conserva una variante corta tal cual', async () => {
  const r = await evaluatePosition(fakeEngine('e2e4', [{ rank: 1, score: 30, move: 'e2e4', pv: ['e2e4', 'e7e5'] }]), START);
  assert.deepEqual(r.pv, ['e2e4', 'e7e5']);
});

test('evaluatePosition sin lineas devuelve pv vacia y no falla', async () => {
  const r = await evaluatePosition(fakeEngine('e2e4', []), START);
  assert.deepEqual(r.pv, []);
  assert.equal(r.score, 0);
  assert.equal(r.best, 'e2e4');
});

test('evaluatePosition en posicion terminada no usa el motor y deja best vacio', async () => {
  const engine = {
    search: async () => {
      throw new Error('no debe llamarse');
    },
  } as unknown as UciEngine;
  const r = await evaluatePosition(engine, MATE);
  assert.equal(r.best, '');
  assert.equal(r.score, -10000);
  assert.ok(!r.pv || r.pv.length === 0);
});

test('score y best no cambian: blancas mueven, el puntaje queda igual', async () => {
  const r = await evaluatePosition(fakeEngine('d2d4', [{ rank: 1, score: 45, move: 'd2d4', pv: ['d2d4'] }]), START);
  assert.equal(r.score, 45);
  assert.equal(r.best, 'd2d4');
});

test('score y best no cambian: negras mueven, el puntaje se invierte', async () => {
  const r = await evaluatePosition(fakeEngine('e7e5', [{ rank: 1, score: 45, move: 'e7e5', pv: ['e7e5', 'g1f3'] }]), BLACK_TO_MOVE);
  assert.equal(r.score, -45);
  assert.equal(r.best, 'e7e5');
});

// ---- Re-análisis de las jugadas malas ----
const ply = (quality: ReviewPly['quality'], loss: number) => ({ quality, loss }) as ReviewPly;

test('refineCandidates elige solo jugadas malas, las más costosas primero, y las devuelve en orden de partida', () => {
  const plies = [ply('best', 0), ply('inaccuracy', 6), ply('good', 4), ply('blunder', 40), ply('mistake', 15), ply('inaccuracy', 7)];
  assert.deepEqual(refineCandidates(plies), [1, 3, 4, 5]);
  assert.deepEqual(refineCandidates(plies, 2), [3, 4]);
  assert.deepEqual(refineCandidates([ply('best', 0), ply('good', 3)]), []);
});

const GAME = parseGame('1. e4 e5 2. Qh5 Nc6 3. Bc4 Nf6 4. Qxf7# 1-0')!;

test('refineGame evalúa cada posición una sola vez a más profundidad y devuelve el par de cada jugada', async () => {
  const seen: { fen: string; depth: number }[] = [];
  const engine = {
    search: async (o: { fen: string; depth: number }) => {
      seen.push({ fen: o.fen, depth: o.depth });
      return { bestmove: 'e2e4', lines: [{ rank: 1, score: seen.length * 10, move: 'e2e4', pv: ['e2e4'] }] };
    },
  } as unknown as UciEngine;
  const progress: [number, number][] = [];
  const r = await refineGame(engine, GAME, [2, 3], (d, t) => progress.push([d, t]), () => false);
  // Las jugadas 2 y 3 comparten la posición 3: son 3 posiciones distintas (2, 3 y 4), no 4.
  assert.equal(seen.length, 3);
  assert.ok(seen.every((s) => s.depth === REFINE_DEPTH));
  assert.deepEqual([...r!.keys()], [2, 3]);
  assert.equal(r!.get(2)!.after, r!.get(3)!.before, 'la posición compartida es la misma evaluación');
  assert.deepEqual(progress.at(-1), [3, 3]);
});

test('refineGame corta y devuelve null si se cancela', async () => {
  const engine = { search: async () => ({ bestmove: 'e2e4', lines: [] }) } as unknown as UciEngine;
  let calls = 0;
  const r = await refineGame(engine, GAME, [2, 3], () => {}, () => ++calls > 1);
  assert.equal(r, null);
});
