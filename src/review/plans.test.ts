import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planFor } from './plans';

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const AFTER_E4 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
const kind = (fen: string, uci: string) => planFor(fen, uci).kind;

test('g1f3 desarrolla el caballo', () => assert.equal(planFor(START, 'g1f3').kind, 'develop'));
test('el negro desarrolla g8f6', () => assert.equal(kind(AFTER_E4, 'g8f6'), 'develop'));
test('e2e4 ocupa el centro', () => assert.equal(planFor(START, 'e2e4').kind, 'center'));
test('d7d5 del negro ocupa el centro', () => assert.equal(kind(AFTER_E4, 'd7d5'), 'center'));
test('a2a3 es un avance de peon', () => assert.equal(planFor(START, 'a2a3').kind, 'pawnAdvance'));
test('torre a columna abierta', () => assert.equal(planFor('4k3/8/8/8/8/8/P7/R3K3 w - - 0 1', 'a1d1').kind, 'rookFile'));
test('torre a columna semiabierta (solo hay un peon rival)', () => {
  assert.equal(kind('4k3/3p4/8/8/8/8/P7/R3K3 w - - 0 1', 'a1d1'), 'rookFile');
});
test('torre a columna con peon propio no es rookFile', () => {
  assert.equal(kind('4k3/8/8/8/8/8/P2P4/R3K3 w - - 0 1', 'a1d1'), 'plain');
});
test('cambio: caballo toma alfil defendido por el peon de e6', () => {
  assert.equal(kind('4k3/8/4p3/3b4/8/2N5/8/4K3 w - - 0 1', 'c3d5'), 'trade');
});
test('caballo toma alfil sin defensa no es cambio (ocupa el centro)', () => {
  assert.equal(kind('4k3/8/8/3b4/8/2N5/8/4K3 w - - 0 1', 'c3d5'), 'center');
});
test('peon toma peon con recaptura es cambio', () => {
  assert.equal(kind('4k3/8/2p5/3p4/4P3/8/8/4K3 w - - 0 1', 'e4d5'), 'trade');
});
test('peon toma peon sin recaptura no es cambio', () => {
  assert.equal(kind('4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1', 'e4d5'), 'plain');
});
test('al paso con recaptura posible es cambio', () => {
  assert.equal(kind('4k3/2p5/8/3pP3/8/8/8/4K3 w - d6 0 1', 'e5d6'), 'trade');
});
test('al paso sin recaptura no es cambio', () => {
  assert.equal(kind('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1', 'e5d6'), 'plain');
});
test('captura desigual (peon toma caballo) no es cambio ni avance', () => {
  assert.equal(kind('4k3/8/8/3n4/4P3/8/8/4K3 w - - 0 1', 'e4d5'), 'plain');
});
test('ruptura de peon: c5 ataca el peon de d6', () => {
  assert.equal(kind('4k3/8/3p4/8/2P5/8/8/4K3 w - - 0 1', 'c4c5'), 'pawnBreak');
});
test('retirada: el alfil ya desarrollado vuelve de c4 a b3', () => {
  assert.equal(kind('4k3/8/8/8/2B5/8/8/4K3 w - - 0 1', 'c4b3'), 'retreat');
});
test('retirada del negro: el caballo vuelve de f6 a g8', () => {
  assert.equal(kind('4k3/8/5n2/8/8/8/8/4K3 b - - 0 1', 'f6g8'), 'retreat');
});
test('rey activo en el final', () => assert.equal(planFor('8/8/4k3/8/8/4K3/8/8 w - - 0 1', 'e3e4').kind, 'kingActive'));
test('el rey no es activo si hay damas', () => {
  assert.equal(kind('3qk3/8/8/8/8/4K3/8/8 w - - 0 1', 'e3e4'), 'plain');
});
test('una jugada sin plan reconocible cae a plain, con pieza y casillas', () => {
  const p = planFor('4k3/8/8/8/8/8/8/R3K3 w - - 0 1', 'a1a2');
  assert.deepEqual([p.kind, p.piece, p.from, p.to], ['plain', 'r', 'a1', 'a2']);
});
test('una jugada ilegal no lanza error y da plain', () => {
  const p = planFor(START, 'e2e5');
  assert.deepEqual([p.kind, p.piece, p.from, p.to], ['plain', 'p', 'e2', 'e5']);
});
test('UCI basura y FEN basura no lanzan error', () => {
  assert.equal(planFor(START, 'zz').kind, 'plain');
  assert.equal(planFor('no es un fen', 'e2e4').kind, 'plain');
  assert.equal(planFor(START, '').kind, 'plain');
});
