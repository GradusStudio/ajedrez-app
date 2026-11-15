import assert from 'node:assert/strict';
import { test } from 'node:test';
import { de } from '../i18n/de';
import { en } from '../i18n/en';
import { fr } from '../i18n/fr';
import { it } from '../i18n/it';
import deCoach from '../review/coach/de.json';
import enCoach from '../review/coach/en.json';
import frCoach from '../review/coach/fr.json';
import itCoach from '../review/coach/it.json';
import { localizedContent } from './localized';

// Nombres de los bots por idioma (spec del rediseño de bots, sección 5). El español no cambia y los id tampoco:
// los textos traducidos no pueden quedar con el nombre español de un bot que en ese idioma se llama distinto.

const LANGS = ['en', 'de', 'it', 'fr'] as const;
type Lang = (typeof LANGS)[number];

/** Nombre en español (la referencia). */
const ES: Record<string, string> = {
  pipo: 'Pipo',
  lola: 'Lola',
  tomas: 'Tomás',
  valentina: 'Valentina',
  ramiro: 'Don Ramiro',
  camila: 'Camila',
  bruno: 'Bruno',
  sofia: 'Sofía',
  ivo: 'Maestro Ivo',
  ada: 'Ada',
};

/** Solo los que cambian en cada idioma; el resto conserva el español. */
const NAMES: Record<Lang, Record<string, string>> = {
  en: {
    pipo: 'Pip',
    tomas: 'Tom',
    valentina: 'Val',
    ramiro: 'Professor Raymond',
    camila: 'Camilla',
    sofia: 'Sophie',
    ivo: 'Master Ivo',
  },
  de: { tomas: 'Thomas', ramiro: 'Professor Raimund', camila: 'Camilla', sofia: 'Sophie', ivo: 'Meister Ivo' },
  it: { tomas: 'Tommaso', ramiro: 'Don Raimondo', camila: 'Camilla', sofia: 'Sofia' },
  fr: {
    tomas: 'Thomas',
    valentina: 'Valentine',
    ramiro: 'Professeur Raymond',
    camila: 'Camille',
    sofia: 'Sophie',
    ivo: 'Maître Yves',
  },
};

const CATALOGS: Record<Lang, Record<string, string>> = { en, de, it, fr };
const COACHES: Record<Lang, unknown> = { en: enCoach, de: deCoach, it: itCoach, fr: frCoach };

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

test('cada bot se llama como dice la tabla en los cuatro idiomas', () => {
  for (const lang of LANGS) {
    const byId = new Map(localizedContent(lang).bots.map((b) => [b.id, b.name]));
    for (const [id, spanish] of Object.entries(ES)) {
      assert.equal(byId.get(id), NAMES[lang][id] ?? spanish, `${lang}: ${id}`);
    }
  }
});

test('los ids de los bots son los mismos en los cinco idiomas', () => {
  const reference = localizedContent('es').bots.map((b) => b.id).sort();
  for (const lang of LANGS) {
    assert.deepEqual(localizedContent(lang).bots.map((b) => b.id).sort(), reference, lang);
  }
});

test('ningún texto traducido deja el nombre español de un bot que en ese idioma cambia', () => {
  for (const lang of LANGS) {
    const content = localizedContent(lang);
    const texts = [
      ...strings(CATALOGS[lang]),
      ...strings(content.units),
      ...strings(content.openings),
      ...strings(content.bots),
      ...strings(COACHES[lang]),
    ];
    for (const id of Object.keys(NAMES[lang])) {
      const spanish = ES[id];
      if (!spanish) continue;
      const hits = texts.filter((text) => text.includes(spanish));
      assert.deepEqual(hits.slice(0, 3), [], `${lang}: "${spanish}" quedó en ${hits.length} texto(s): ${hits[0] ?? ''}`);
    }
  }
});
