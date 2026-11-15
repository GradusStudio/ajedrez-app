import assert from 'node:assert/strict';
import { test } from 'node:test';
import { localizedContent } from '../data/localized';
import { estimateTextWidth, fitWheelLabel, MIN_WHEEL_FONT, WHEEL_TEXT_WIDTH } from './wheelLabel';

const LANGS = ['es', 'en', 'de', 'it', 'fr'] as const;
const inWidth = (fit: { lines: string[]; size: number }) => fit.lines.every((l) => estimateTextWidth(l, fit.size) <= WHEEL_TEXT_WIDTH);

test('todos los nombres de unidad de los cinco idiomas entran en el gajo', () => {
  for (const lang of LANGS) {
    for (const unit of localizedContent(lang).units) {
      const fit = fitWheelLabel(unit.title, 15.5);
      assert.ok(fit.size >= MIN_WHEEL_FONT, `${lang} ${unit.title}: ${fit.size}`);
      assert.ok(fit.lines.length >= 1 && fit.lines.length <= 2, `${lang} ${unit.title}: ${fit.lines.length} líneas`);
      assert.ok(inWidth(fit), `${lang} ${unit.title}: ${fit.lines.join(' / ')} a ${fit.size}`);
    }
  }
});

test('los nombres cortos de Aperturas entran en un renglón', () => {
  for (const lang of LANGS) {
    for (const course of localizedContent(lang).openings) {
      const fit = fitWheelLabel(course.short, 20, 1);
      assert.equal(fit.lines.length, 1, `${lang} ${course.short}`);
      assert.ok(fit.size >= MIN_WHEEL_FONT);
      assert.ok(inWidth(fit), `${lang} ${course.short} a ${fit.size}`);
    }
  }
});

test('parte por palabras en dos renglones y achica lo justo', () => {
  const fit = fitWheelLabel('Endspiele für Fortgeschrittene', 15.5);
  assert.deepEqual(fit.lines, ['Endspiele für', 'Fortgeschrittene']);
  assert.ok(fit.size < 15.5 && fit.size >= MIN_WHEEL_FONT);
  const one = fitWheelLabel('Taktik-Grundlagen', 15.5);
  assert.equal(one.lines.length, 1);
  assert.ok(one.size < 15.5);
});

test('un nombre imposible se queda en una línea al tamaño mínimo', () => {
  assert.deepEqual(fitWheelLabel('Supercalifragilisticoespialidoso', 20, 1), {
    lines: ['Supercalifragilisticoespialidoso'],
    size: MIN_WHEEL_FONT,
  });
  assert.deepEqual(fitWheelLabel('   ', 15), { lines: [], size: 15 });
});

test('el ancho estimado crece con el tamaño y suma los espacios', () => {
  assert.equal(estimateTextWidth('', 15), 0);
  assert.ok(estimateTextWidth('ab', 20) > estimateTextWidth('ab', 12));
  assert.ok(estimateTextWidth('a b', 15) > estimateTextWidth('ab', 15));
});
