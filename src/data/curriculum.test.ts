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

test('la secuencia completa de lecciones es la acordada', () => {
  assert.deepEqual(units.flatMap((u) => u.lessons.map((l) => l.id)), [
    'u1-l01', 'u1-l02', 'u1-l03', 'u1-l04', 'u1-l05', 'u1-l06', 'u1-l07', 'u1-l08', 'u1-l09', 'u1-l10', 'u1-l11', 'u1-l12',
    'u2-l01', 'u2-l02', 'u2-l04', 'u2-l05', 'u2-l03', 'u2-l06',
    'u3-l01', 'u3-l02', 'u3-l09', 'u3-l03', 'u3-l04', 'u3-l05', 'u3-l06', 'u3-l07', 'u9-l01', 'u3-l08',
    'u4-l01', 'u4-l02', 'u4-l07', 'u4-l03', 'u4-l04', 'u4-l05', 'u4-l06',
    'u5-l06', 'u5-l01', 'u5-l02', 'u5-l03', 'u6-l01', 'u5-l04', 'u5-l05',
    'u7-l01', 'u7-l02', 'u7-l03', 'u7-l04', 'u7-l05', 'u7-l06', 'u6-l03', 'u7-l07', 'u7-l08',
    'u8-l01', 'u8-l02', 'u8-l03', 'u8-l04', 'u8-l05', 'u8-l06', 'u8-l07', 'u8-l08', 'u10-l06',
    'u9-l02', 'u9-l03', 'u9-l04', 'u9-l05', 'u9-l06', 'u9-l07', 'u9-l08',
    'u10-l01', 'u10-l02', 'u10-l03', 'u10-l04', 'u6-l02', 'u10-l05', 'u10-l07', 'u6-l04',
  ]);
});

test('las lecciones movidas quedan en su lugar', () => {
  assert.deepEqual(idsOf(3).slice(-3), ['u3-l07', 'u9-l01', 'u3-l08']);
  assert.equal(idsOf(5).indexOf('u6-l01'), idsOf(5).indexOf('u5-l03') + 1);
  assert.equal(idsOf(6).indexOf('u6-l03'), idsOf(6).indexOf('u7-l07') - 1);
  assert.equal(idsOf(7).at(-1), 'u10-l06');
  assert.equal(idsOf(9).indexOf('u6-l02'), idsOf(9).indexOf('u10-l04') + 1);
  assert.equal(idsOf(9).at(-1), 'u6-l04');
});
