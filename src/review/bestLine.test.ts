import assert from 'node:assert/strict';
import test from 'node:test';
import { fullMoves, lineMoves, lineText, moveNumber, movePrefix, plyLabel, uciSquares } from './bestLine';
import type { ReviewPly } from './types';

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

test('moveNumber lee el número del FEN, también con las negras a mover', () => {
  assert.equal(moveNumber(START), 1);
  assert.equal(moveNumber(BLACK_TO_MOVE_7), 7);
  assert.equal(moveNumber('roto'), 1);
  assert.equal(moveNumber('a b c d e 0'), 1);
});

test('movePrefix y plyLabel usan el número del FEN y el separador del color', () => {
  assert.equal(movePrefix({ color: 'w', fenBefore: START }), '1.');
  assert.equal(movePrefix({ color: 'b', fenBefore: BLACK_TO_MOVE_7 }), '7...');
  assert.equal(plyLabel({ san: 'Nf3', color: 'w', fenBefore: START }, (s) => s), '1.Nf3');
  assert.equal(plyLabel({ san: 'Bc5', color: 'b', fenBefore: BLACK_TO_MOVE_7 }, (s) => s.replace('B', 'A')), '7...Ac5');
});

test('fullMoves cuenta desde el FEN inicial y con las negras a mover', () => {
  const p = (color: 'w' | 'b', fenBefore: string) => ({ move: { color, fenBefore } }) as ReviewPly;
  assert.equal(fullMoves([]), 0);
  assert.equal(fullMoves([p('w', START)]), 1);
  assert.equal(fullMoves([p('w', START), p('b', 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1')]), 1);
  assert.equal(fullMoves([p('b', BLACK_TO_MOVE_7)]), 7);
  // Un PGN que empieza en una posición avanzada conserva la numeración de la partida.
  assert.equal(fullMoves([p('b', '8/8/8/8/8/8/8/K6k b - - 0 24')]), 24);
});

test('uciSquares acepta jugadas UCI y rechaza el resto', () => {
  assert.deepEqual(uciSquares('e2e4'), { from: 'e2', to: 'e4' });
  assert.deepEqual(uciSquares('e7e8q'), { from: 'e7', to: 'e8' });
  for (const bad of ['', 'e2', 'e2e4x', 'e2e2', 'z2e4', 'e9e4', null, 42]) assert.equal(uciSquares(bad), null);
});
