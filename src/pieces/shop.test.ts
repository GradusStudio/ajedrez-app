import assert from 'node:assert/strict';
import { test } from 'node:test';
import { boardThemePrice, isBoardThemeOwned, isPieceSetOwned, pieceSetPrice } from './shop';

test('hielo y magma cuestan 200 monedas, tablero y piezas', () => {
  for (const id of ['hielo', 'magma'] as const) {
    assert.equal(boardThemePrice(id), 200);
    assert.equal(pieceSetPrice(id), 200);
  }
});

test('lo que no tiene precio es gratis y siempre propio', () => {
  assert.equal(boardThemePrice('verde'), 0);
  assert.equal(pieceSetPrice('clasico'), 0);
  assert.equal(isBoardThemeOwned('verde', []), true);
  assert.equal(isPieceSetOwned('clasico', []), true);
});

test('lo de pago es propio solo si se compró', () => {
  assert.equal(isBoardThemeOwned('magma', []), false);
  assert.equal(isBoardThemeOwned('magma', ['magma']), true);
  assert.equal(isBoardThemeOwned('magma', ['hielo']), false);
  assert.equal(isPieceSetOwned('hielo', []), false);
  assert.equal(isPieceSetOwned('hielo', ['hielo']), true);
});
