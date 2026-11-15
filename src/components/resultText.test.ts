import assert from 'node:assert/strict';
import test from 'node:test';
import { coinsNoteVisible, resultTitleKey } from './resultText';

test('el título del resultado es el mismo en la capa y en el panel', () => {
  assert.equal(resultTitleKey('win'), 'game.win');
  assert.equal(resultTitleKey('loss'), 'game.loss');
  assert.equal(resultTitleKey('draw'), 'game.draw');
});

test('el aviso de victoria sin monedas solo sale en victorias fuera de la práctica', () => {
  assert.equal(coinsNoteVisible('win', 0, false), true);
  assert.equal(coinsNoteVisible('win', 0, true), false);
  assert.equal(coinsNoteVisible('win', 15, false), false);
  assert.equal(coinsNoteVisible('loss', 0, false), false);
  assert.equal(coinsNoteVisible('draw', 0, false), false);
});
