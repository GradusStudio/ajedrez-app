import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Chess } from 'chess.js';
import { analyzeLine } from './lines';

// El FEN de un puzzle de Lichess es la posición ANTES de la jugada del rival y moves[0] es esa jugada.
function fromPuzzle(fen: string, moves: string[]) {
  const g = new Chess(fen);
  g.move({ from: moves[0].slice(0, 2), to: moves[0].slice(2, 4), promotion: moves[0].slice(4, 5) || undefined });
  return { fen: g.fen(), pv: moves.slice(1) };
}

// Puzzle fXWxU
const FXWXU = { fen: '8/5p2/2k1p3/1p1r2p1/1P5p/2K1BR2/5P2/8 b - - 2 50', moves: ['d5f5', 'f3f5', 'e6f5', 'e3g5'] };
// Puzzle XRAot
const XRAOT = { fen: '4Q3/4n1pk/5p1p/3pq3/8/6NP/5PPK/8 b - - 8 34', moves: ['e7f5', 'e8e5', 'f6e5', 'g3f5'] };

test('fXWxU: Txf5 exf5 Axg5 elimina al defensor y gana un peon', () => {
  const { fen, pv } = fromPuzzle(FXWXU.fen, FXWXU.moves);
  const r = analyzeLine(fen, pv);
  assert.ok(r);
  assert.deepEqual(r.sans, ['Rxf5', 'exf5', 'Bxg5']);
  assert.equal(r.material, 1);
  assert.deepEqual(r.removeDefender, { capturer: 'r', removed: 'r', removedSq: 'f5', target: 'p', targetSq: 'g5' });
  // Verificacion independiente con chess.js: la torre defendia g5 y tras exf5 ya no.
  const g = new Chess(fen);
  assert.ok(g.attackers('g5', 'b').includes('f5'));
  assert.equal(g.attackers('g5', 'b').length, 1);
  g.move('Rxf5');
  g.move('exf5');
  assert.equal(g.attackers('g5', 'b').length, 0);
});

test('XRAot: Dxe5 fxe5 Cxf5 elimina al defensor y gana un caballo', () => {
  const { fen, pv } = fromPuzzle(XRAOT.fen, XRAOT.moves);
  const r = analyzeLine(fen, pv);
  assert.ok(r);
  assert.equal(r.material, 3);
  assert.deepEqual(r.removeDefender, { capturer: 'q', removed: 'q', removedSq: 'e5', target: 'n', targetSq: 'f5' });
  const g = new Chess(fen);
  assert.ok(g.attackers('f5', 'b').includes('e5'));
  assert.equal(g.attackers('f5', 'b').length, 1);
  g.move('Qxe5');
  g.move('fxe5');
  assert.equal(g.attackers('f5', 'b').length, 0);
});

test('cambio igual por igual sin objetivo: sin removeDefender y material 0', () => {
  // La torre de d5 no defiende ninguna pieza (el peon de c6 no esta en su fila ni columna).
  const r = analyzeLine('4k3/8/2p5/3r4/8/8/8/3RK3 w - - 0 1', ['d1d5', 'c6d5', 'e1e2']);
  assert.ok(r);
  assert.equal(r.material, 0);
  assert.equal(r.removeDefender, undefined);
});

test('la 3.a jugada no captura el objetivo: sin removeDefender', () => {
  const { fen, pv } = fromPuzzle(FXWXU.fen, FXWXU.moves);
  const r = analyzeLine(fen, ['f3f5', 'e6f5', 'e3d4']);
  assert.ok(r);
  assert.equal(r.sans.length, 3);
  assert.equal(r.removeDefender, undefined);
  assert.ok(analyzeLine(fen, pv)?.removeDefender);
});

