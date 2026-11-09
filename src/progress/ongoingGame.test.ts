import test from 'node:test';
import assert from 'node:assert/strict';
import { replayMoves, uciMoves } from './ongoingGame';

test('replayMoves rearma la posición y uciMoves devuelve las mismas jugadas', () => {
  const moves = ['e2e4', 'e7e5', 'g1f3'];
  const chess = replayMoves(moves);
  assert.ok(chess);
  assert.equal(chess.turn(), 'b');
  assert.deepEqual(uciMoves(chess), moves);
});

test('replayMoves: una jugada ilegal o basura da null', () => {
  assert.equal(replayMoves(['e2e5']), null);
  assert.equal(replayMoves(['e2e4', 'e2e4']), null);
  assert.equal(replayMoves(['xx']), null);
});

test('replayMoves: una partida ya terminada da null; sin jugadas, la inicial', () => {
  assert.equal(replayMoves(['f2f3', 'e7e5', 'g2g4', 'd8h4']), null);
  assert.equal(replayMoves([])?.fen().startsWith('rnbqkbnr/pppppppp'), true);
});

test('replayMoves acepta la coronación', () => {
  const chess = replayMoves(['a2a4', 'b7b5', 'a4b5', 'a7a6', 'b5a6', 'c8b7', 'a6b7', 'b8c6', 'b7a8q']);
  assert.ok(chess);
  assert.equal(uciMoves(chess).at(-1), 'b7a8q');
});
