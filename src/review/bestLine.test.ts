import assert from 'node:assert/strict';
import test from 'node:test';
import { lineMoves, lineText } from './bestLine';

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const BLACK_TO_MOVE_7 = 'rnbqkbnr/ppp3pp/8/3p1p2/3Np3/6P1/PPPPPPBP/RNBQ1RK1 b kq - 0 7';

test('lineMoves reproduce la variante con SAN, color y posición de cada jugada', () => {
  const m = lineMoves(START, ['e2e4', 'e7e5', 'g1f3']);
  assert.deepEqual(m.map((x) => [x.san, x.color]), [['e4', 'w'], ['e5', 'b'], ['Nf3', 'w']]);
  assert.ok(m[0].fenAfter.startsWith('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b'));
});

test('lineMoves corta en max y en la primera jugada ilegal', () => {
  assert.equal(lineMoves(START, ['e2e4', 'e7e5', 'g1f3', 'b8c6'], 3).length, 3);
  assert.deepEqual(lineMoves(START, ['e2e4', 'e7e5', 'a1a1', 'b8c6']).map((x) => x.san), ['e4', 'e5']);
});

test('con menos de 2 jugadas, sin variante o con un FEN roto no hay línea', () => {
  assert.deepEqual(lineMoves(START, ['e2e4']), []);
  assert.deepEqual(lineMoves(START, ['e2e4', 'e2e4']), []);
  assert.deepEqual(lineMoves(START, []), []);
  assert.deepEqual(lineMoves(START, undefined), []);
  assert.deepEqual(lineMoves('no es un fen', ['e2e4', 'e7e5']), []);
});

test('lineText numera las jugadas de las blancas y marca con puntos suspensivos si abren las negras', () => {
  const white = lineMoves(START, ['e2e4', 'e7e5', 'g1f3', 'b8c6']);
  assert.equal(lineText(START, white, (s) => s), '1. e4 e5 2. Nf3 Nc6');
  assert.equal(lineText(START, white, (s) => s.replace('N', 'C')), '1. e4 e5 2. Cf3 Cc6');
  const black = lineMoves(BLACK_TO_MOVE_7, ['f8c5', 'd4b3', 'c5b6']);
  assert.equal(lineText(BLACK_TO_MOVE_7, black, (s) => s), '7... Bc5 8. Nb3 Bb6');
});