test('la 2.a jugada mueve el objetivo: sin removeDefender', () => {
  const { fen } = fromPuzzle(FXWXU.fen, FXWXU.moves);
  // g5g4 aleja al peon; Ag5 ya no captura nada.
  const r = analyzeLine(fen, ['f3f5', 'g5g4', 'e3g5']);
  assert.ok(r);
  assert.equal(r.sans.length, 3);
  assert.equal(r.removeDefender, undefined);
});

test('variante de fXWxU cortada tras exf5: sin removeDefender y material 0', () => {
  const { fen } = fromPuzzle(FXWXU.fen, FXWXU.moves);
  const r = analyzeLine(fen, ['f3f5', 'e6f5']);
  assert.ok(r);
  assert.equal(r.material, 0);
  assert.equal(r.removeDefender, undefined);
});

test('captura final gratis: Dxd5 de un peon defendido por un peon no se cuenta', () => {
  const r = analyzeLine('4k3/8/2p5/3p4/8/8/8/3QK3 w - - 0 1', ['d1d5']);
  assert.ok(r);
  assert.deepEqual(r.sans, ['Qxd5']);
  assert.equal(r.material, 0);
});

// Espejo vertical con colores cambiados.
const mirrorSq = (s: string) => s[0] + String(9 - Number(s[1]));
const mirrorUci = (u: string) => mirrorSq(u.slice(0, 2)) + mirrorSq(u.slice(2, 4)) + u.slice(4);
function mirrorFen(fen: string): string {
  const [board, turn] = fen.split(' ');
  const swap = (c: string) => (c >= 'a' && c <= 'z' ? c.toUpperCase() : c >= 'A' && c <= 'Z' ? c.toLowerCase() : c);
  const rows = board.split('/').reverse().map((r) => r.split('').map(swap).join(''));
  return `${rows.join('/')} ${turn === 'w' ? 'b' : 'w'} - - 0 1`;
}

test('bando negro: el espejo de fXWxU da el mismo material y el removeDefender espejado', () => {
  const { fen, pv } = fromPuzzle(FXWXU.fen, FXWXU.moves);
  const mFen = mirrorFen(fen);
  assert.equal(new Chess(mFen).turn(), 'b');
  const r = analyzeLine(mFen, pv.map(mirrorUci));
  assert.ok(r);
  assert.equal(r.sans.length, 3);
  assert.equal(r.material, 1);
  assert.deepEqual(r.removeDefender, { capturer: 'r', removed: 'r', removedSq: mirrorSq('f5'), target: 'p', targetSq: mirrorSq('g5') });
});

test('pv vacia o primera jugada ilegal devuelven null', () => {
  const { fen } = fromPuzzle(FXWXU.fen, FXWXU.moves);
  assert.equal(analyzeLine(fen, []), null);
  assert.equal(analyzeLine(fen, ['a1a8']), null);
  assert.equal(analyzeLine('basura', ['e2e4']), null);
});

test('una jugada posterior ilegal trunca al prefijo legal', () => {
  const { fen } = fromPuzzle(FXWXU.fen, FXWXU.moves);
  const r = analyzeLine(fen, ['f3f5', 'e6f5', 'a1a8', 'e3g5']);
  assert.ok(r);
  assert.deepEqual(r.sans, ['Rxf5', 'exf5']);
});

test('coronacion, enroque y al paso no lanzan ni dan falsos positivos', () => {
  const promo = analyzeLine('7k/4P3/8/8/8/8/8/4K3 w - - 0 1', ['e7e8q']);
  assert.ok(promo);
  assert.deepEqual(promo.sans, ['e8=Q+']);
  assert.equal(promo.removeDefender, undefined);
  const castle = analyzeLine('4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1', ['e1g1', 'e8d8', 'f1f8']);
  assert.ok(castle);
  assert.equal(castle.sans[0], 'O-O');
  assert.equal(castle.removeDefender, undefined);
  const ep = analyzeLine('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1', ['e5d6', 'e8d7', 'e1e2']);
  assert.ok(ep);
  assert.equal(ep.material, 1);
  assert.equal(ep.removeDefender, undefined);
});
