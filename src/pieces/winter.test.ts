import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PIECE_PATHS } from './pieceSets';
import { pathBounds, winterShapes } from './winter';

test('caja de un trazado simple', () => assert.deepEqual(pathBounds('M10 20 30 5 25 40Z'), { minX: 10, minY: 5, maxX: 30, maxY: 40 }));

test('las 12 piezas tienen nieve, carámbanos y copo, y los carámbanos caben en el dibujo', () => {
  for (const [key, p] of Object.entries(PIECE_PATHS.clasico)) {
    const s = winterShapes(p.sil);
    assert.ok(s.cap.startsWith('M') && s.cap.endsWith('Z'), key);
    assert.ok(s.icicles.length > 0 && s.flake.length > 0, key);
    assert.ok(pathBounds(s.icicles).maxY <= 106, `${key}: carámbano fuera del dibujo`);
  }
});
