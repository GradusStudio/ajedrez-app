import test from 'node:test';
import assert from 'node:assert/strict';
import type { UciEngine } from '../engine/uci';
import { evaluatePosition } from './analyze';

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
