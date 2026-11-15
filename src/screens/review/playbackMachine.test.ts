import assert from 'node:assert/strict';
import { test } from 'node:test';
import { nextAction, type NextState } from './playbackMachine';

const base: NextState = { preview: false, branch: false, fast: false, ffTarget: null, idx: 0, n: 10, filter: 'highlights', nextHighlight: undefined };

test('la línea y la variante se cierran antes que nada', () => {
  assert.deepEqual(nextAction({ ...base, preview: true }), { type: 'stopPreview' });
  assert.deepEqual(nextAction({ ...base, branch: true, preview: true }), { type: 'stopPreview' });
  assert.deepEqual(nextAction({ ...base, branch: true }), { type: 'leaveBranch' });
});

test('durante la cámara rápida salta al destino', () => {
  assert.deepEqual(nextAction({ ...base, fast: true, ffTarget: 4 }), { type: 'goTo', target: 4 });
});

test('al final termina; sin destacadas pendientes también', () => {
  assert.deepEqual(nextAction({ ...base, idx: 10 }), { type: 'finish' });
  assert.deepEqual(nextAction({ ...base, idx: 3, nextHighlight: undefined }), { type: 'finish' });
});

test('con «Todas» avanza una jugada y se corta en el final', () => {
  assert.deepEqual(nextAction({ ...base, filter: 'all', idx: 3 }), { type: 'goTo', target: 4 });
  assert.deepEqual(nextAction({ ...base, filter: 'all', idx: 9 }), { type: 'goTo', target: 10 });
});

test('con destacadas salta a la próxima o hace cámara rápida si está lejos', () => {
  assert.deepEqual(nextAction({ ...base, idx: 2, nextHighlight: 2 }), { type: 'goTo', target: 3 });
  assert.deepEqual(nextAction({ ...base, idx: 2, nextHighlight: 6 }), { type: 'fastForward', target: 7 });
  assert.deepEqual(nextAction({ ...base, idx: 7, nextHighlight: undefined }), { type: 'finish' });
});
