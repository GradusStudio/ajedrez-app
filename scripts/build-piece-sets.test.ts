import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BASELINE,
  CENTER_X,
  MAX_WIDTH,
  PIECE_ORDER,
  PX_PER_UNIT,
  TARGET_HEIGHTS,
  closeMask,
  fillHoles,
  pathFromSvg,
  placementFor,
  scalePathNumbers,
  splitSheet,
} from './build-piece-sets.logic';
import { PATHS as MINIMALISTA } from '../src/pieces/sets/minimalista';
import { PATHS as REDONDEADO } from '../src/pieces/sets/redondeado';
import { PATHS as MADERA } from '../src/pieces/sets/madera';
import { PATHS as MARMOL } from '../src/pieces/sets/marmol';
import { PATHS as MAGMA } from '../src/pieces/sets/magma';

const GENERATED = {
  minimalista: MINIMALISTA,
  redondeado: REDONDEADO,
  madera: MADERA,
  marmol: MARMOL,
  magma: MAGMA,
} as const;

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

test('stretchX corrige el ancho sin cambiar la altura ni la base', () => {
  const base = placementFor('q', 200, 300);
  const corregida = placementFor('q', 200, 300, 0.8);
  assert.ok(Math.abs(corregida.width - base.width * 0.8) <= 1);
  assert.equal(corregida.height, base.height);
  assert.equal(corregida.top + corregida.height, BASELINE * PX_PER_UNIT);
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

/** Hoja sintética de dos filas con seis piezas de 8 × 7 px separadas por 2 px. */
function twoRows(W = 62, H = 21) {
  const ink = new Uint8Array(W * H);
  const rect = (x0: number, y0: number, x1: number, y1: number) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) ink[y * W + x] = 1;
  };
  for (let c = 0; c < 6; c++) {
    rect(1 + c * 10, 2, 8 + c * 10, 8);
    rect(1 + c * 10, 12, 8 + c * 10, 18);
  }
  return { ink, W, H };
}

test('splitSheet conserva las bases cuando una línea blanca cruza la fila negra', () => {
  const { ink, W, H } = twoRows();
  // La línea que separa las losas del cuerpo cruza toda la hoja a la misma altura.
  for (let x = 0; x < W; x++) ink[15 * W + x] = 0;
  const boxes = splitSheet(ink, W, H);
  assert.equal(boxes.black.length, 6);
  assert.deepEqual(boxes.black[0], { x0: 1, y0: 12, x1: 8, y1: 18 });
  assert.deepEqual(boxes.black[5], { x0: 51, y0: 12, x1: 58, y1: 18 });
  assert.equal(boxes.white[0].y1, 8, 'la fila blanca no cambia');
});

test('splitSheet conserva el cuerpo cuando una línea blanca cruza la fila blanca', () => {
  const { ink, W, H } = twoRows();
  for (let x = 0; x < W; x++) ink[5 * W + x] = 0;
  const boxes = splitSheet(ink, W, H);
  assert.equal(boxes.white.length, 6);
  assert.deepEqual(boxes.white[0], { x0: 1, y0: 2, x1: 8, y1: 8 });
  assert.deepEqual(boxes.black[0], { x0: 1, y0: 12, x1: 8, y1: 18 });
});

test('splitSheet une columnas separadas por una línea blanca de menos del 1,5 % del ancho', () => {
  const { ink, W, H } = twoRows(100, 21);
  // Línea vertical de 1 px en el medio de cada pieza: los dos trozos son una sola columna.
  for (let c = 0; c < 6; c++) {
    for (let y = 0; y < H; y++) ink[y * W + 5 + c * 10] = 0;
  }
  const boxes = splitSheet(ink, W, H);
  assert.equal(boxes.white.length, 6);
  assert.equal(boxes.black.length, 6);
  assert.deepEqual(boxes.white[0], { x0: 1, y0: 2, x1: 8, y1: 8 });
  assert.deepEqual(boxes.black[5], { x0: 51, y0: 12, x1: 58, y1: 18 });
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

test('closeMask une un canal fino y deja abierto uno ancho', () => {
  const W = 40;
  const H = 20;
  const fine = new Uint8Array(W * H);
  for (let y = 2; y <= 8; y++) for (let x = 2; x <= 37; x++) fine[y * W + x] = 1;
  for (let y = 10; y <= 17; y++) for (let x = 2; x <= 37; x++) fine[y * W + x] = 1;
  assert.equal(closeMask(fine, W, H, 2)[9 * W + 20], 1, 'el canal de una fila se cierra');

  const wide = new Uint8Array(W * H);
  for (let y = 2; y <= 8; y++) for (let x = 2; x <= 37; x++) wide[y * W + x] = 1;
  for (let y = 17; y <= 19; y++) for (let x = 2; x <= 37; x++) wide[y * W + x] = 1;
  assert.equal(closeMask(wide, W, H, 2)[12 * W + 20], 0, 'el canal de ocho filas sigue abierto');
});

/** Caja aproximada de un path (todos sus números son coordenadas x, y). */
function pathBox(d: string) {
  const nums = (d.match(/-?\d*\.?\d+/g) ?? []).map(Number);
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (let i = 0; i + 1 < nums.length; i += 2) {
    x0 = Math.min(x0, nums[i]);
    x1 = Math.max(x1, nums[i]);
    y0 = Math.min(y0, nums[i + 1]);
    y1 = Math.max(y1, nums[i + 1]);
  }
  return { x0, y0, x1, y1, width: x1 - x0, height: y1 - y0 };
}

test('las negras de cada set miden como las blancas y su tinta queda dentro de la silueta', () => {
  const types = ['k', 'q', 'r', 'b', 'n', 'p'] as const;
  for (const set of ['minimalista', 'redondeado', 'madera', 'marmol', 'magma'] as const) {
    for (const t of types) {
      const w = pathBox(GENERATED[set][`w${t}`].sil);
      const b = pathBox(GENERATED[set][`b${t}`].sil);
      assert.ok(b.width <= w.width * 1.05, `${set}-${t}: ancho negra ${b.width.toFixed(1)} vs blanca ${w.width.toFixed(1)}`);
      assert.ok(Math.abs(b.height - w.height) <= w.height * 0.05, `${set}-${t}: alto`);
      assert.ok(Math.abs(b.y1 - BASELINE) <= 1 && Math.abs(w.y1 - BASELINE) <= 1, `${set}-${t}: línea de base`);
      const ink = pathBox(GENERATED[set][`b${t}`].ink);
      assert.ok(
        ink.x0 >= b.x0 - 3 && ink.x1 <= b.x1 + 3 && ink.y0 >= b.y0 - 3 && ink.y1 <= b.y1 + 3,
        `${set}-${t}: la tinta se sale de la silueta`,
      );
    }
  }
});
