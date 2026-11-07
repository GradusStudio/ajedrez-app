import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sanitizeSettings } from './sanitize';

test('ajuste viejo', () => {
  const s = sanitizeSettings({ notation: 'es' as never });
  assert.equal(s.notation, 'auto');
  assert.equal(s.language, 'auto');
});
test('conserva la inglesa', () => assert.equal(sanitizeSettings({ notation: 'en' }).notation, 'en'));
test('idioma inválido vuelve a auto', () => assert.equal(sanitizeSettings({ language: 'xx' as never }).language, 'auto'));
test('conserva idioma elegido', () => assert.equal(sanitizeSettings({ language: 'de' }).language, 'de'));
test('tema inválido', () => assert.equal(sanitizeSettings({ boardTheme: 'zzz' as never }).boardTheme, 'verde'));
test('conserva un tema con textura', () => assert.equal(sanitizeSettings({ boardTheme: 'hielo' }).boardTheme, 'hielo'));
test('installOffered empieza en false y se conserva', () => {
  assert.equal(sanitizeSettings({}).installOffered, false);
  assert.equal(sanitizeSettings({ installOffered: true }).installOffered, true);
});
test('ajustes guardados antes de installOffered lo reciben en false', () => {
  const old = { sound: false, reminderOffered: true } as never;
  const s = sanitizeSettings(old);
  assert.equal(s.installOffered, false);
  assert.equal(s.sound, false);
});
