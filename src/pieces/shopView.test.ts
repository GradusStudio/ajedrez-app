import assert from 'node:assert/strict';
import { test } from 'node:test';
import { canAffordSomethingNew, previewAction, previewCombo, shopItems, type ShopContext } from './shopView';

const base: ShopContext = {
  coins: 0,
  boughtBoards: [],
  boughtSets: [],
  boardInUse: 'verde',
  setInUse: 'clasico',
};

test('tableros: los gratis van primero y cada uno muestra su estado', () => {
  const items = shopItems('board', base);
  const firstPriced = items.findIndex((i) => i.price > 0);
  assert.ok(items.slice(0, firstPriced).every((i) => i.price === 0));
  assert.ok(items.slice(firstPriced).every((i) => i.price > 0));
  assert.deepEqual(items.find((i) => i.id === 'verde')?.state, { kind: 'inUse' });
  assert.deepEqual(items.find((i) => i.id === 'marron')?.state, { kind: 'free' });
  assert.deepEqual(items.find((i) => i.id === 'madera')?.state, { kind: 'short', missing: 200 });
});

test('sets: gratis, tuyo y en uso se distinguen', () => {
  const ctx = { ...base, boughtSets: ['madera'] };
  const items = shopItems('set', ctx);
  assert.deepEqual(items.find((i) => i.id === 'clasico')?.state, { kind: 'inUse' });
  assert.deepEqual(items.find((i) => i.id === 'madera')?.state, { kind: 'owned' });
  assert.deepEqual(items.find((i) => i.id === 'hielo')?.state, { kind: 'short', missing: 200 });
});

test('con saldo justo el ítem es comprable', () => {
  const items = shopItems('board', { ...base, coins: 200 });
  assert.deepEqual(items.find((i) => i.id === 'madera')?.state, { kind: 'affordable' });
});

test('un tablero de pago que no se tiene nunca aparece en uso', () => {
  const items = shopItems('board', { ...base, boardInUse: 'madera', coins: 0 });
  assert.deepEqual(items.find((i) => i.id === 'madera')?.state, { kind: 'short', missing: 200 });
});

test('previewCombo combina lo elegido con lo que ya se usa del otro tipo', () => {
  assert.deepEqual(previewCombo('board', 'madera', base), { board: 'madera', set: 'clasico' });
  assert.deepEqual(previewCombo('set', 'hielo', base), { board: 'verde', set: 'hielo' });
  assert.deepEqual(previewCombo('board', null, base), { board: 'verde', set: 'clasico' });
  assert.deepEqual(previewCombo('board', 'inventado', base), { board: 'verde', set: 'clasico' });
});

test('previewAction: nada en uso, usar lo propio, comprar o lo que falta', () => {
  assert.equal(previewAction('board', null, base), null);
  assert.equal(previewAction('board', 'verde', base), null);
  assert.deepEqual(previewAction('board', 'marron', base), { type: 'use' });
  assert.deepEqual(previewAction('board', 'madera', { ...base, coins: 250 }), { type: 'buy', price: 200, left: 50 });
  assert.deepEqual(previewAction('board', 'madera', { ...base, coins: 45 }), { type: 'short', missing: 155 });
  assert.deepEqual(previewAction('board', 'madera', { ...base, coins: 200 }), { type: 'buy', price: 200, left: 0 });
});

test('canAffordSomethingNew: solo cuenta algo nuevo que pueda pagar', () => {
  assert.equal(canAffordSomethingNew(base), false);
  assert.equal(canAffordSomethingNew({ ...base, coins: 200 }), true);
  assert.equal(
    canAffordSomethingNew({
      ...base,
      coins: 200,
      boughtBoards: ['madera', 'marmol', 'hielo', 'magma'],
      boughtSets: ['madera', 'marmol', 'hielo', 'magma'],
    }),
    false
  );
});
