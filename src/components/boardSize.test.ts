import test from 'node:test';
import assert from 'node:assert/strict';
import { boardPixels } from './boardSize';

test('en un celular el tablero ocupa el ancho menos los márgenes, en múltiplos de 8', () => {
  assert.equal(boardPixels(360), 328);
  assert.equal(boardPixels(393), 360);
});
test('en pantallas anchas no pasa de la columna: 448 px con margen de 16 a cada lado', () => {
  assert.equal(boardPixels(480), 448);
  assert.equal(boardPixels(1440), 448);
});

test('celulares de 412 y 430 px', () => {
  assert.equal(boardPixels(412), 376);
  assert.equal(boardPixels(430), 392);
});
test('siempre múltiplo de 8 y sin pasar de la columna', () => {
  for (let w = 280; w <= 2000; w++) {
    const px = boardPixels(w);
    assert.equal(px % 8, 0, `ancho ${w}`);
    assert.ok(px <= 448 && px > 0, `ancho ${w}`);
  }
});
