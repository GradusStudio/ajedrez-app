import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pluralCategory } from './plural';

test('español, inglés, alemán e italiano: solo el 1 es singular', () => {
  for (const l of ['es', 'en', 'de', 'it'] as const) {
    assert.equal(pluralCategory(l, 1), 'one');
    assert.equal(pluralCategory(l, 0), 'other');
    assert.equal(pluralCategory(l, 2), 'other');
  }
});
test('francés: 0 y 1 son singular', () => {
  assert.equal(pluralCategory('fr', 0), 'one');
  assert.equal(pluralCategory('fr', 1), 'one');
  assert.equal(pluralCategory('fr', 2), 'other');
});
