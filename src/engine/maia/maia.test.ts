import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { Chess } from 'chess.js';
import { maiaOrder, softmax } from '../../bots/brain';
import { encodeMaia, lc0MoveIndex } from './encode';
import { LC0_CONV_POLICY_MAP, LC0_MOVES } from './lc0Tables';
import { wdlToCentipawns } from './maiaEngine';
import { MAIA_WORKER_JS } from './maiaWorkerSource';

const bit = (bits: number[], plane: number, square: number) =>
  ((bits[2 * plane + (square >= 32 ? 1 : 0)] >>> square % 32) & 1) === 1;
const squareOf = (s: string) => (Number(s[1]) - 1) * 8 + (s.charCodeAt(0) - 97);

test('tablas de Lc0: 1858 jugadas y el mapa de 73x64 salidas', () => {
  assert.equal(LC0_MOVES.length, 1858);
  assert.equal(LC0_CONV_POLICY_MAP.length, 73 * 64);
  const used = LC0_CONV_POLICY_MAP.filter((i) => i >= 0);
  assert.equal(new Set(used).size, 1858);
  // Valores de Lc0 (encoder.cc y tables/policy_map.h).
  assert.deepEqual(LC0_MOVES.slice(0, 4), ['a1b1', 'a1c1', 'a1d1', 'a1e1']);
  assert.equal(LC0_MOVES[1792], 'a7a8q');
  assert.equal(LC0_MOVES[1857], 'h7h8b');
  assert.deepEqual(LC0_CONV_POLICY_MAP.slice(0, 12), [7, 31, 56, 81, 106, 131, 156, 180, 204, 230, 259, 288]);
  assert.deepEqual(LC0_CONV_POLICY_MAP.slice(56, 64), [-1, -1, -1, -1, -1, -1, -1, -1]);
});

test('posición inicial: piezas propias, sin historia anterior y planos auxiliares', () => {
  const { input, legal } = encodeMaia([]);
  assert.equal(legal.length, 20);
  for (const f of 'abcdefgh') assert.ok(bit(input.bits, 0, squareOf(f + '2')), `peón propio en ${f}2`);
  assert.ok(bit(input.bits, 5, squareOf('e1')), 'rey propio en e1');
  assert.ok(bit(input.bits, 6, squareOf('e7')), 'peón rival en e7');
  for (let p = 13; p < 104; p++) assert.equal(input.bits[2 * p] | input.bits[2 * p + 1], 0, `plano ${p} vacío`);
  assert.deepEqual(input.aux, [1, 1, 1, 1, 0, 0, 0, 1]);
  assert.equal(input.moves[legal.indexOf('e2e4')], LC0_MOVES.indexOf('e2e4'));
});

test('con negras, el tablero se ve desde ellas y la posición anterior también entra', () => {
  const { input } = encodeMaia(['e2e4']);
  // Ahora "nuestros" peones son los negros, y quedan en la fila 2 vista desde las negras.
  assert.ok(bit(input.bits, 0, squareOf('e2')));
  // El peón rival de e4 se ve en e5; en la posición anterior (planos 13-25) estaba en e2 → e7.
  assert.ok(bit(input.bits, 6, squareOf('e5')));
  assert.ok(bit(input.bits, 13 + 6, squareOf('e7')));
  assert.equal(input.aux[4], 1, 'mueven las negras');
});

test('enroque = el rey toma su torre; promoción a caballo sin letra; jugadas negras dadas vuelta', () => {
  const find = (fen: string, uci: string) => {
    const m = new Chess(fen).moves({ verbose: true }).find((x) => x.from + x.to + (x.promotion ?? '') === uci);
    assert.ok(m, uci);
    return m;
  };
  const castle = 'r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1';
  assert.equal(lc0MoveIndex(find(castle, 'e8g8')), LC0_MOVES.indexOf('e1h1'));
  assert.equal(lc0MoveIndex(find(castle, 'e8c8')), LC0_MOVES.indexOf('e1a1'));
  assert.equal(lc0MoveIndex(find(castle.replace(' b ', ' w '), 'e1g1')), LC0_MOVES.indexOf('e1h1'));
  const promo = '1r2k3/P7/8/8/8/8/8/4K3 w - - 0 1';
  assert.equal(lc0MoveIndex(find(promo, 'a7a8n')), LC0_MOVES.indexOf('a7a8'));
  assert.equal(lc0MoveIndex(find(promo, 'a7a8q')), LC0_MOVES.indexOf('a7a8q'));
  assert.equal(lc0MoveIndex(find(promo, 'a7b8r')), LC0_MOVES.indexOf('a7b8r'));
  assert.equal(lc0MoveIndex(find('4k3/8/8/8/8/8/p7/4K3 b - - 0 1', 'a2a1b')), LC0_MOVES.indexOf('a7a8b'));
});

