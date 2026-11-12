import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PIECE_SET_LIST, pathSetOf, pieceClipIds } from './materials';
import { PieceKey, PIECE_PATHS } from './pieceSets';

const KEYS: PieceKey[] = ['wk', 'wq', 'wb', 'wn', 'wr', 'wp', 'bk', 'bq', 'bb', 'bn', 'br', 'bp'];

// En la web todos los SVG comparten el documento: `url(#id)` toma el primer elemento con ese id. Si dos piezas
// distintas usan el mismo id, todas se recortan con la silueta de la primera (el rey). El id debe depender
// únicamente del trazado.
test('cada tipo de pieza tiene su propio id de recorte', () => {
  for (const set of PIECE_SET_LIST) {
    const ids = new Set(KEYS.map((key) => pieceClipIds(set.id, key).sil));
    assert.equal(ids.size, KEYS.length, `ids de recorte repetidos en ${set.id}`);
  }
});

test('silueta y tinta nunca comparten id', () => {
  for (const set of PIECE_SET_LIST) {
    for (const key of KEYS) {
      const ids = pieceClipIds(set.id, key);
      assert.notEqual(ids.sil, ids.ink, `${set.id} ${key}`);
    }
  }
});

test('un id compartido siempre corresponde al mismo trazado', () => {
  const all = PIECE_SET_LIST.flatMap((set) =>
    KEYS.map((key) => ({ ids: pieceClipIds(set.id, key), paths: PIECE_PATHS[pathSetOf(set.id)][key] }))
  );
  for (const a of all) {
    for (const b of all) {
      if (a.ids.sil === b.ids.sil) assert.equal(a.paths.sil, b.paths.sil);
      if (a.ids.ink === b.ids.ink) assert.equal(a.paths.ink, b.paths.ink);
    }
  }
});
