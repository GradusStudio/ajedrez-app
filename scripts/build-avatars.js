// Prepara las caras de los bots: `npm run build:avatars`
//   assets/fuente/expresiones/<id>-<expresion>.{png,webp}  (originales, cuadradas, fondo transparente)
//   → assets/bots/expresiones/<id>-<expresion>.webp (256 × 256, calidad 80)
//   → src/components/botExpressions.generated.ts (mapa que usa BotAvatar)
// Un nombre que no corresponda a un bot o a una expresión detiene el script.
/* global __dirname, process */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.join(__dirname, '..');
const srcDir = path.join(root, 'assets', 'fuente', 'expresiones');
const outDir = path.join(root, 'assets', 'bots', 'expresiones');
const mapFile = path.join(root, 'src', 'components', 'botExpressions.generated.ts');
const EXPRESSIONS = ['explica', 'piensa', 'acierto', 'pista'];
const SIZE = 256;

const bots = require(path.join(root, 'src', 'data', 'bots.json')).bots.map((b) => b.id);

function fail(msg) {
  console.error('Error: ' + msg);
  process.exit(1);
}

async function main() {
  const files = (fs.existsSync(srcDir) ? fs.readdirSync(srcDir) : []).filter((f) => /\.(png|webp)$/i.test(f)).sort();
  const map = {};
  for (const file of files) {
    const m = /^([a-z]+)-([a-z]+)\.(png|webp)$/.exec(file);
    if (!m) fail(`el nombre «${file}» no sigue el formato <bot>-<expresion>.png`);
    const [, id, expression] = m;
    if (!bots.includes(id)) fail(`«${file}»: no hay un bot «${id}» (bots: ${bots.join(', ')})`);
    if (!EXPRESSIONS.includes(expression)) fail(`«${file}»: la expresión «${expression}» no existe (válidas: ${EXPRESSIONS.join(', ')})`);
    if (map[id]?.[expression]) fail(`«${file}»: ya hay otra imagen para ${id}-${expression} (png y webp a la vez)`);
    (map[id] ??= {})[expression] = file;
  }

  // Si hay imágenes, la carpeta de salida se arma de cero para que no queden caras viejas.
  fs.rmSync(outDir, { recursive: true, force: true });
  if (files.length) fs.mkdirSync(outDir, { recursive: true });
  for (const id of Object.keys(map)) {
    for (const expression of Object.keys(map[id])) {
      await sharp(path.join(srcDir, map[id][expression]))
        .resize(SIZE, SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .webp({ quality: 80 })
        .toFile(path.join(outDir, `${id}-${expression}.webp`));
    }
  }

  // Los require tienen que ser textos fijos: Metro no resuelve rutas armadas al vuelo.
  const ids = Object.keys(map).sort();
  const body = ids.length
    ? '{\n' +
      ids
        .map((id) => {
          const items = EXPRESSIONS.filter((e) => map[id][e])
            .map((e) => `    ${e}: require('../../assets/bots/expresiones/${id}-${e}.webp'),\n`)
            .join('');
          return `  ${id}: {\n${items}  },\n`;
        })
        .join('') +
      '}'
    : '{}';
  const ts =
    '// ARCHIVO GENERADO por scripts/build-avatars.js. No editar a mano.\n' +
    "import type { ImageSourcePropType } from 'react-native';\n" +
    "import type { BotExpression } from './botFace';\n\n" +
    `export const BOT_EXPRESSIONS: Partial<Record<string, Partial<Record<BotExpression, ImageSourcePropType>>>> = ${body};\n`;
  fs.writeFileSync(mapFile, ts);
  console.log(`${files.length} imágenes → ${path.relative(root, mapFile)}`);
}

main().catch((e) => fail(e.message));
