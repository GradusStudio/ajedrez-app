// Genera dist/sw.js con Workbox después de `expo export -p web`.
//
// Se guarda todo dist/ en el precache salvo los trozos pesados (las tres redes de Maia), que se bajan una vez al
// usarlos y quedan en la caché `gradus-heavy` (CacheFirst). Los puzzles de la web no están en dist/: se piden de a
// trozos a puzzles.graduschess.com y quedan en la caché `gradus-puzzles` (CacheFirst, los 60 más usados).
//
// Cómo se reconocen los trozos pesados (los nombres llevan un hash que cambia en cada compilación):
// en dist/_expo/static/js/web, archivos de más de 1 MB cuyo comienzo trae `"MAIA_<elo>"` (el nombre del export,
// ej. MAIA_1100). Si no se encuentran exactamente 3, la compilación falla para no publicar una versión que precachea
// 7 MB de más. Si aparece el trozo de los 50.000 puzzles de la app nativa (`Lichess puzzle database`), también falla.
//
// Para probar en la PC con los trozos en localhost: EXPO_PUBLIC_PUZZLES_URL=http://localhost:8789/ al compilar.
// La app pide los trozos ahí y el _headers de dist/ (solo el de esa compilación) lo permite en la CSP. En la
// compilación de Cloudflare (WORKERS_CI) esa variable hace fallar la compilación.
const fs = require('fs');
const path = require('path');
const { generateSW } = require('workbox-build');
const { addConnectSrc, allowsConnect, findLeaks, heavyCachePlugin } = require('./swChecks');
const manifest = require('../src/puzzles/manifest.json');

// La app se publica en /app (experiments.baseUrl en app.json): su service worker es dist/app/sw.js y solo controla
// /app/. La portada (dist/index.html, la arma scripts/build-portada.js) queda fuera: no necesita abrir sin internet.
const ROOT = path.join(__dirname, '..', 'dist');
const DIST = path.join(ROOT, 'app');
const BASE = '/app/';
const JS_DIR = path.join(DIST, '_expo', 'static', 'js', 'web');
const HEAVY_MIN_BYTES = 1024 * 1024;
const MAIA = /"MAIA_\d+"/;
const NATIVE_PUZZLES = /Lichess puzzle database/;

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
    if (NATIVE_PUZZLES.test(head)) throw new Error(`La web incluye los 50.000 puzzles de la app nativa (${name}): se importó puzzleSource.ts en vez de .web.ts`);
    if (MAIA.test(head)) found.push(`_expo/static/js/web/${name}`);
  }
  return found;
}

/**
 * Origen de los trozos de puzzles. Con EXPO_PUBLIC_PUZZLES_URL (prueba en la PC) suma ese origen a la CSP de
 * dist/_headers; sin ella, comprueba que la CSP permite el de producción y no menciona localhost.
 */
function puzzlesOrigin() {
  const headersFile = path.join(ROOT, '_headers');
  const headers = fs.readFileSync(headersFile, 'utf8');
  const override = process.env.EXPO_PUBLIC_PUZZLES_URL;
  if (override) {
    if (process.env.WORKERS_CI) throw new Error('EXPO_PUBLIC_PUZZLES_URL es solo para probar en la PC: no puede estar en la compilación de Cloudflare');
    const origin = new URL(override).origin;
    if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) throw new Error(`EXPO_PUBLIC_PUZZLES_URL tiene que ser localhost: ${origin}`);
    fs.writeFileSync(headersFile, addConnectSrc(headers, origin));
    console.log(`Puzzles desde ${origin} (compilación local: la CSP de dist/_headers lo permite)`);
    return origin;
  }
  const origin = new URL(manifest.base).origin;
  if (!allowsConnect(headers, origin)) throw new Error(`La CSP de public/_headers no permite ${origin} en connect-src`);
  if (/localhost|127\.0\.0\.1/.test(headers)) throw new Error('El _headers de producción menciona localhost');
  return origin;
}

async function main() {
  const heavy = findHeavyChunks();
  if (heavy.length !== 3) {
    throw new Error(`Se esperaban 3 trozos pesados (las redes de Maia) y hay ${heavy.length}: ${heavy.join(', ')}`);
  }
  const matchPuzzles = new Function('ctx', `return ctx.url.origin === ${JSON.stringify(puzzlesOrigin())};`);
  // Workbox copia esta función al service worker como texto: no puede usar variables de afuera.
  const heavyPathsJson = JSON.stringify(heavy.map((p) => BASE + p));
  const matchHeavy = new Function('ctx', `return ${heavyPathsJson}.includes(ctx.url.pathname);`);

  const { count, size, warnings } = await generateSW({
    globDirectory: DIST,
    globPatterns: ['**/*'],
    // 404.html y */index.html son copias del index.html que deja build-portada.js para Cloudflare: el service worker
    // ya responde esas rutas con navigateFallback.
    globIgnores: ['sw.js', 'workbox-*.js', '404.html', '*/index.html', '**/*.map', ...heavy],
    swDest: path.join(DIST, 'sw.js'),
    // Los mapas de Workbox traen rutas del disco de quien compila (con su usuario): no se generan.
    sourcemap: false,
    maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
    skipWaiting: false,
    clientsClaim: false,
    cleanupOutdatedCaches: true,
    navigateFallback: BASE + 'index.html',
    runtimeCaching: [
      {
        urlPattern: matchHeavy,
        handler: 'CacheFirst',
        options: {
          cacheName: 'gradus-heavy',
          // Solo respuestas 200 que no sean HTML (swChecks.js): nunca el index.html del respaldo de SPA.
          plugins: [heavyCachePlugin],
          // Los nombres cambian en cada versión: quedan los 3 trozos usados más recientemente.
          expiration: { maxEntries: 3 },
        },
      },
      {
        urlPattern: matchPuzzles,
        handler: 'CacheFirst',
        options: {
          cacheName: 'gradus-puzzles',
          // Las rutas llevan versión (v1/...): un trozo guardado no cambia nunca. ≈ 110 KB cada uno.
          plugins: [heavyCachePlugin],
          expiration: { maxEntries: 60 },
        },
      },
    ],
  });
  for (const w of warnings) console.warn(w);
  // Cloudflare publica todo dist/: si quedó un mapa o una referencia a uno, la compilación falla (no se borra nada).
  const leaks = [...findLeaks(ROOT), ...findLeaks(DIST).map((f) => 'app/' + f)];
  if (leaks.length > 0) {
    throw new Error(`dist/ tiene mapas de código que no se pueden publicar: ${leaks.join(', ')}`);
  }
  console.log(`dist/app/sw.js: ${count} archivos en el precache (${(size / 1024 / 1024).toFixed(1)} MB); fuera del precache:`);
  for (const h of heavy) console.log(`  ${h}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
