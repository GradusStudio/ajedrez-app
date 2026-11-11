import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { PRACTICE_CACHE, PRACTICE_KEY } from '../src/progress/practiceMarkLogic';

/** Contenido de un archivo del repositorio, como texto. */
function read(rel: string): string {
  return fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
}

test('push-sw.js registra un manejador push y uno notificationclick', () => {
  const sw = read('scripts/push-sw.js');
  assert.match(sw, /self\.addEventListener\(\s*['"]push['"]/);
  assert.match(sw, /self\.addEventListener\(\s*['"]notificationclick['"]/);
});

test('push-sw.js usa la misma caché y clave que practiceMarkLogic', () => {
  const sw = read('scripts/push-sw.js');
  assert.ok(sw.includes(`PRACTICE_CACHE = '${PRACTICE_CACHE}'`), `PRACTICE_CACHE debe ser ${PRACTICE_CACHE}`);
  assert.ok(sw.includes(`PRACTICE_KEY = '${PRACTICE_KEY}'`), `PRACTICE_KEY debe ser ${PRACTICE_KEY}`);
  assert.ok(sw.includes('caches.match(PRACTICE_KEY'), 'push-sw.js lee la marca con caches.match(PRACTICE_KEY)');
});

test('build-sw.js copia push-sw.js e importa /app/push-sw.js', () => {
  const build = read('scripts/build-sw.js');
  assert.match(build, /copyFileSync\([^)]*push-sw\.js/);
  assert.match(build, /importScripts:\s*\[\s*['"]\/app\/push-sw\.js['"]\s*\]/);
});
