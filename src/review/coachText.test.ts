import assert from 'node:assert/strict';
import test from 'node:test';
import { coachExplanation, coachLang, coachVoice, TEXTS } from './coachText';

const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(',');
const shape = (o: unknown): unknown =>
  typeof o === 'string' ? ph(o) : Array.isArray(o) ? o.map(shape) : Object.fromEntries(Object.entries(o as object).map(([k, v]) => [k, shape(v)]));

test('los cinco idiomas del comentarista tienen la misma forma y los mismos marcadores', () => {
  for (const lang of ['es', 'de', 'it', 'fr'] as const) assert.deepEqual(shape(TEXTS[lang]), shape(TEXTS.en), lang);
});

test('coachLang cubre los cinco idiomas y cae a inglés', () => {
  assert.equal(coachLang('de'), 'de');
  assert.equal(coachLang('fr'), 'fr');
  assert.equal(coachLang('pt'), 'en');
});

test('voz y explicación salen rellenadas en todos los idiomas', () => {
  for (const lang of ['es', 'en', 'de', 'it', 'fr'] as const) {
    const v = coachVoice({ lang, style: 'agresivo', quality: 'blunder', great: false, mate: false, subject: 'you', move: 'Qh5', seed: 1 });
    assert.ok(v.includes('Qh5') && !v.includes('{'), `${lang}: ${v}`);
    const ex = coachExplanation({
      lang, subject: 'you', quality: 'blunder', move: 'Qh5', bestSan: 'Nf3', fmt: (s) => s,
      facts: { did: { kind: 'capture', piece: 'p' }, allows: { kind: 'capture', san: 'Nxh5', piece: 'q', ofMoved: true } },
    });
    assert.ok(ex.length >= 2 && ex.every((l) => !l.includes('{')), `${lang}: ${ex.join(' ')}`);
  }
});
