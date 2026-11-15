import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PIECE_PATHS } from './pieceSets';
import { volcanoShapes } from './volcano';
import { pathBounds } from './winter';

test('las 12 piezas tienen lava, grietas, gotas y tres brasas', () => {
  for (const [key, p] of Object.entries(PIECE_PATHS.clasico)) {
    const v = volcanoShapes(p.sil);
    const b = pathBounds(p.sil);
    assert.ok(v.lava.startsWith('M') && v.lava.endsWith('Z'), key);
    assert.ok(v.lavaFrom < v.lavaTo, key);
    assert.equal((v.cracks.match(/M/g) ?? []).length, 3, `${key}: dos zigzags y una rama`);
    assert.equal((v.drops.match(/M/g) ?? []).length, 4, `${key}: cuatro gotas`);
    assert.equal(v.embers.length, 3, key);
    assert.ok(v.embers.every((e) => e.y < b.minY), `${key}: brasa dentro de la pieza`);
    assert.ok(pathBounds(v.drops).maxY <= 106, `${key}: gota fuera del dibujo`);
  }
});

test('un trazado sin coordenadas no rompe las formas', () => {
  assert.deepEqual(volcanoShapes(''), { lava: '', lavaFrom: 0, lavaTo: 0, cracks: '', drops: '', embers: [] });
  assert.deepEqual(volcanoShapes('no es un path'), { lava: '', lavaFrom: 0, lavaTo: 0, cracks: '', drops: '', embers: [] });
});

test('las formas solo dependen de la silueta', () => {
  const sil = PIECE_PATHS.clasico.wk.sil;
  assert.deepEqual(volcanoShapes(sil), volcanoShapes(sil));
});
