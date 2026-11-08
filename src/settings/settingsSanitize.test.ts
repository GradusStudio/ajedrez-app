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

test('tema con clave heredada del prototipo vuelve al verde', () => {
  for (const t of ['constructor', 'toString', '__proto__', 'hasOwnProperty']) {
    assert.equal(sanitizeSettings({ boardTheme: t as never }).boardTheme, 'verde', t);
  }
});
test('la hora del recordatorio fuera de 0-23 o no entera vuelve a la de por defecto', () => {
  for (const h of [-1, 24, 25, 7.5, NaN, Infinity, '7', null, undefined, {}]) {
    assert.equal(sanitizeSettings({ reminder: { enabled: true, hour: h as never } }).reminder.hour, 19, String(h));
  }
});
test('conserva una hora válida', () => {
  assert.equal(sanitizeSettings({ reminder: { enabled: true, hour: 0 } }).reminder.hour, 0);
  assert.equal(sanitizeSettings({ reminder: { enabled: true, hour: 23 } }).reminder.hour, 23);
});
test('los booleanos que no son booleanos vuelven al valor por defecto', () => {
  const s = sanitizeSettings({
    sound: 'no' as never,
    vibration: 0 as never,
    reminderOffered: 'si' as never,
    installOffered: 1 as never,
    reminder: { enabled: 'x' as never, hour: 10 },
  });
  assert.equal(s.sound, true);
  assert.equal(s.vibration, true);
  assert.equal(s.reminderOffered, false);
  assert.equal(s.installOffered, false);
  assert.equal(s.reminder.enabled, false);
});
test('un valor guardado que no es objeto (null, número, texto) da los ajustes por defecto', () => {
  for (const raw of [null, 5, 'x', true, [1, 2]]) {
    assert.deepEqual(sanitizeSettings(raw as never), sanitizeSettings({}), String(raw));
  }
});
test('un recordatorio guardado que no es objeto usa el de por defecto', () => {
  assert.deepEqual(sanitizeSettings({ reminder: 'x' as never }).reminder, { enabled: false, hour: 19 });
  assert.deepEqual(sanitizeSettings({ reminder: null as never }).reminder, { enabled: false, hour: 19 });
});
