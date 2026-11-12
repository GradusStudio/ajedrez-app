import test from 'node:test';
import assert from 'node:assert/strict';
import { botGamePgn, pgnResult } from './botGame';
import { parseGame } from './pgn';

const MOVES = ['e2e4', 'c7c5', 'g1f3', 'd7d6'];

test('PGN de una partida contra un bot jugando con blancas', () => {
  const game = parseGame(botGamePgn({ moves: MOVES, userColor: 'w', userName: 'Tú', botName: 'Valentina', kind: 'win' }));
  assert.ok(game);
  assert.equal(game.white, 'Tú');
  assert.equal(game.black, 'Valentina');
  assert.equal(game.result, '1-0');
  assert.deepEqual(
    game.moves.map((m) => m.uci),
    MOVES
  );
});

test('PGN de una partida contra un bot jugando con negras', () => {
  const game = parseGame(botGamePgn({ moves: MOVES, userColor: 'b', userName: 'Tú', botName: 'Valentina', kind: 'loss' }));
  assert.ok(game);
  assert.equal(game.white, 'Valentina');
  assert.equal(game.black, 'Tú');
  assert.equal(game.result, '1-0');
  assert.deepEqual(
    game.moves.map((m) => m.uci),
    MOVES
  );
});

test('el resultado del PGN sale del color y del resultado del usuario', () => {
  assert.equal(pgnResult('w', 'win'), '1-0');
  assert.equal(pgnResult('w', 'loss'), '0-1');
  assert.equal(pgnResult('b', 'win'), '0-1');
  assert.equal(pgnResult('b', 'loss'), '1-0');
  assert.equal(pgnResult('w', 'draw'), '1/2-1/2');
  assert.equal(pgnResult('b', 'draw'), '1/2-1/2');
});

test('conserva las coronaciones', () => {
  const moves = ['a2a4', 'b7b5', 'a4b5', 'a7a6', 'b5a6', 'b8c6', 'a6a7', 'c6b8', 'a7b8q'];
  const game = parseGame(botGamePgn({ moves, userColor: 'w', userName: 'Tú', botName: 'Pipo', kind: 'win' }));
  assert.ok(game);
  assert.equal(game.moves.at(-1)?.uci, 'a7b8q');
});
