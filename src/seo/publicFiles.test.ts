import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { es } from '../i18n/es';
import { INDEXABLE_PATHS, publicUrl, SITE_URL } from './routeMeta';

const publicDir = path.join(__dirname, '..', '..', 'public');
const read = (name: string) => fs.readFileSync(path.join(publicDir, name), 'utf8');
// La portada (graduschess.com/) es estática y vive aparte de la app: sitio/index.html.
const readPortada = () => fs.readFileSync(path.join(__dirname, '..', '..', 'sitio', 'index.html'), 'utf8');

test('robots.txt deja pasar a todos y apunta al sitemap', () => {
  const robots = read('robots.txt');
  assert.match(robots, /^User-agent: \*$/m);
  assert.doesNotMatch(robots, /^Disallow:\s*\S/m, 'no debe bloquear ninguna ruta');
  assert.match(robots, new RegExp(`^Sitemap: ${SITE_URL}/sitemap\\.xml$`, 'm'));
});

test('sitemap.xml lista exactamente las páginas indexables', () => {
  const urls = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const expected = INDEXABLE_PATHS.map(publicUrl);
  assert.deepEqual(urls, expected);
});

test('la portada trae título, descripción, canónica y datos estructurados válidos', () => {
  const html = readPortada();
  // Título y descripción los completa scripts/build-portada.ts con los de la app (meta.title y meta.description).
  assert.match(html, /<title>\{\{meta\.title\}\}<\/title>/);
  assert.match(html, /<meta name="description" content="\{\{meta\.description\}\}"/);
  assert.ok(es['meta.description'].length >= 50 && es['meta.description'].length <= 160, 'meta.description: entre 50 y 160 caracteres');
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

test('/sw.js de la raíz se borra solo: libera a quien tenía el service worker de antes de /app', () => {
  const sw = fs.readFileSync(path.join(__dirname, '..', '..', 'sitio', 'sw.js'), 'utf8');
  assert.match(sw, /self\.skipWaiting\(\)/);
  assert.match(sw, /self\.registration\.unregister\(\)/);
  assert.doesNotMatch(sw, /caches\.delete\('gradus-heavy'\)/, 'no borra la caché de la app nueva');
  const build = fs.readFileSync(path.join(__dirname, '..', '..', 'scripts', 'build-portada.ts'), 'utf8');
  assert.match(build, /'sw\.js'/, 'build-portada.ts tiene que copiar sitio/sw.js a dist/sw.js');
  assert.match(read('_headers'), /^\/sw\.js\n\s+Cache-Control: no-cache$/m);
});
