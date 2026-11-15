import assert from 'node:assert/strict';
import { test } from 'node:test';
import { botForOpening, bots } from '../data/bots';
import { localizedContent } from '../data/localized';

// Repertorio de la spec de la ficha del bot: ningún curso puede quedar sin un bot que lo juegue del
// color del curso, o la práctica de esa apertura caería en un bot que no la conoce.
const { openings } = localizedContent('es');

test('todo curso de aperturas tiene un bot que lo juega del color del curso', () => {
  const missing = openings
    .filter((course) => {
      const side = course.color === 'w' ? 'white' : 'black';
      return !bots.some((bot) => bot.repertoire[side].includes(course.id));
    })
    .map((course) => course.id);
  assert.deepEqual(missing, [], `cursos sin bot: ${missing.join(', ')}`);
});

test('botForOpening elige a un bot que tiene el curso en su repertorio', () => {
  for (const course of openings) {
    const bot = botForOpening(course.id);
    const side = course.color === 'w' ? 'white' : 'black';
    assert.ok(bot.repertoire[side].includes(course.id), `${course.id}: ${bot.name} no lo juega`);
  }
});
