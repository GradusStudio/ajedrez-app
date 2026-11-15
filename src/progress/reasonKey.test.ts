import assert from 'node:assert/strict';
import { test } from 'node:test';
import { es } from '../i18n/es';
import { reasonKey } from './reasonKey';

test('los motivos guardados se traducen por su clave', () => {
  const keys = ['checkmate', 'stalemate', 'insufficient', 'threefold', 'fifty', 'resigned', 'agreed', 'abandoned'] as const;
  for (const k of keys) {
    const text = es[`game.reason.${k}`];
    assert.equal(reasonKey(text), `game.reason.${k}`, text);
  }
});

test('un motivo desconocido no tiene clave', () => {
  assert.equal(reasonKey('Jaque mate en 4'), null);
  assert.equal(reasonKey(''), null);
});
