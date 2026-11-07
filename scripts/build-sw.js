// Genera dist/sw.js con Workbox después de `expo export -p web`.
//
// Se guarda todo dist/ en el precache salvo los trozos pesados (los puzzles y las tres redes de Maia),
// que se bajan una vez al usarlos y quedan en la caché `gradus-heavy` (CacheFirst).
//
// Cómo se reconocen los trozos pesados (los nombres llevan un hash que cambia en cada compilación):
// en dist/_expo/static/js/web, archivos de más de 1 MB cuyo comienzo trae una marca propia:
//   - redes de Maia: `"MAIA_<elo>"` (el nombre del export, ej. MAIA_1100)
//   - puzzles: `Lichess puzzle database` (el campo `source` de puzzles.json)
// Si no se encuentran exactamente 4 (3 redes y los puzzles), la compilación falla para no publicar
// una versión que precachea 14 MB de más o que deja los puzzles sin caché.
const fs = require('fs');
const path = require('path');
const { generateSW } = require('workbox-build');
const { findLeaks } = require('./swChecks');

const DIST = path.join(__dirname, '..', 'dist');
const JS_DIR = path.join(DIST, '_expo', 'static', 'js', 'web');
const HEAVY_MIN_BYTES = 1024 * 1024;
const MARKERS = [/"MAIA_\d+"/, /Lichess puzzle database/];

function findHeavyChunks() {
  const found = [];
  for (const name of fs.readdirSync(JS_DIR)) {
    const file = path.join(JS_DIR, name);
    if (!name.endsWith('.js') || fs.statSync(file).size < HEAVY_MIN_BYTES) continue;
    const fd = fs.openSync(file, 'r');
    const buf = Buffer.alloc(2048);
    const n = fs.readSync(fd, buf, 0, buf.length, 0);
    fs.closeSync(fd);
    const head = buf.toString('latin1', 0, n);
    if (MARKERS.some((m) => m.test(head))) found.push(`_expo/static/js/web/${name}`);
  }
  return found;
}

async function main() {
  const heavy = findHeavyChunks();
  if (heavy.length !== 4) {
    throw new Error(`Se esperaban 4 trozos pesados (3 redes de Maia y los puzzles) y hay ${heavy.length}: ${heavy.join(', ')}`);
  }
  // Workbox copia esta función al service worker como texto: no puede usar variables de afuera.
  const heavyPathsJson = JSON.stringify(heavy.map((p) => '/' + p));
  const matchHeavy = new Function('ctx', `return ${heavyPathsJson}.includes(ctx.url.pathname);`);

  const { count, size, warnings } = await generateSW({
    globDirectory: DIST,
    globPatterns: ['**/*'],
    globIgnores: ['sw.js', 'workbox-*.js', '_headers', '**/*.map', ...heavy],
    swDest: path.join(DIST, 'sw.js'),
    // Los mapas de Workbox traen rutas del disco de quien compila (con su usuario): no se generan.
    sourcemap: false,
    maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
    skipWaiting: false,
    clientsClaim: false,
    cleanupOutdatedCaches: true,
    navigateFallback: '/index.html',
    runtimeCaching: [
      {
        urlPattern: matchHeavy,
        handler: 'CacheFirst',
        options: { cacheName: 'gradus-heavy', cacheableResponse: { statuses: [0, 200] } },
      },
    ],
  });
  for (const w of warnings) console.warn(w);
  // Cloudflare publica todo dist/: si quedó un mapa o una referencia a uno, la compilación falla (no se borra nada).
  const leaks = findLeaks(DIST);
  if (leaks.length > 0) {
    throw new Error(`dist/ tiene mapas de código que no se pueden publicar: ${leaks.join(', ')}`);
  }
  console.log(`dist/sw.js: ${count} archivos en el precache (${(size / 1024 / 1024).toFixed(1)} MB); fuera del precache:`);
  for (const h of heavy) console.log(`  ${h}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
