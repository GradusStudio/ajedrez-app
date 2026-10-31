import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveLanguage } from './languages';
import { resolveNotation, sanFromEnglish, sanFromSpanish } from '../chess/notation';

test('teléfono admitido', () => assert.equal(resolveLanguage('auto', 'de-AT', ['es', 'en', 'de']), 'de'));
test('no admitido usa inglés', () => assert.equal(resolveLanguage('auto', 'pt-BR', ['es', 'en']), 'en'));
test('sin inglés usa español', () => assert.equal(resolveLanguage('auto', 'pt-BR', ['es']), 'es'));
test('sin idioma del teléfono', () => assert.equal(resolveLanguage('auto', null, ['es']), 'es'));
test('elegido y disponible', () => assert.equal(resolveLanguage('en', 'es', ['es', 'en']), 'en'));
test('elegido pero no disponible', () => assert.equal(resolveLanguage('fr', 'es', ['es', 'en']), 'en'));

test('notación', () => {
  assert.equal(sanFromEnglish('Nf3', 'de'), 'Sf3');
  assert.equal(sanFromEnglish('Bxf7+', 'fr'), 'Fxf7+');
  assert.equal(sanFromEnglish('e8=Q', 'it'), 'e8=D');
  assert.equal(sanFromEnglish('Nf3', 'es'), 'Cf3');
  assert.equal(sanFromEnglish('Nf3', 'en'), 'Nf3');
  assert.equal(sanFromSpanish('Axf7', 'de'), 'Lxf7');
  assert.equal(sanFromSpanish('Rg1', 'en'), 'Kg1');
  assert.equal(sanFromSpanish('e8=D', 'fr'), 'e8=D');
  assert.equal(sanFromSpanish('Cf3', 'es'), 'Cf3');
});

test('resolveNotation', () => {
  assert.equal(resolveNotation('auto', 'de'), 'de');
  assert.equal(resolveNotation('en', 'de'), 'en');
});