test('una posición repetida marca su plano de repetición', () => {
  const { input } = encodeMaia(['g1f3', 'g8f6', 'f3g1', 'f6g8']);
  assert.equal(input.bits[2 * 12], 0xffffffff, 'la actual ya apareció al principio');
  assert.equal(input.bits[2 * (13 + 12)], 0, 'la anterior no se repite');
});

test('maiaOrder: temperatura 0 = de la más probable a la menos; minProb deja afuera las rarísimas', () => {
  const logits = [1, 5, 3, -6];
  assert.deepEqual(maiaOrder(logits, { temperature: 0 }), [1, 2, 0, 3]);
  assert.deepEqual(maiaOrder(logits, { temperature: 0, minProb: 0.01 }), [1, 2, 0]);
  const draws = [0.99, 0.5, 0.01];
  let i = 0;
  const order = maiaOrder(logits, { temperature: 1, minProb: 0.01 }, () => draws[i++ % draws.length]);
  assert.equal(order.length, 3);
  assert.deepEqual([...order].sort(), [0, 1, 2]);
});

test('maiaOrder sortea según las probabilidades de Maia', () => {
  const logits = [Math.log(0.7), Math.log(0.2), Math.log(0.1)];
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const first = [0, 0, 0];
  for (let k = 0; k < 4000; k++) first[maiaOrder(logits, { temperature: 1 }, rnd)[0]]++;
  assert.ok(Math.abs(first[0] / 4000 - 0.7) < 0.03, `${first}`);
  assert.ok(Math.abs(first[2] / 4000 - 0.1) < 0.03, `${first}`);
  const soft = softmax(logits, 2);
  assert.ok(soft[2] > 0.1, 'más temperatura = más parejo');
});

test('wdlToCentipawns: parejo = 0, simétrico y con tope', () => {
  assert.equal(wdlToCentipawns([0.4, 0.2, 0.4]), 0);
  assert.ok(Math.abs(wdlToCentipawns([0.7, 0.1, 0.2]) + wdlToCentipawns([0.2, 0.1, 0.7])) <= 1);
  assert.ok(wdlToCentipawns([0.7, 0.1, 0.2]) > 50 && wdlToCentipawns([0.9, 0.05, 0.05]) > 300);
  assert.equal(wdlToCentipawns([1, 0, 0]), 3000);
});

// Con la red de verdad: los mismos números que Lc0 (calculados con una copia en Python del código de Lc0).
const NET = join(__dirname, 'redes', 'maia-1500.pb.gz');
const REFERENCE = [
  { moves: [], top: { e2e4: 13.1288, d2d4: 12.0853, c2c4: 9.9818, g1f3: 9.8056, e2e3: 9.5461 }, wdl: [0.5, 0.0402, 0.4598] },
  {
    moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'g8f6'],
    top: { f3g5: 12.4137, d2d3: 12.2092, b1c3: 11.913, e1g1: 11.0251, d2d4: 10.6613 },
    wdl: [0.5156, 0.0367, 0.4477],
  },
  {
    moves: ['d2d4', 'g8f6', 'c2c4', 'e7e6', 'b1c3', 'f8b4', 'e2e3', 'e8g8', 'f1d3', 'd7d5', 'g1f3'],
    top: { d5c4: 12.0763, c7c5: 11.4204, b8c6: 11.051, c7c6: 10.3498, f6e4: 10.3377 },
    wdl: [0.4176, 0.0448, 0.5376],
  },
];

test('la red maia-1500 da los mismos números que Lc0', { skip: !existsSync(NET) && 'falta la red: npm run build:maia' }, () => {
  const MAIA = new Function(`${MAIA_WORKER_JS}; return MAIA;`)();
  MAIA.setPolicyMap(LC0_CONV_POLICY_MAP);
  const net = MAIA.loadNet(new Uint8Array(gunzipSync(readFileSync(NET))));
  for (const ref of REFERENCE) {
    const pos = encodeMaia(ref.moves);
    const r = MAIA.evaluate(net, pos.input) as { logits: number[]; wdl: number[] };
    for (const [uci, logit] of Object.entries(ref.top)) {
      assert.ok(Math.abs(r.logits[pos.legal.indexOf(uci)] - logit) < 1e-3, `${uci} tras ${ref.moves.length} jugadas`);
    }
    ref.wdl.forEach((w, i) => assert.ok(Math.abs(r.wdl[i] - w) < 1e-3));
  }
});
