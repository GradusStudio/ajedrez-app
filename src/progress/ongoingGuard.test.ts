import test from 'node:test';
import assert from 'node:assert/strict';
import { ownsOngoing, shouldSaveOngoing } from './ongoingGuard';
import type { OngoingGame } from './progressStore';

const game = (startedAt: string): OngoingGame => ({ botId: 'b', userColor: 'w', moves: [], startedAt });
const mine = { startedAt: 'A' };

test('primer guardado de una partida nueva: no hay nada guardado y no guardé antes', () => {
  assert.equal(shouldSaveOngoing(undefined, mine, false), true);
});

test('la partida guardada es la mía: se sigue guardando (también al retomarla)', () => {
  assert.equal(shouldSaveOngoing(game('A'), mine, true), true);
  assert.equal(shouldSaveOngoing(game('A'), mine, false), true);
});

test('la guardada es otra (otro dispositivo o otra partida): no se pisa', () => {
  assert.equal(shouldSaveOngoing(game('B'), mine, true), false);
  assert.equal(shouldSaveOngoing(game('B'), mine, false), false);
});

test('ya guardé y ahora no hay nada (terminada o abandonada en otro lado): no se resucita', () => {
  assert.equal(shouldSaveOngoing(undefined, mine, true), false);
});

test('sin identidad propia nunca se guarda', () => {
  assert.equal(shouldSaveOngoing(undefined, null, false), false);
  assert.equal(shouldSaveOngoing(game('A'), null, false), false);
});

test('ownsOngoing: solo si la guardada tiene mi fecha de inicio', () => {
  assert.equal(ownsOngoing(game('A'), mine), true);
  assert.equal(ownsOngoing(game('B'), mine), false);
  assert.equal(ownsOngoing(undefined, mine), false);
  assert.equal(ownsOngoing(game('A'), null), false);
});
