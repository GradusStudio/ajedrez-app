import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cleanPgnHeader, MAX_PGN_CHARS, parseGame } from './pgn';

test('lee una partida normal y devuelve las jugadas con su posición', () => {
  const game = parseGame('1. e4 e5 2. Qh5 Nc6 3. Bc4 Nf6 4. Qxf7# 1-0');
  assert.ok(game);
  assert.equal(game.white, '');
  assert.equal(game.moves.length, 7);
  assert.equal(game.moves[0].san, 'e4');
  assert.equal(game.moves[6].san, 'Qxf7#');
});

test('un PGN enorme se rechaza antes de cargarlo', () => {
  const big = `1. e4 e5 2. Nf3 { ${'x'.repeat(MAX_PGN_CHARS)} }`;
  assert.equal(big.length > MAX_PGN_CHARS, true);
  assert.equal(parseGame(big), null);
});

test('un texto que no es una partida devuelve null', () => {
  assert.equal(parseGame(''), null);
  assert.equal(parseGame('hola'), null);
  assert.equal(parseGame('1. e4 e4'), null);
});

test('las cabeceras se recortan y se limpian antes de mostrarlas', () => {
  const long = 'A'.repeat(500);
  const game = parseGame(`[White "${long}"]\n[Black "B"]\n[Result "1-0"]\n\n1. e4 e5 1-0`);
  assert.ok(game);
  assert.equal(game.white.length, 80);
  assert.equal(game.black, 'B');
  assert.equal(game.result, '1-0');
  assert.equal(cleanPgnHeader('A\u0000B'), 'A B');
  assert.equal(cleanPgnHeader(undefined), '');
});
