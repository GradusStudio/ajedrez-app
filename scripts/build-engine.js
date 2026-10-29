// Empaqueta Stockfish (versión web liviana) para la app: `npm run build:engine`.
//
// Lee los archivos del paquete npm `stockfish` SIN MODIFICARLOS y genera
// src/engine/stockfish/stockfishAssets.ts con el .js como texto y el .wasm en base64.
// También copia la licencia (GPL v3). Ver docs/motor.md.
//
// Volver a ejecutarlo solo al cambiar la versión de `stockfish` en package.json.
/* global __dirname */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const pkgDir = path.join(root, 'node_modules', 'stockfish');
const pkg = require(path.join(pkgDir, 'package.json'));
const base = `stockfish-${pkg.buildVersion}-lite-single`;
const outDir = path.join(root, 'src', 'engine', 'stockfish');

const js = fs.readFileSync(path.join(pkgDir, 'bin', `${base}.js`), 'utf8');
const wasm = fs.readFileSync(path.join(pkgDir, 'bin', `${base}.wasm`));

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, 'stockfishAssets.ts'),
  [
    '// ARCHIVO GENERADO por scripts/build-engine.js. No editar a mano.',
    `// Stockfish.js ${pkg.version} (${base}), licencia GPL v3: ver COPYING.txt en esta carpeta.`,
    `// Código fuente: ${pkg.homepage || 'https://github.com/nmrugg/stockfish.js'}`,
    `export const STOCKFISH_VERSION = ${JSON.stringify(`${pkg.version} (${base})`)};`,
    `export const STOCKFISH_JS = ${JSON.stringify(js)};`,
    `export const STOCKFISH_WASM_BASE64 = ${JSON.stringify(wasm.toString('base64'))};`,
    '',
  ].join('\n')
);
fs.copyFileSync(path.join(pkgDir, 'Copying.txt'), path.join(outDir, 'COPYING.txt'));

console.log(`Listo: ${base} (${(wasm.length / 1048576).toFixed(1)} MB de wasm) en src/engine/stockfish/`);
