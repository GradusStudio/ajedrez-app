// Prepara las caras de los bots: `npm run build:avatars`
//   assets/fuente/expresiones/<id>-<expresion>.{png,webp}  (originales, cuadradas, fondo transparente)
//   → assets/bots/expresiones/<id>-<expresion>.webp (256 × 256, calidad 80)
//   → src/components/botExpressions.generated.ts (mapa que usa BotAvatar)
// Un nombre que no corresponda a un bot o a una expresión, o no tener imágenes, detiene el script sin tocar nada.
// Las imágenes se convierten en una carpeta temporal y reemplazan a las anteriores solo si todas salieron bien.
// Poses de cuerpo: `--bots=pipo,ramiro` limita la conversión a los bots aprobados; cada pose se alinea
// con el neutro por el centro de las botas y la línea de pies (scripts/bodyAlign.js).
/* global __dirname, process */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { bootStats, alignOffset, composeBox } = require('./bodyAlign.js');

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
// Solo estos bots (--bots=pipo,ramiro). Sin el flag se procesan todos los que tengan archivos.
const APPROVED = (process.argv.slice(2).find((a) => a.startsWith('--bots=')) || '')
  .replace('--bots=', '')
  .split(',')
  .filter(Boolean);

const bots = require(path.join(root, 'src', 'data', 'bots.json')).bots.map((b) => b.id);

function fail(msg) {
  console.error('Error: ' + msg);
  process.exit(1);
}

/** Canal alfa de una imagen o buffer. */
async function alphaOf(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const alpha = new Uint8Array(info.width * info.height);
  for (let i = 0; i < alpha.length; i++) alpha[i] = data[i * 4 + 3];
  return { alpha, width: info.width, height: info.height };
}

/** Convierte una pose a 768 × 1024 con las botas y los pies alineados con el neutro del bot. */
async function convertAligned(srcFile, id, outFile) {
  const poseBuf = await sharp(srcFile)
    .resize(BODY_W, BODY_H, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const neutralFile = path.join(bodyOutDir, `${id}.webp`);
  let dx = 0;
  let dy = 0;
  if (fs.existsSync(neutralFile)) {
    const pose = await alphaOf(poseBuf);
    const neutral = await alphaOf(neutralFile);
    ({ dx, dy } = alignOffset(
      bootStats(pose.alpha, pose.width, pose.height),
      bootStats(neutral.alpha, neutral.width, neutral.height),
    ));
  }
  const box = composeBox(BODY_W, BODY_H, dx, dy);
  const input =
    box.extractWidth === BODY_W && box.extractHeight === BODY_H
      ? poseBuf
      : await sharp(poseBuf)
          .extract({ left: box.extractLeft, top: box.extractTop, width: box.extractWidth, height: box.extractHeight })
          .png()
          .toBuffer();
  await sharp({ create: { width: BODY_W, height: BODY_H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input, left: box.left, top: box.top }])
    .webp({ quality: 90 })
    .toFile(outFile);
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
  // Solo las poses reales: ignora las hojas de contacto, los neutros de referencia y las variantes.
  const poseFile = new RegExp(`^([a-z]+)-(${POSES.join('|')})\\.(png|webp)$`, 'i');
  const bodyFiles = (fs.existsSync(bodySrcDir) ? fs.readdirSync(bodySrcDir) : []).filter((f) => poseFile.test(f)).sort();
  const bodyMap = {};
  for (const file of bodyFiles) {
    const [, id, pose] = poseFile.exec(file);
    if (!bots.includes(id)) fail(`«${file}»: no hay un bot «${id}» (bots: ${bots.join(', ')})`);
    if (APPROVED.length && !APPROVED.includes(id)) continue;
    if (bodyMap[id]?.[pose]) fail(`«${file}»: ya hay otra imagen para ${id}-${pose} (png y webp a la vez)`);
    (bodyMap[id] ??= {})[pose] = file;
  }
  if (Object.keys(bodyMap).length) {
    fs.rmSync(bodyTmpDir, { recursive: true, force: true });
    fs.mkdirSync(bodyTmpDir, { recursive: true });
    try {
      for (const id of Object.keys(bodyMap)) {
        for (const pose of Object.keys(bodyMap[id])) {
          await convertAligned(path.join(bodySrcDir, bodyMap[id][pose]), id, path.join(bodyTmpDir, `${id}-${pose}.webp`));
        }
      }
    } catch (e) {
      fs.rmSync(bodyTmpDir, { recursive: true, force: true });
      fail(`no se pudo convertir una pose de cuerpo (${e.message}). No se cambió nada.`);
    }
    // Reemplaza solo las poses de los bots procesados; los neutros y las poses de otros bots no se tocan.
    fs.mkdirSync(bodyOutDir, { recursive: true });
    const poseRe = new RegExp(`^(?:${Object.keys(bodyMap).join('|')})-(?:${POSES.join('|')})\\.webp$`);
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
  if (bodyIds.length) {
    fs.writeFileSync(bodyMapFile, bodyTs);
    console.log(`${bodyIds.length} bots con poses → ${path.relative(root, bodyMapFile)}`);
  }
}

main().catch((e) => fail(e.message));
