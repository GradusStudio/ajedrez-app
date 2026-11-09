import test from 'node:test';
import assert from 'node:assert/strict';
import { isPopupError, PopupError } from './popupError';
import { SyncError } from './syncEngine';

test('isPopupError reconoce PopupError y no otros errores', () => {
  assert.equal(isPopupError(new PopupError()), true);
  assert.equal(isPopupError(new SyncError('offline')), false);
  assert.equal(isPopupError(new Error('x')), false);
  assert.equal(isPopupError(undefined), false);
});
