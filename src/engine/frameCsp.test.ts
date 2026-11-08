import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { frameScriptHashes, HEADERS_FILE } from '../../scripts/frameCsp';

test('la CSP de public/_headers lista los hashes de los scripts de los iframes del motor', async () => {
  const headers = fs.readFileSync(HEADERS_FILE, 'utf8');
  const scriptSrc = /script-src([^;]*);/.exec(headers)![1];
  const hashes = await frameScriptHashes();
  for (const h of hashes) {
    assert.ok(scriptSrc.includes(h), `falta ${h}: corre «npx tsx scripts/frameCsp.ts --write»`);
  }
  assert.ok(!scriptSrc.includes("'unsafe-inline'"), "script-src no debe permitir 'unsafe-inline'");
  assert.ok(!/\bblob:/.test(scriptSrc), 'script-src no debe permitir blob:');
  const listed = scriptSrc.match(/'sha256-[^']+'/g) ?? [];
  assert.equal(listed.length, hashes.length, 'sobran hashes viejos en script-src');
});
