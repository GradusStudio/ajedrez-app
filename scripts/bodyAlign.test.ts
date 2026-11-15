import test from 'node:test';
import assert from 'node:assert/strict';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { figureRows, bootStats, alignOffset, composeBox } = require('./bodyAlign.js') as {
  figureRows: (alpha: Uint8Array, w: number, h: number, threshold?: number) => { yMin: number; yMax: number };
  bootStats: (alpha: Uint8Array, w: number, h: number, fraction?: number) => { x: number; yMin: number; yMax: number };
  alignOffset: (pose: { x: number; yMax: number }, neutral: { x: number; yMax: number }) => { dx: number; dy: number };
  composeBox: (
    w: number,
    h: number,
    dx: number,
    dy: number,
  ) => { extractLeft: number; extractTop: number; extractWidth: number; extractHeight: number; left: number; top: number };
};

function figure(): Uint8Array {
  const w = 100;
  const h = 100;
  const a = new Uint8Array(w * h);
  for (let y = 10; y <= 20; y++) for (let x = 45; x <= 55; x++) a[y * w + x] = 255;
  for (let y = 80; y <= 89; y++) for (let x = 20; x <= 40; x++) a[y * w + x] = 255;
  return a;
}

test('figureRows encuentra la primera y la última fila de la figura', () => {
  assert.deepEqual(figureRows(figure(), 100, 100), { yMin: 10, yMax: 89 });
});

test('bootStats usa el centro de la franja de botas, no la caja entera', () => {
  const s = bootStats(figure(), 100, 100, 0.06);
  assert.equal(s.x, 30);
  assert.equal(s.yMax, 89);
  const cajaEntera = (20 + 55) / 2;
  assert.notEqual(s.x, cajaEntera);
});

test('bootStats devuelve el centro si la figura está vacía', () => {
  const s = bootStats(new Uint8Array(100 * 100), 100, 100);
  assert.equal(s.x, 50);
  assert.equal(s.yMin, 0);
  assert.equal(s.yMax, 99);
});

test('alignOffset mueve la pose a las botas y los pies del neutro', () => {
  assert.deepEqual(alignOffset({ x: 30, yMax: 89 }, { x: 50, yMax: 99 }), { dx: 20, dy: 10 });
  assert.deepEqual(alignOffset({ x: 60, yMax: 80 }, { x: 55, yMax: 84 }), { dx: -5, dy: 4 });
});

test('composeBox recorta cuando el desplazamiento es negativo', () => {
  assert.deepEqual(composeBox(100, 100, -20, -10), {
    extractLeft: 20,
    extractTop: 10,
    extractWidth: 80,
    extractHeight: 90,
    left: 0,
    top: 0,
  });
  assert.deepEqual(composeBox(100, 100, 20, 10), {
    extractLeft: 0,
    extractTop: 0,
    extractWidth: 100,
    extractHeight: 100,
    left: 20,
    top: 10,
  });
});
