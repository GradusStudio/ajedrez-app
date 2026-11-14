import { test } from 'node:test';
import assert from 'node:assert/strict';
import { markTipSeen, pendingTips } from './tips';

test('pendingTips deja afuera los vistos y conserva el orden', () => {
  assert.deepEqual(pendingTips([], ['home.next', 'home.streak']), ['home.next', 'home.streak']);
  assert.deepEqual(pendingTips(['home.next'], ['home.next', 'home.streak']), ['home.streak']);
  assert.deepEqual(pendingTips(['home.next', 'home.streak'], ['home.next', 'home.streak']), []);
});

test('markTipSeen agrega una vez y no muta la lista original', () => {
  const seen: string[] = [];
  const one = markTipSeen(seen, 'shop');
  assert.deepEqual(seen, []);
  assert.deepEqual(one, ['shop']);
  assert.deepEqual(markTipSeen(one, 'shop'), ['shop']);
  assert.deepEqual(markTipSeen(one, 'coins.first'), ['shop', 'coins.first']);
});

test('un id desconocido en los vistos no afecta a los pendientes', () => {
  assert.deepEqual(pendingTips(['otro'], ['home.next']), ['home.next']);
});
