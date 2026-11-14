import assert from 'node:assert/strict';
import { test } from 'node:test';
import { moveBack, moveForward, previousStep, reviewProgress } from './review';

test('previousStep: desde el paso actual retrocede de a uno y se detiene en el primero', () => {
  assert.equal(previousStep(0, null), null);
  assert.equal(previousStep(1, null), 0);
  assert.equal(previousStep(4, null), 3);
});

test('previousStep: en pleno repaso sigue retrocediendo desde el paso que se mira', () => {
  assert.equal(previousStep(4, 3), 2);
  assert.equal(previousStep(4, 1), 0);
  assert.equal(previousStep(4, 0), null);
});

test('reviewProgress: el paso actual sin resolver deja el progreso donde estaba', () => {
  assert.equal(reviewProgress(null, 2, 10, false), 0.2);
  assert.equal(reviewProgress(null, 2, 10, true), 0.3);
});

test('reviewProgress: el paso en repaso cuenta como completado y no suma el del paso actual', () => {
  assert.equal(reviewProgress(1, 2, 10, false), 0.2);
  assert.equal(reviewProgress(1, 2, 10, true), 0.2);
  assert.equal(reviewProgress(0, 9, 10, false), 0.1);
});

test('reviewProgress: una lección sin pasos no divide por cero', () => {
  assert.equal(reviewProgress(null, 0, 0, false), 0);
});

test('moveBack: retrocede de a una y se queda en la primera jugada', () => {
  assert.equal(moveBack(3), 2);
  assert.equal(moveBack(1), 0);
  assert.equal(moveBack(0), 0);
});

test('moveForward: avanza hasta la última jugada y desde ahí pasa a la actual (null)', () => {
  assert.equal(moveForward(1, 4), 2);
  assert.equal(moveForward(3, 4), null);
  assert.equal(moveForward(4, 4), null);
  assert.equal(moveForward(0, 0), null);
});
