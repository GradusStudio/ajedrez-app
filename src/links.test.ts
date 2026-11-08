import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isSafeHref } from './links';

test('rutas internas y direcciones https o mailto son seguras', () => {
  for (const h of ['/privacidad', '/', 'https://github.com/GradusStudio/ajedrez-app', 'mailto:gradusstudioapp@gmail.com', 'HTTPS://example.com']) {
    assert.equal(isSafeHref(h), true, h);
  }
});
test('otros esquemas, rutas con doble barra y valores raros no lo son', () => {
  for (const h of ['javascript:alert(1)', 'data:text/html,x', 'file:///etc/passwd', 'intent://x#Intent;end', 'http://example.com', '//evil.com', '', ' https://x.com', 'tel:123', 'JaVaScRiPt:1']) {
    assert.equal(isSafeHref(h), false, h);
  }
  assert.equal(isSafeHref(undefined as never), false);
  assert.equal(isSafeHref(5 as never), false);
});
