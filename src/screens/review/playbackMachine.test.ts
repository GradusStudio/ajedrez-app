import assert from 'node:assert/strict';
import { test } from 'node:test';
import { nextAction, type NextState } from './playbackMachine';

const base: NextState = { preview: false, branch: false, ffTarget: null, idx: 0, n: 10, filter: 'highlights', nextHighlight: undefined };

test('la línea y la variante se cierran antes que nada', () => {
  assert.deepEqual(nextAction({ ...base, preview: true }), { type: 'stopPreview', label: 'review.stopLine' });
  assert.deepEqual(nextAction({ ...base, branch: true, preview: true }), { type: 'stopPreview', label: 'review.stopLine' });
  assert.deepEqual(nextAction({ ...base, branch: true }), { type: 'leaveBranch', label: 'review.leaveBranch' });
});

test('durante la cámara rápida salta al destino', () => {
  assert.deepEqual(nextAction({ ...base, ffTarget: 4, idx: 2 }), { type: 'goTo', target: 4, label: 'review.nextMoment' });
});

test('al final termina; sin destacadas pendientes también', () => {
  assert.deepEqual(nextAction({ ...base, idx: 10 }), { type: 'finish', label: 'review.finish' });
  assert.deepEqual(nextAction({ ...base, idx: 3, nextHighlight: undefined }), { type: 'finish', label: 'review.finish' });
});

test('con «Todas» avanza una jugada y se corta en el final', () => {
  assert.deepEqual(nextAction({ ...base, filter: 'all', idx: 3 }), { type: 'goTo', target: 4, label: 'review.ctrlNext' });
  assert.deepEqual(nextAction({ ...base, filter: 'all', idx: 9 }), { type: 'goTo', target: 10, label: 'review.ctrlNext' });
});

test('con destacadas salta a la próxima o hace cámara rápida si está lejos', () => {
  assert.deepEqual(nextAction({ ...base, idx: 2, nextHighlight: 2 }), { type: 'goTo', target: 3, label: 'review.nextMoment' });
  assert.deepEqual(nextAction({ ...base, idx: 2, nextHighlight: 6 }), { type: 'fastForward', target: 7, label: 'review.nextMoment' });
  assert.deepEqual(nextAction({ ...base, idx: 7, nextHighlight: undefined }), { type: 'finish', label: 'review.finish' });
});
