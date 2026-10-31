import test from 'node:test';
import assert from 'node:assert/strict';
import { AVAILABLE_LANGUAGES } from '../i18n/languages';
import { findProblems } from '../i18n/validate';

// El español es la referencia: solo se revisan los idiomas traducidos. Sin archivos, no hay nada que recorrer.
for (const language of AVAILABLE_LANGUAGES.filter((l) => l !== 'es')) {
  test(`traducción completa: ${language}`, () => assert.deepEqual(findProblems(language), []));
}
