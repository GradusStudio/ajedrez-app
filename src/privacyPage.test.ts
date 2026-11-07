import test from 'node:test';
import assert from 'node:assert/strict';
import { PRIVACY_PAGE_AVAILABLE as onPhone } from './privacyPage';

test('la política de /privacidad se enlaza solo en la web (su texto describe el navegador y Cloudflare)', async () => {
  // La versión web se carga aparte: el linter resuelve las dos rutas al mismo archivo .web.
  const { PRIVACY_PAGE_AVAILABLE: onWeb } = await import('./privacyPage.web');
  assert.equal(onPhone, false);
  assert.equal(onWeb, true);
});
