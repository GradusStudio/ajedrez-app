import test from 'node:test';
import assert from 'node:assert/strict';
import { units } from './units';

const idsOf = (unitNumber: number) => {
  const unit = units.find((u) => u.unit === unitNumber);
  assert.ok(unit, `falta la unidad ${unitNumber}`);
  return unit.lessons.map((l) => l.id);
};

test('la ruta queda en 9 unidades y 75 lecciones', () => {
  assert.deepEqual(units.map((u) => u.unit), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.deepEqual(units.map((u) => u.lessons.length), [12, 6, 10, 7, 7, 9, 9, 7, 8]);
  assert.equal(units.flatMap((u) => u.lessons).length, 75);
});

test('order es consecutivo y unit coincide con su unidad', () => {
  const all = units.flatMap((u) => u.lessons);
  all.forEach((lesson, index) => assert.equal(lesson.order, index + 1, lesson.id));
  for (const unit of units) {
    for (const lesson of unit.lessons) assert.equal(lesson.unit, unit.unit, lesson.id);
  }
});

test('los ids de lección son únicos', () => {
  const ids = units.flatMap((u) => u.lessons.map((l) => l.id));
  assert.equal(new Set(ids).size, ids.length);
});

test('las lecciones movidas quedan en su lugar', () => {
  assert.deepEqual(idsOf(3).slice(-3), ['u3-l07', 'u9-l01', 'u3-l08']);
  assert.equal(idsOf(5).indexOf('u6-l01'), idsOf(5).indexOf('u5-l03') + 1);
  assert.equal(idsOf(6).indexOf('u6-l03'), idsOf(6).indexOf('u7-l07') - 1);
  assert.equal(idsOf(7).at(-1), 'u10-l06');
  assert.equal(idsOf(9).indexOf('u6-l02'), idsOf(9).indexOf('u10-l04') + 1);
  assert.equal(idsOf(9).at(-1), 'u6-l04');
});
