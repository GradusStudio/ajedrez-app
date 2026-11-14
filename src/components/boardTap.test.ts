import test from 'node:test';
import assert from 'node:assert/strict';
import { DOUBLE_TAP_MS, DOUBLE_TAP_PX, isDoubleTap } from './boardTap';

const tap = (time: number, x = 0, y = 0) => ({ time, x, y });

test('isDoubleTap: dos toques seguidos y cerca son doble toque', () => {
  assert.equal(isDoubleTap(tap(1000), tap(1250, 10, 5)), true);
});

test('isDoubleTap: fuera de tiempo no', () => {
  assert.equal(isDoubleTap(tap(1000), tap(1000 + DOUBLE_TAP_MS + 1)), false);
});

test('isDoubleTap: lejos no', () => {
  assert.equal(isDoubleTap(tap(1000), tap(1100, DOUBLE_TAP_PX + 1)), false);
});

test('isDoubleTap: sin toque anterior no', () => {
  assert.equal(isDoubleTap(null, tap(1000)), false);
});
