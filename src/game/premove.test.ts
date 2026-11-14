import test from 'node:test';
import assert from 'node:assert/strict';
import { Chess } from 'chess.js';
import { canPlayRealMove, clipPremoves, passTurn, planPremoveFen, resolvePremove, resolvePremoveFor, type Premove } from './premove';

const blackToMove = '4k3/8/8/8/8/8/P7/4K3 b - - 0 1';
const whiteToMove = '4k3/8/8/8/8/8/P7/4K3 w - - 0 1';

test('passTurn: cambia el turno y borra el paso al paso', () => {
  assert.equal(passTurn('4k3/8/8/8/8/8/P7/4K3 b - e3 0 1'), '4k3/8/8/8/8/8/P7/4K3 w - - 0 1');
});

test('planPremoveFen: el peón avanza tres veces y queda en a6', () => {
  const premoves: Premove[] = [
    { from: 'a2', to: 'a4' },
    { from: 'a4', to: 'a5' },
    { from: 'a5', to: 'a6' },
  ];
  const fen = planPremoveFen(blackToMove, premoves);
  assert.ok(fen);
  const chess = new Chess(fen);
  assert.equal(chess.turn(), 'w');
  assert.equal(chess.get('a6')?.type, 'p');
  assert.equal(chess.get('a6')?.color, 'w');
});

test('planPremoveFen: la coronación guarda la pieza elegida', () => {
  const fen = planPremoveFen('4k3/P7/8/8/8/8/8/4K3 b - - 0 1', [{ from: 'a7', to: 'a8', promotion: 'n' }]);
  assert.ok(fen);
  const chess = new Chess(fen);
  assert.equal(chess.get('a8')?.type, 'n');
  assert.equal(chess.get('a8')?.color, 'w');
});

test('planPremoveFen: una jugada ilegal devuelve null', () => {
  assert.equal(planPremoveFen(blackToMove, [{ from: 'a2', to: 'a5' }]), null);
});

test('planPremoveFen: sin premoves solo cambia el turno', () => {
  assert.equal(planPremoveFen(blackToMove, []), '4k3/8/8/8/8/8/P7/4K3 w - - 0 1');
});

test('clipPremoves: la cola vacía devuelve una cola vacía', () => {
  assert.deepEqual(clipPremoves(blackToMove, []), []);
});

test('clipPremoves: una cola entera válida se conserva entera', () => {
  const premoves: Premove[] = [
    { from: 'a2', to: 'a4' },
    { from: 'a4', to: 'a5' },
    { from: 'a5', to: 'a6' },
  ];
  assert.deepEqual(clipPremoves(blackToMove, premoves), premoves);
});

test('clipPremoves: si la primera jugada ya no vale, no queda ninguna', () => {
  assert.deepEqual(clipPremoves(blackToMove, [{ from: 'a2', to: 'a5' }]), []);
});

test('clipPremoves: corta en la primera jugada que ya no se puede hacer', () => {
  const premoves: Premove[] = [
    { from: 'b1', to: 'c3' },
    { from: 'b1', to: 'd2' },
    { from: 'd2', to: 'f3' },
  ];
  assert.deepEqual(clipPremoves('4k3/8/8/8/8/8/8/1N2K3 b - - 0 1', premoves), [premoves[0]]);
});

test('resolvePremove: legal en la posición real, ilegal y coronación', () => {
  const real = '4k3/8/8/8/8/8/P7/4K3 w - - 0 1';
  const legal = { from: 'a2', to: 'a4' } as const;
  assert.equal(resolvePremove(real, legal), legal);
  assert.equal(resolvePremove(real, { from: 'a2', to: 'a5' }), null);
  const promo = { from: 'a7', to: 'a8', promotion: 'q' } as const;
  assert.equal(resolvePremove('4k3/P7/8/8/8/8/8/4K3 w - - 0 1', promo), promo);
});

test('resolvePremove: el enroque se prueba en la posición real', () => {
  const castle = { from: 'e1', to: 'g1' } as const;
  assert.equal(resolvePremove('4k3/8/8/8/8/8/8/4K2R w K - 0 1', castle), castle);
});

test('canPlayRealMove: solo con el turno del usuario y la cola vacía', () => {
  const premove = { from: 'a2', to: 'a4' } as const;
  assert.equal(canPlayRealMove(whiteToMove, [], false, 'w'), true);
  assert.equal(canPlayRealMove(whiteToMove, [premove], false, 'w'), false);
  assert.equal(canPlayRealMove(whiteToMove, [], true, 'w'), false);
  assert.equal(canPlayRealMove(blackToMove, [], false, 'w'), false);
});

test('resolvePremoveFor: no ejecuta la premove si el turno no es del usuario', () => {
  const premove = { from: 'a2', to: 'a4' } as const;
  assert.equal(resolvePremoveFor(whiteToMove, premove, 'w'), premove);
  assert.equal(resolvePremoveFor(blackToMove, premove, 'w'), null);
  assert.equal(resolvePremoveFor(whiteToMove, { from: 'a2', to: 'a5' }, 'w'), null);
});
