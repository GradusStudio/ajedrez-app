import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { findLeaks, heavyCachePlugin } from './swChecks';

/** Carpeta temporal con los archivos dados ({ ruta relativa: contenido }). */
function tempDist(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gradus-dist-'));
  for (const [rel, text] of Object.entries(files)) {
    const file = path.join(dir, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, text);
  }
  return dir;
}

test('findLeaks: un dist limpio no tiene fugas', () => {
  const dir = tempDist({ 'sw.js': 'self.x=1;', 'workbox-abc.js': 'y', 'index.html': '<html>', '_expo/static/js/web/a.js': 'z' });
  assert.deepEqual(findLeaks(dir), []);
});

test('findLeaks: cualquier archivo .map, también en subcarpetas', () => {
  const dir = tempDist({ 'sw.js': 'x', 'sw.js.map': '{}', '_expo/static/js/web/a.js.map': '{}' });
  assert.deepEqual(findLeaks(dir).sort(), ['_expo/static/js/web/a.js.map', 'sw.js.map']);
});

test('findLeaks: sourceMappingURL en sw.js o en workbox-*.js', () => {
  const dir = tempDist({
    'sw.js': 'x\n//# sourceMappingURL=sw.js.map',
    'workbox-1234.js': 'y\n//# sourceMappingURL=workbox-1234.js.map',
    'otro.js': '//# sourceMappingURL=otro.js.map',
  });
  assert.deepEqual(findLeaks(dir).sort(), ['sw.js', 'workbox-1234.js']);
});

test('findLeaks no borra nada', () => {
  const dir = tempDist({ 'sw.js.map': '{}' });
  findLeaks(dir);
  assert.ok(fs.existsSync(path.join(dir, 'sw.js.map')));
});

// El service worker recibe el plugin como texto (Workbox lo serializa con toString), así que se prueba
// la función reconstruida desde su texto: si dependiera de algo de afuera, fallaría aquí.
const cacheWillUpdate = new Function(`return (${heavyCachePlugin.cacheWillUpdate.toString()})`)() as (arg: {
  response: Response;
}) => Promise<Response | null>;

const res = (status: number, type: string) => new Response(status === 204 ? null : 'x', { status, headers: { 'content-type': type } });

test('cacheWillUpdate: guarda una respuesta 200 de JavaScript', async () => {
  const r = res(200, 'application/javascript');
  assert.equal(await cacheWillUpdate({ response: r }), r);
});

test('cacheWillUpdate: rechaza el index.html que devuelve el respaldo de SPA', async () => {
  assert.equal(await cacheWillUpdate({ response: res(200, 'text/html; charset=utf-8') }), null);
});

test('cacheWillUpdate: rechaza lo que no sea 200 (opaca, 404, 204)', async () => {
  assert.equal(await cacheWillUpdate({ response: res(404, 'application/javascript') }), null);
  assert.equal(await cacheWillUpdate({ response: res(204, 'application/javascript') }), null);
  const opaque = { status: 0, headers: new Headers() } as unknown as Response;
  assert.equal(await cacheWillUpdate({ response: opaque }), null);
});
