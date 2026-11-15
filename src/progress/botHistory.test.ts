import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { GameRecord } from './progressStore';
import { botHistory, historyNote } from './botHistory';

const game = (botId: string, result: 'win' | 'loss' | 'draw', practiceCourseId?: string): GameRecord => ({
  botId,
  userColor: 'w',
  result,
  reason: 'Jaque mate',
  moves: ['e2e4'],
  playedAt: '2026-11-15T10:00:00.000Z',
  practiceCourseId,
});

test('sin dos partidas no hay historial', () => {
  assert.equal(botHistory([], 'pipo'), null);
  assert.equal(botHistory([game('pipo', 'win')], 'pipo'), null);
  assert.equal(botHistory([game('pipo', 'win'), game('pipo', 'loss', 'london')], 'pipo'), null);
});

test('cuenta ganadas, perdidas y tablas sin la práctica', () => {
  const games = [game('pipo', 'win'), game('pipo', 'loss', 'london'), game('pipo', 'draw'), game('lola', 'win'), game('pipo', 'win')];
  const h = botHistory(games, 'pipo');
  assert.ok(h);
  assert.deepEqual({ wins: h.wins, losses: h.losses, draws: h.draws, total: h.total }, { wins: 2, losses: 0, draws: 1, total: 3 });
  assert.deepEqual(h.last4, ['win', 'draw', 'win']);
});

test('las últimas 4 van de la más reciente a la más vieja y se cortan', () => {
  const results: ('win' | 'loss')[] = ['loss', 'win', 'win', 'loss', 'win', 'win'];
  const games = results.map((r) => game('pipo', r));
  const h = botHistory(games, 'pipo');
  assert.ok(h);
  assert.deepEqual(h.last4, ['loss', 'win', 'win', 'loss']);
});

test('la nota cuenta las últimas si ganaste 3 o más', () => {
  const h = botHistory([game('pipo', 'win'), game('pipo', 'win'), game('pipo', 'loss'), game('pipo', 'win')], 'pipo');
  assert.ok(h);
  assert.deepEqual(historyNote(h), { kind: 'wonLast', wins: 3, total: 4 });
});

test('la nota avisa de las tablas o invita a revisar', () => {
  const draws = botHistory([game('pipo', 'draw'), game('pipo', 'draw')], 'pipo');
  assert.ok(draws);
  assert.deepEqual(historyNote(draws), { kind: 'draws', draws: 2 });
  const mixed = botHistory([game('pipo', 'loss'), game('pipo', 'win'), game('pipo', 'loss')], 'pipo');
  assert.ok(mixed);
  assert.deepEqual(historyNote(mixed), { kind: 'review' });
});
