import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Chess } from 'chess.js';
import { botForOpening, bots } from '../data/bots';
import { localizedContent } from '../data/localized';
import { courseSummary, lessonGroups, lineFrames, lineNotation, mainLine, practiceBotForOpening, botsForOpening } from './courseView';

const { openings } = localizedContent('es');
const byId = (id: string) => {
  const course = openings.find((o) => o.id === id);
  assert.ok(course, `falta el curso ${id}`);
  return course;
};
const lessonOf = (courseId: string, suffix: string) => {
  const course = byId(courseId);
  const lesson = course.lessons.find((l) => l.id === `${courseId}-${suffix}`);
  assert.ok(lesson, `falta ${courseId}-${suffix}`);
  return lesson;
};

test('la línea principal de los 29 cursos aplica entera y termina en una posición legal', () => {
  for (const course of openings) {
    const line = mainLine(course);
    assert.ok(line, `${course.id} sin línea principal`);
    assert.equal(line.frames.length, line.moves.length + 1, `${course.id}: faltan posiciones`);
    assert.doesNotThrow(() => new Chess(line.frames[line.frames.length - 1].fen), `${course.id}: posición final inválida`);
  }
});

test('la línea principal del Londres es la de la lección l02, de 17 jugadas', () => {
  const course = byId('london');
  const line = mainLine(course);
  assert.ok(line);
  assert.equal(line.moves.length, 17);
  assert.equal(line.moves[16].san, 'O-O');
  assert.equal(line.frames[1].last?.from, 'd2');
  assert.equal(line.frames[1].last?.to, 'd4');
  assert.equal(line.frames[0].last, null);
  const final = new Chess(line.frames[line.frames.length - 1].fen);
  assert.equal(final.get('g1')?.type, 'k');
  assert.equal(final.get('g8')?.type, 'k');
});

test('la notación numera las jugadas desde la posición de partida', () => {
  const step = lessonOf('london', 'l02').steps[0];
  assert.equal(step.type, 'line');
  if (step.type !== 'line') return;
  const tokens = lineNotation(step);
  assert.equal(tokens.length, 17);
  assert.deepEqual(tokens.slice(0, 3), [
    { no: 1, white: true, san: 'd4' },
    { no: 1, white: false, san: 'd5' },
    { no: 2, white: true, san: 'Af4' },
  ]);
  assert.deepEqual(tokens[tokens.length - 1], { no: 9, white: true, san: 'O-O' });
});

test('las posiciones de una línea son una por jugada, con su última jugada', () => {
  const step = lessonOf('london', 'l02').steps[0];
  if (step.type !== 'line') return;
  const frames = lineFrames(step);
  assert.equal(frames.length, 18);
  assert.equal(frames.filter((f) => f.last === null).length, 1);
  assert.deepEqual(frames[3].last, { from: 'c1', to: 'f4' });
});

test('los grupos de los 29 cursos reparten todas las lecciones: idea y línea, guías y repaso', () => {
  for (const course of openings) {
    const groups = lessonGroups(course);
    const [essentials, lines, review] = groups;
    assert.equal(essentials.id, 'essentials');
    assert.equal(lines.id, 'lines');
    assert.equal(review.id, 'review');
    assert.equal(essentials.lessons.length, 2, `${course.id}: lo esencial debería ser l01 y l02`);
    assert.equal(review.lessons.length, 1, `${course.id}: falta el repaso`);
    assert.equal(review.lessons[0].id, `${course.id}-l04`);
    assert.equal(groups.flatMap((g) => g.lessons).length, course.lessons.length, `${course.id}: se perdió una lección`);
    const orders = groups.flatMap((g) => g.lessons.map((l) => l.order));
    assert.deepEqual(orders, [...orders].sort((a, b) => a - b), `${course.id}: el orden se rompió`);
  }
});

test('el resumen del curso da la próxima lección y el total', () => {
  const course = byId('london');
  const none = courseSummary(course, () => false);
  assert.deepEqual({ done: none.done, total: none.total, allDone: none.allDone }, { done: 0, total: 13, allDone: false });
  assert.equal(none.next?.id, 'london-l01');

  const firstTwo = courseSummary(course, (id) => id === 'london-l01' || id === 'london-l02');
  assert.equal(firstTwo.done, 2);
  assert.equal(firstTwo.next?.id, 'london-l05');

  const all = courseSummary(course, () => true);
  assert.equal(all.allDone, true);
  assert.equal(all.next, null);
});

test('cada curso tiene bots que lo juegan y el de práctica es el mismo que usa la partida', () => {
  for (const course of openings) {
    const users = botsForOpening(course.id, bots);
    assert.ok(users.length > 0, `${course.id} sin bots`);
    const elos = users.map((b) => b.elo);
    assert.deepEqual(elos, [...elos].sort((a, b) => a - b), `${course.id}: los bots no están ordenados por nivel`);
    assert.equal(practiceBotForOpening(course.id, bots).id, botForOpening(course.id).id, `${course.id}: bot de práctica distinto`);
  }
});
