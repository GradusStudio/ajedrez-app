import test from 'node:test';
import assert from 'node:assert/strict';
import { bots } from './bots';
import { openings } from './openings';
import { units } from './units';
import { pickPhrase, teacherForCourse, teacherForLesson, teacherIdOrNull } from './teachers';

const groups = [...units, ...openings];
const lessons = groups.flatMap((g) => g.lessons);
const idOfTitle = (title: string) => lessons.find((l) => l.title.startsWith(title))!.id;
const teacherOfTitle = (title: string) => teacherForLesson(idOfTitle(title)).id;

test('cada lección tiene un profesor conocido', () => {
  for (const l of lessons) assert.ok(teacherIdOrNull(l.id), l.id);
});
test('los 10 bots enseñan', () => {
  const ids = new Set(lessons.map((l) => teacherForLesson(l.id).id));
  assert.equal(ids.size, 10);
});
test('asignaciones de ejemplo', () => {
  assert.equal(teacherOfTitle('La horquilla'), 'sofia');
  assert.equal(teacherOfTitle('Casillas débiles y puestos avanzados'), 'bruno');
  assert.equal(teacherOfTitle('Repaso final'), 'ada');
  assert.equal(teacherOfTitle('La captura al paso'), 'tomas');
  assert.equal(teacherOfTitle('La enfilada'), 'sofia');
  assert.equal(teacherOfTitle('Trampas que vas a ver'), 'tomas');
  assert.equal(teacherOfTitle('Mate en escalera'), 'ivo');
  assert.equal(teacherForCourse('caro-kann'), 'bruno');
});
test('los 28 cursos tienen profesor y ninguno es Ada', () => {
  assert.equal(openings.length, 28);
  for (const c of openings) {
    const t = teacherForCourse(c.id);
    assert.ok(t && t !== 'ada', c.id);
    for (const l of c.lessons) assert.equal(teacherForLesson(l.id).id, t, l.id);
  }
});
test('la unidad 5 es toda de Maestro Ivo', () => {
  for (const l of units[4].lessons) assert.equal(teacherForLesson(l.id).id, 'ivo');
});
test('lección desconocida usa a Don Ramiro', () => {
  assert.equal(teacherForLesson('no-existe').id, 'ramiro');
});
test('voces completas y sin exclamaciones', () => {
  for (const b of bots) {
    assert.equal(b.teaching.welcome.length, 3, b.id);
    assert.equal(b.teaching.close.length, 3, b.id);
    assert.ok(b.teaching.reminder.risk.includes('{n}'), b.id);
    assert.ok(b.teaching.reminder.general.length > 0, b.id);
    assert.ok(!JSON.stringify(b.teaching).includes('!'), b.id);
    assert.ok(!JSON.stringify(b.teaching).includes('¡'), b.id);
  }
});
test('el aviso de recuperación nombra puzzle, lección y bot', () => {
  for (const b of bots) {
    const r = b.teaching.reminder.recovery.toLowerCase();
    for (const w of ['puzzle', 'lección', 'bot']) assert.ok(r.includes(w), `${b.id}: ${w}`);
  }
});
test('pickPhrase no repite la anterior', () => {
  assert.equal(pickPhrase(['a', 'b'], 'a', () => 0), 'b');
  assert.equal(pickPhrase(['a', 'b'], 'b', () => 0.99), 'a');
  assert.equal(pickPhrase(['a'], 'a', () => 0), 'a');
  assert.equal(pickPhrase(['a', 'b', 'c'], undefined, () => 0.5), 'b');
});
