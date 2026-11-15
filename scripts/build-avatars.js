// Prepara las caras de los bots: `npm run build:avatars`
//   assets/fuente/expresiones/<id>-<expresion>.{png,webp}  (originales, cuadradas, fondo transparente)
//   → assets/bots/expresiones/<id>-<expresion>.webp (256 × 256, calidad 80)
//   → src/components/botExpressions.generated.ts (mapa que usa BotAvatar)
// Un nombre que no corresponda a un bot o a una expresión, o no tener imágenes, detiene el script sin tocar nada.
// Las imágenes se convierten en una carpeta temporal y reemplazan a las anteriores solo si todas salieron bien.
/* global __dirname, process */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.join(__dirname, '..');
const srcDir = path.join(root, 'assets', 'fuente', 'expresiones');
const outDir = path.join(root, 'assets', 'bots', 'expresiones');
const tmpDir = outDir + '.tmp';
const mapFile = path.join(root, 'src', 'components', 'botExpressions.generated.ts');
const EXPRESSIONS = ['explica', 'piensa', 'acierto', 'pista'];
const SIZE = 256;
// Poses de cuerpo entero (tarea 47): originales en assets/fuente/cuerpo/<id>-<pose>.<ext>.
const bodySrcDir = path.join(root, 'assets', 'fuente', 'cuerpo');
const bodyOutDir = path.join(root, 'assets', 'bots', 'cuerpo');
const bodyTmpDir = bodyOutDir + '.poses.tmp';
const bodyMapFile = path.join(root, 'src', 'components', 'botBodies.generated.ts');
const POSES = ['explica', 'piensa', 'acierto', 'pista', 'festejo', 'lamento'];
const BODY_W = 768;
const BODY_H = 1024;

const bots = require(path.join(root, 'src', 'data', 'bots.json')).bots.map((b) => b.id);

function fail(msg) {
  console.error('Error: ' + msg);
  process.exit(1);
}

async function main() {
  const files = (fs.existsSync(srcDir) ? fs.readdirSync(srcDir) : []).filter((f) => /\.(png|webp)$/i.test(f)).sort();
  if (!files.length) fail(`no hay imágenes en ${path.relative(root, srcDir)}. No se cambió nada.`);
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

  fs.rmSync(tmpDir, { recursive: true, force: true });
  fs.mkdirSync(tmpDir, { recursive: true });
  try {
    for (const id of Object.keys(map)) {
      for (const expression of Object.keys(map[id])) {
        await sharp(path.join(srcDir, map[id][expression]))
          .resize(SIZE, SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .webp({ quality: 80 })
          .toFile(path.join(tmpDir, `${id}-${expression}.webp`));
      }
    }
  } catch (e) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fail(`no se pudo convertir una imagen (${e.message}). No se cambió nada.`);
  }
  // Todas salieron bien: la carpeta nueva reemplaza a la vieja para que no queden caras viejas.
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.renameSync(tmpDir, outDir);

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

  // Cuerpos: las poses son opcionales. Si no hay originales, el mapa queda vacío y botBody usa el neutro.
  const bodyFiles = (fs.existsSync(bodySrcDir) ? fs.readdirSync(bodySrcDir) : []).filter((f) => /\.(png|webp)$/i.test(f)).sort();
  const bodyMap = {};
  for (const file of bodyFiles) {
    const m = /^([a-z]+)-([a-z]+)\.(png|webp)$/.exec(file);
    if (!m) fail(`el nombre «${file}» no sigue el formato <bot>-<pose>.png`);
    const [, id, pose] = m;
    if (!bots.includes(id)) fail(`«${file}»: no hay un bot «${id}» (bots: ${bots.join(', ')})`);
    if (!POSES.includes(pose)) fail(`«${file}»: la pose «${pose}» no existe (válidas: ${POSES.join(', ')})`);
    if (bodyMap[id]?.[pose]) fail(`«${file}»: ya hay otra imagen para ${id}-${pose} (png y webp a la vez)`);
    (bodyMap[id] ??= {})[pose] = file;
  }
  if (bodyFiles.length) {
    fs.rmSync(bodyTmpDir, { recursive: true, force: true });
    fs.mkdirSync(bodyTmpDir, { recursive: true });
    try {
      for (const id of Object.keys(bodyMap)) {
        for (const pose of Object.keys(bodyMap[id])) {
          await sharp(path.join(bodySrcDir, bodyMap[id][pose]))
            .resize(BODY_W, BODY_H, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .webp({ quality: 90 })
            .toFile(path.join(bodyTmpDir, `${id}-${pose}.webp`));
        }
      }
    } catch (e) {
      fs.rmSync(bodyTmpDir, { recursive: true, force: true });
      fail(`no se pudo convertir una pose de cuerpo (${e.message}). No se cambió nada.`);
    }
    // Reemplaza solo las poses; los cuerpos neutros (<id>.webp) no se tocan.
    fs.mkdirSync(bodyOutDir, { recursive: true });
    const poseRe = new RegExp(`^[a-z]+-(?:${POSES.join('|')})\\.webp$`);
    for (const f of fs.readdirSync(bodyOutDir)) {
      if (poseRe.test(f)) fs.rmSync(path.join(bodyOutDir, f), { force: true });
    }
    for (const f of fs.readdirSync(bodyTmpDir)) {
      fs.copyFileSync(path.join(bodyTmpDir, f), path.join(bodyOutDir, f));
    }
    fs.rmSync(bodyTmpDir, { recursive: true, force: true });
  }
  const bodyIds = Object.keys(bodyMap).sort();
  const bodyBody = bodyIds.length
    ? '{\n' +
      bodyIds
        .map((id) => {
          const items = POSES.filter((p) => bodyMap[id][p])
            .map((p) => `    ${p}: require('../../assets/bots/cuerpo/${id}-${p}.webp'),\n`)
            .join('');
          return `  ${id}: {\n${items}  },\n`;
        })
        .join('') +
      '}'
    : '{}';
  const bodyTs =
    '// ARCHIVO GENERADO por scripts/build-avatars.js. No editar a mano.\n' +
    "import type { ImageSourcePropType } from 'react-native';\n" +
    "import type { BotPose } from './botBody';\n\n" +
    `export const BOT_BODIES: Partial<Record<string, Partial<Record<BotPose, ImageSourcePropType>>>> = ${bodyBody};\n`;
  fs.writeFileSync(bodyMapFile, bodyTs);
  console.log(`${bodyFiles.length} poses de cuerpo → ${path.relative(root, bodyMapFile)}`);
}

main().catch((e) => fail(e.message));
