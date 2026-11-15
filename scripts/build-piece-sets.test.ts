import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BASELINE,
  CENTER_X,
  MAX_WIDTH,
  PIECE_ORDER,
  PX_PER_UNIT,
  TARGET_HEIGHTS,
  fillHoles,
  pathFromSvg,
  placementFor,
  scalePathNumbers,
  splitSheet,
} from './build-piece-sets.logic';

test('las alturas del Clásico mantienen el orden rey > dama ≥ alfil ≥ caballo ≥ torre > peón', () => {
  const order = PIECE_ORDER.map((t) => TARGET_HEIGHTS[t]);
  const [k, q, r, b, n, p] = order;
  assert.ok(k > q);
  assert.ok(q > b);
  assert.ok(b >= n);
  assert.ok(n >= r);
  assert.ok(r > p);
  assert.ok(p > 0);
});

test('cada pieza nueva apoya en la línea de base y se centra', () => {
  const place = placementFor('k', 100, 200);
  assert.equal(place.height, Math.round(TARGET_HEIGHTS.k * PX_PER_UNIT));
  assert.equal(place.top + place.height, BASELINE * PX_PER_UNIT);
  assert.equal(place.left + place.width / 2, CENTER_X * PX_PER_UNIT);
});

test('una pieza ancha se limita al ancho máximo y no se sale del viewBox', () => {
  const place = placementFor('p', 400, 100);
  assert.ok(place.width <= MAX_WIDTH * PX_PER_UNIT);
  assert.ok(place.left >= 0);
  assert.ok(place.left + place.width <= 100 * PX_PER_UNIT);
  assert.ok(place.top >= 0);
  assert.ok(place.top + place.height <= BASELINE * PX_PER_UNIT);
});

test('splitSheet encuentra 2 filas × 6 columnas en orden', () => {
  const W = 62;
  const H = 21;
  const ink = new Uint8Array(W * H);
  const rect = (x0: number, y0: number, x1: number, y1: number) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) ink[y * W + x] = 1;
  };
  for (let c = 0; c < 6; c++) {
    rect(1 + c * 10, 2, 8 + c * 10, 8);
    rect(1 + c * 10, 12, 8 + c * 10, 18);
  }
  const boxes = splitSheet(ink, W, H);
  assert.equal(boxes.white.length, 6);
  assert.equal(boxes.black.length, 6);
  assert.deepEqual(boxes.white[0], { x0: 1, y0: 2, x1: 8, y1: 8 });
  assert.deepEqual(boxes.white[5], { x0: 51, y0: 2, x1: 58, y1: 8 });
  assert.deepEqual(boxes.black[0], { x0: 1, y0: 12, x1: 8, y1: 18 });
  assert.deepEqual(boxes.black[5], { x0: 51, y0: 12, x1: 58, y1: 18 });
});

test('splitSheet falla si la hoja no tiene 2 filas', () => {
  const ink = new Uint8Array(10 * 10);
  assert.throws(() => splitSheet(ink, 10, 10), /2 filas/);
});

test('fillHoles rellena un anillo y deja el exterior en 0', () => {
  const W = 5;
  const H = 5;
  const mask = new Uint8Array(W * H);
  for (const [x, y] of [
    [1, 1], [2, 1], [3, 1],
    [1, 2], [3, 2],
    [1, 3], [2, 3], [3, 3],
  ]) mask[y * W + x] = 1;
  const filled = fillHoles(mask, W, H);
  assert.equal(filled[2 * W + 2], 1, 'el centro se rellena');
  assert.equal(filled[0], 0, 'la esquina exterior no');
  assert.equal(filled[4 * W + 4], 0);
});

test('scalePathNumbers pasa de píxeles del lienzo a unidades del viewBox', () => {
  assert.equal(scalePathNumbers('M10 20 C 30 40 50 60 70 80 Z', 0.1), 'M1 2 C 3 4 5 6 7 8 Z');
  assert.equal(scalePathNumbers('M-5.5 12.34Z', 0.1), 'M-0.55 1.234Z');
});

test('pathFromSvg extrae el d del svg de potrace', () => {
  assert.equal(pathFromSvg('<svg><path fill="#000" d="M0 0 L1 1 Z"/></svg>'), 'M0 0 L1 1 Z');
  assert.throws(() => pathFromSvg('<svg></svg>'), /path/);
});
