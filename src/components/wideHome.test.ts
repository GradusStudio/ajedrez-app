import test from 'node:test';
import assert from 'node:assert/strict';
import { homeWideColumns } from './wideHome';

test('a 960 de ventana la ruta es 580 y el total 884', () => {
  assert.deepEqual(homeWideColumns(884), { route: 580, panel: 280, gap: 24, total: 884 });
});

test('la ruta no pasa de 640 y el total es 944', () => {
  assert.deepEqual(homeWideColumns(948), { route: 640, panel: 280, gap: 24, total: 944 });
  assert.deepEqual(homeWideColumns(968), { route: 640, panel: 280, gap: 24, total: 944 });
  assert.deepEqual(homeWideColumns(1208), { route: 640, panel: 280, gap: 24, total: 944 });
});

test('respeta el mínimo de 480 y devuelve null si no entra', () => {
  assert.deepEqual(homeWideColumns(784), { route: 480, panel: 280, gap: 24, total: 784 });
  assert.equal(homeWideColumns(783), null);
});
