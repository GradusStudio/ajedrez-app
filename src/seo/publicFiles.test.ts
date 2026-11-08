import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { INDEXABLE_PATHS, SITE_URL } from './routeMeta';

const publicDir = path.join(__dirname, '..', '..', 'public');
const read = (name: string) => fs.readFileSync(path.join(publicDir, name), 'utf8');

test('robots.txt deja pasar a todos y apunta al sitemap', () => {
  const robots = read('robots.txt');
  assert.match(robots, /^User-agent: \*$/m);
  assert.doesNotMatch(robots, /^Disallow:\s*\S/m, 'no debe bloquear ninguna ruta');
  assert.match(robots, new RegExp(`^Sitemap: ${SITE_URL}/sitemap\\.xml$`, 'm'));
});

test('sitemap.xml lista exactamente las páginas indexables', () => {
  const urls = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const expected = INDEXABLE_PATHS.map((p) => (p === '/' ? `${SITE_URL}/` : `${SITE_URL}${p}`));
  assert.deepEqual(urls, expected);
});

test('index.html trae título, descripción, canónica y datos estructurados válidos', () => {
  const html = read('index.html');
  assert.doesNotMatch(html, /%WEB_TITLE%/);
  assert.match(html, /<title>[^<]+<\/title>/);
  assert.match(html, /<meta name="description" content="[^"]{50,160}"/);
  assert.match(html, new RegExp(`<link rel="canonical" href="${SITE_URL}/"`));
  const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(ld, 'falta el JSON-LD');
  const data = JSON.parse(ld[1]);
  assert.equal(data['@type'], 'WebApplication');
  assert.equal(data.url, `${SITE_URL}/`);
});

test('_headers fuerza HTTPS (HSTS) y mantiene la política de contenido cerrada', () => {
  const headers = read('_headers');
  assert.match(headers, /^\s*Strict-Transport-Security: max-age=\d{7,}\s*$/m);
  // Sin includeSubDomains ni preload: no se compromete el resto de subdominios del dominio.
  assert.doesNotMatch(headers, /Strict-Transport-Security:.*(includeSubDomains|preload)/);
  for (const d of ["object-src 'none'", "base-uri 'none'", "frame-ancestors 'none'", "form-action 'none'"]) assert.ok(headers.includes(d), d);
});
test('index.html no usa httpEquiv (es de JSX, en HTML no hace nada)', () => {
  assert.doesNotMatch(read('index.html'), /httpEquiv/);
});
