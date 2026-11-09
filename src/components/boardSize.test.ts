import test from 'node:test';
import assert from 'node:assert/strict';
import { boardPixels, wideBoardPixels } from './boardSize';

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

// Pantalla ancha (docs/superpowers/specs/2026-11-08-web-pantalla-ancha-design.md): tablero a la izquierda y panel a la derecha.
test('ancho: 1440 × 900 con 230 px reservados por alto da 664 (lo limita el alto)', () => {
  assert.equal(wideBoardPixels({ width: 1440, height: 900, reserveHeight: 230 }), 664);
});
test('ancho: con mucho alto no pasa de 720', () => {
  assert.equal(wideBoardPixels({ width: 2560, height: 1440, reserveHeight: 200 }), 720);
});
test('ancho: en una ventana justa manda el ancho (deja 380 de panel y los márgenes)', () => {
  // 960 - 380 (panel) - 32 (separación) - 48 (márgenes) = 500 -> 496
  assert.equal(wideBoardPixels({ width: 960, height: 1200, reserveHeight: 200 }), 496);
});
test('ancho: siempre múltiplo de 8 y nunca menos de 320', () => {
  for (let h = 300; h <= 1400; h += 7) {
    const px = wideBoardPixels({ width: 1280, height: h, reserveHeight: 230 });
    assert.equal(px % 8, 0, `alto ${h}`);
    assert.ok(px >= 320 && px <= 720, `alto ${h}`);
  }
});
