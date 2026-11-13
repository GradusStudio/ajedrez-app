import test from 'node:test';
import assert from 'node:assert/strict';
import { isWideWidth, wideContentWidth } from './wideLayout';

test('el contenido descuenta la barra lateral de íconos', () => {
  assert.equal(wideContentWidth(960), 884);
  assert.equal(wideContentWidth(1199), 1123);
});

test('el contenido descuenta la barra lateral con etiquetas', () => {
  assert.equal(wideContentWidth(1200), 968);
  assert.equal(wideContentWidth(1440), 1208);
});

test('isWideWidth: el umbral es 960', () => {
  assert.equal(isWideWidth(959), false);
  assert.equal(isWideWidth(960), true);
});
