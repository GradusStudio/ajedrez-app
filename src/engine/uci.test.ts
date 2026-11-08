import assert from 'node:assert/strict';
import { test } from 'node:test';
import { positionCommand } from './uci';

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

test('una posición normal arma el comando position fen', () => {
  assert.equal(positionCommand(START), `position fen ${START}`);
  assert.equal(positionCommand('8/8/8/8/8/8/8/K6k w - - 0 1'), 'position fen 8/8/8/8/8/8/8/K6k w - - 0 1');
});
test('un FEN con saltos de línea o caracteres de control no llega al motor', () => {
  for (const f of [`${START}\nquit`, `${START}\r\nsetoption name Threads value 99`, `${START}\u0000`, `${START} go infinite`, `${START}; quit`, '']) {
    assert.throws(() => positionCommand(f), /FEN/, JSON.stringify(f));
  }
  assert.throws(() => positionCommand(5 as never), /FEN/);
});
