import test from 'node:test';
import assert from 'node:assert/strict';
import { PRIVACY_PAGE_AVAILABLE as onPhone } from './privacyPage';
import { PRIVACY_PAGE_AVAILABLE as onWeb } from './privacyPage.web';

test('la política de /privacidad se enlaza solo en la web (su texto describe el navegador y Cloudflare)', () => {
  assert.equal(onPhone, false);
  assert.equal(onWeb, true);
});
