// Comprobaciones del service worker que genera build-sw.js, aparte para poder probarlas (swChecks.test.ts).
const fs = require('fs');
const path = require('path');

/** Todos los archivos de `dir`, con rutas relativas separadas por `/`. */
function listFiles(dir, rel = '') {
  const out = [];
  for (const entry of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
    const child = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...listFiles(dir, child));
    else out.push(child);
  }
  return out;
}

/**
 * Archivos de `distDir` que no se pueden publicar: cualquier `.map` (los mapas de Workbox traen rutas
 * del disco de quien compila, con su usuario de Windows) y `sw.js` o `workbox-*.js` si todavía apuntan
 * a un mapa con `sourceMappingURL`. Solo informa: no borra nada.
 */
function findLeaks(distDir) {
  const leaks = [];
  for (const file of listFiles(distDir)) {
    if (file.endsWith('.map')) {
      leaks.push(file);
      continue;
    }
    if (file === 'sw.js' || /^workbox-[^/]*\.js$/.test(file)) {
      if (fs.readFileSync(path.join(distDir, file), 'utf8').includes('sourceMappingURL')) leaks.push(file);
    }
  }
  return leaks;
}

/**
 * Plugin de la caché `gradus-heavy`. Solo guarda una respuesta 200 que no sea HTML: tras un despliegue, un trozo
 * viejo que ya no existe puede volver como el index.html del respaldo de SPA (200, text/html), y guardarlo dejaría
 * los puzzles o Maia rotos. Workbox lo copia al service worker como texto: no puede usar nada de afuera.
 */
const heavyCachePlugin = {
  cacheWillUpdate: async ({ response }) => {
    if (!response || response.status !== 200) return null;
    const type = response.headers.get('content-type') || '';
    return type.includes('text/html') ? null : response;
  },
};

const CONNECT_SRC = /connect-src ([^;\n]*)/;

/**
 * Suma `origin` al `connect-src` de la CSP de un _headers (para probar en la PC con los trozos de puzzles en
 * localhost). Falla si no encuentra la directiva.
 */
function addConnectSrc(headers, origin) {
  if (!CONNECT_SRC.test(headers)) throw new Error('El _headers no tiene connect-src');
  return headers.replace(CONNECT_SRC, (m, list) => (list.split(' ').includes(origin) ? m : `${m} ${origin}`));
}

/** El `connect-src` de la CSP permite `origin`. */
function allowsConnect(headers, origin) {
  const m = CONNECT_SRC.exec(headers);
  return !!m && m[1].split(' ').includes(origin);
}

module.exports = { findLeaks, heavyCachePlugin, addConnectSrc, allowsConnect };
