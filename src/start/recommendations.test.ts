import assert from 'node:assert/strict';
import { test } from 'node:test';
import { recommendedBotFor, recommendedBotIndex, recommendedCourseFor, recommendedCourseId } from './recommendations';

const bots = Array.from({ length: 7 }, (_, i) => ({ id: `b${i}` }));
const courses = [{ id: 'italian' }, { id: 'london' }, { id: 'scotch' }];

test('el bot recomendado sigue el nivel y no se sale de la lista', () => {
  assert.equal(recommendedBotIndex('nuevo'), 0);
  assert.equal(recommendedBotIndex('basico'), 2);
  assert.equal(recommendedBotIndex('casual'), 4);
  assert.equal(recommendedBotFor('nuevo', bots)?.id, 'b0');
  assert.equal(recommendedBotFor('basico', bots)?.id, 'b2');
  assert.equal(recommendedBotFor('casual', bots)?.id, 'b4');
  assert.equal(recommendedBotFor('casual', bots.slice(0, 2))?.id, 'b1');
  assert.equal(recommendedBotFor('nuevo', []), undefined);
});

test('el curso recomendado sigue el nivel y cae en el primero si falta', () => {
  assert.equal(recommendedCourseId('nuevo'), 'italian');
  assert.equal(recommendedCourseId('basico'), 'london');
  assert.equal(recommendedCourseId('casual'), 'scotch');
  assert.equal(recommendedCourseFor('nuevo', courses)?.id, 'italian');
  assert.equal(recommendedCourseFor('basico', courses)?.id, 'london');
  assert.equal(recommendedCourseFor('casual', courses)?.id, 'scotch');
  assert.equal(recommendedCourseFor('nuevo', [{ id: 'scotch' }])?.id, 'scotch');
  assert.equal(recommendedCourseFor('nuevo', []), undefined);
});
