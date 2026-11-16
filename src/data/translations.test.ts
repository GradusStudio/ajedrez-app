import test from 'node:test';
import assert from 'node:assert/strict';
import { AVAILABLE_LANGUAGES } from '../i18n/languages';
import { findProblems } from '../i18n/validate';
import { languageFiles } from './localized';
import { openings } from './openings';

// El español es la referencia: solo se revisan los idiomas traducidos. Sin archivos, no hay nada que recorrer.
for (const language of AVAILABLE_LANGUAGES.filter((l) => l !== 'es')) {
  test(`traducción completa: ${language}`, async () => assert.deepEqual(await findProblems(language), []));
}

// El gajo de la corona necesita un nombre corto en cada idioma, de 11 caracteres como máximo.
for (const language of AVAILABLE_LANGUAGES) {
  test(`nombre corto de aperturas: ${language}`, async () => {
    const files = language === 'es' ? undefined : await languageFiles(language);
    for (const opening of openings) {
      const short = language === 'es' ? opening.short : files?.openings?.[opening.id]?.short;
      assert.equal(typeof short, 'string', `${language} ${opening.id}: falta short`);
      const text = short as string;
      assert.ok(Array.from(text).length > 0, `${language} ${opening.id}: short vacío`);
      assert.ok(Array.from(text).length <= 11, `${language} ${opening.id}: «${text}» tiene más de 11 caracteres`);
    }
  });
}
