import assert from 'node:assert/strict';
import { test } from 'node:test';
import { firstSteps, firstStepsDone, type FirstStepsProgress } from './firstSteps';

const empty: FirstStepsProgress = { lessons: {}, puzzles: {}, games: [] };

test('cuenta nueva: el primer paso es la lección y los otros dos esperan', () => {
  assert.deepEqual(firstSteps(empty), [
    { id: 'lesson', state: 'next' },
    { id: 'puzzle', state: 'later' },
    { id: 'game', state: 'later' },
  ]);
  assert.equal(firstStepsDone(firstSteps(empty)), false);
});

test('con la lección hecha, el siguiente es el puzzle', () => {
  const steps = firstSteps({ ...empty, lessons: { 'u1-l01': {} } });
  assert.deepEqual(steps, [
    { id: 'lesson', state: 'done' },
    { id: 'puzzle', state: 'next' },
    { id: 'game', state: 'later' },
  ]);
});

test('un puzzle fallado no cuenta como resuelto', () => {
  const steps = firstSteps({ ...empty, puzzles: { p1: { result: 'failed' } } });
  // El paso que toca sigue siendo la lección (el orden manda); el puzzle queda para después.
  assert.deepEqual(steps, [
    { id: 'lesson', state: 'next' },
    { id: 'puzzle', state: 'later' },
    { id: 'game', state: 'later' },
  ]);
  assert.equal(firstStepsDone(steps), false);
});

test('un puzzle resuelto cuenta aunque se haya fallado otro', () => {
  const steps = firstSteps({ ...empty, puzzles: { p1: { result: 'failed' }, p2: { result: 'solved' } } });
  assert.equal(steps.find((s) => s.id === 'puzzle')?.state, 'done');
});

test('una partida registrada completa el tercer paso', () => {
  const steps = firstSteps({ lessons: { l: {} }, puzzles: { p: { result: 'solved' } }, games: [{}] });
  assert.deepEqual(steps, [
    { id: 'lesson', state: 'done' },
    { id: 'puzzle', state: 'done' },
    { id: 'game', state: 'done' },
  ]);
  assert.equal(firstStepsDone(steps), true);
});

test('los pasos hechos se marcan en cualquier orden', () => {
  const steps = firstSteps({ lessons: {}, puzzles: { p: { result: 'solved' } }, games: [{}] });
  assert.deepEqual(steps, [
    { id: 'lesson', state: 'next' },
    { id: 'puzzle', state: 'done' },
    { id: 'game', state: 'done' },
  ]);
});
