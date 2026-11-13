import test from 'node:test';
import assert from 'node:assert/strict';
import { homeWideColumns } from './wideHome';

test('a 960 de ventana la ruta es 560, el total 864 y quedan 20 px para la barra', () => {
  assert.deepEqual(homeWideColumns(884), { route: 560, panel: 280, gap: 24, total: 864 });
});

test('la ruta no pasa de 640 y el total es 944', () => {
  assert.deepEqual(homeWideColumns(948), { route: 624, panel: 280, gap: 24, total: 928 });
  assert.deepEqual(homeWideColumns(968), { route: 640, panel: 280, gap: 24, total: 944 });
  assert.deepEqual(homeWideColumns(1208), { route: 640, panel: 280, gap: 24, total: 944 });
});

test('respeta el mínimo de 480 y devuelve null si no entra', () => {
  assert.deepEqual(homeWideColumns(804), { route: 480, panel: 280, gap: 24, total: 784 });
  assert.equal(homeWideColumns(803), null);
});
