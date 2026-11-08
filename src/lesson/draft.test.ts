import assert from 'node:assert/strict';
import { test } from 'node:test';
import { usableDraft } from './draft';

const d = (stepIndex: number) => ({ stepIndex, errors: 1, mistakes: ['a'] });

test('un borrador con índice dentro de los pasos se conserva', () => {
  assert.deepEqual(usableDraft(d(0), 5), d(0));
  assert.deepEqual(usableDraft(d(4), 5), d(4));
});
test('índice negativo, fraccionario, NaN o fuera de rango: no hay borrador', () => {
  for (const i of [-1, 1.5, NaN, Infinity, 5, 99]) assert.equal(usableDraft(d(i), 5), undefined, String(i));
});
test('sin borrador o con otra forma: no hay borrador', () => {
  assert.equal(usableDraft(undefined, 5), undefined);
  assert.equal(usableDraft(null as never, 5), undefined);
  assert.equal(usableDraft({ stepIndex: '2' } as never, 5), undefined);
});
