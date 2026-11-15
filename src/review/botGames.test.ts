import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { GameRecord } from '../progress/progressStore';
import { botGamePgn, botGameResult, botGameReviewId } from './botGames';
import { parseGame } from './pgn';

const record = (over: Partial<GameRecord> = {}): GameRecord => ({
  botId: 'pipo',
  userColor: 'w',
  result: 'win',
  reason: 'Jaque mate',
  moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6'],
  playedAt: '2026-11-14T10:30:00.000Z',
  ...over,
});

test('el PGN de una partida de bot se puede volver a leer con los mismos SAN', () => {
  const pgn = botGamePgn(record(), 'Pipo', 'Tú');
  const parsed = parseGame(pgn);
  assert.ok(parsed);
  assert.equal(parsed.white, 'Tú');
  assert.equal(parsed.black, 'Pipo');
  assert.equal(parsed.result, '1-0');
  assert.deepEqual(parsed.moves.map((m) => m.san), ['e4', 'e5', 'Nf3', 'Nc6']);
});

test('ganar con negras da 0-1 y tablas da 1/2-1/2', () => {
  const black = botGamePgn(record({ userColor: 'b', result: 'win' }), 'Pipo', 'Tú');
  const parsedBlack = parseGame(black);
  assert.ok(parsedBlack);
  assert.equal(parsedBlack.white, 'Pipo');
  assert.equal(parsedBlack.black, 'Tú');
  assert.equal(parsedBlack.result, '0-1');
  assert.equal(botGameResult(record({ userColor: 'b', result: 'loss' })), '1-0');
  assert.equal(botGameResult(record({ result: 'draw' })), '1/2-1/2');
});

test('una jugada rota corta el PGN sin lanzar', () => {
  const pgn = botGamePgn(record({ moves: ['e2e4', 'zzzz', 'e7e5'] }), 'Pipo', 'Tú');
  const parsed = parseGame(pgn);
  assert.ok(parsed);
  assert.equal(parsed.moves.length, 1);
});

test('el id de la revisión sale del playedAt', () => {
  assert.equal(botGameReviewId(record()), 'bot:2026-11-14T10:30:00.000Z');
});
