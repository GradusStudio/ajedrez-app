// Vectoriza las hojas de piezas aprobadas: `npm run build:pieces`
//   assets/fuente/piezas/<set>.png   (una hoja por set: fila blanca arriba, fila negra abajo,
//                                     seis piezas en el orden rey, dama, torre, alfil, caballo, peón)
//   → src/pieces/pieceSets.ts        (regenerado: siluetas e tintas de los sets nuevos)
//
// Cada pieza se separa por los huecos blancos, se traza con potrace y se encaja en el viewBox
// 0 0 100 100 con la altura y la línea de base del Clásico (TARGET_HEIGHTS y BASELINE de la lógica).
// Los sets que no tienen hoja se conservan tal cual: este script nunca borra un trazado existente.
// Si una hoja falla, no se escribe nada (se genera en memoria y se reemplaza al final).
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { trace } from 'potrace';
import { PIECE_PATHS, PIECE_SET_META, type PieceKey } from '../src/pieces/pieceSets';
import {
  PIECE_ORDER,
  PX_PER_UNIT,
  SHEET_PX,
  fillHoles,
  pathFromSvg,
  placementFor,
  scalePathNumbers,
  splitSheet,
  type Box,
  type PieceType,
} from './build-piece-sets.logic';

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'assets', 'fuente', 'piezas');
const OUT = path.join(ROOT, 'src', 'pieces', 'pieceSets.ts');
const TMP = OUT + '.tmp';

/** Hojas aprobadas: id del set → archivo. Hielo, Clásico, Gótico y Contorneado no se tocan. */
const SHEETS = {
  minimalista: 'geometrico.png',
  redondeado: 'juguete.png',
  madera: 'madera.png',
  marmol: 'marmol.png',
  magma: 'magma.png',
} as const;
type SheetSet = keyof typeof SHEETS;

/** Luminancia por debajo de este valor se considera tinta (contorno, detalle o pieza negra). */
const INK_THRESHOLD = 160;

type Paths = { sil: string; ink: string };
type PathMap = Record<string, Record<PieceKey, Paths>>;

const fail = (msg: string): never => {
  console.error('Error: ' + msg);
  process.exit(1);
};

async function loadInk(file: string) {
  const { data, info } = await sharp(file)
    .flatten({ background: '#ffffff' })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const ink = new Uint8Array(info.width * info.height);
  for (let i = 0; i < ink.length; i++) ink[i] = data[i] < INK_THRESHOLD ? 1 : 0;
  return { ink, width: info.width, height: info.height };
}

function crop(mask: Uint8Array, sheetW: number, box: Box) {
  const w = box.x1 - box.x0 + 1;
  const h = box.y1 - box.y0 + 1;
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) out[y * w + x] = mask[(box.y0 + y) * sheetW + box.x0 + x];
  }
  return { mask: out, width: w, height: h };
}

/** Compone la máscara en el lienzo de 1000 px (blanco y negro) y la traza con potrace. */
async function traceMask(mask: Uint8Array, w: number, h: number, type: PieceType): Promise<string> {
  const place = placementFor(type, w, h);
  const raw = Buffer.alloc(w * h);
  for (let i = 0; i < raw.length; i++) raw[i] = mask[i] ? 0 : 255;
  const piece = await sharp(raw, { raw: { width: w, height: h, channels: 1 } })
    .resize(place.width, place.height, { kernel: 'nearest' })
    .png()
    .toBuffer();
  const canvas = await sharp({
    create: { width: SHEET_PX, height: SHEET_PX, channels: 3, background: '#ffffff' },
  })
    .composite([{ input: piece, left: place.left, top: place.top }])
    .png()
    .toBuffer();
  const svg = await new Promise<string>((resolve, reject) => {
    trace(canvas, { threshold: 128, turdSize: 2, optCurve: true, optTolerance: 0.2, blackOnWhite: true }, (err, svgOut) =>
      err ? reject(err) : resolve(svgOut),
    );
  });
  return scalePathNumbers(pathFromSvg(svg), 1 / PX_PER_UNIT);
}

async function readSheet(set: SheetSet, file: string): Promise<Record<PieceKey, Paths>> {
  const { ink, width, height } = await loadInk(file);
  const boxes = splitSheet(ink, width, height);
  const out = {} as Record<PieceKey, Paths>;
  for (const [color, list] of [['w', boxes.white], ['b', boxes.black]] as const) {
    for (let i = 0; i < PIECE_ORDER.length; i++) {
      const type = PIECE_ORDER[i];
      const box = list[i];
      if (!box) throw new Error(`${set}: falta la pieza ${i + 1} de la fila ${color === 'w' ? 'blanca' : 'negra'}`);
      const piece = crop(ink, width, box);
      const sil = fillHoles(piece.mask, piece.width, piece.height);
      const key = `${color}${type}` as PieceKey;
      out[key] = {
        sil: await traceMask(sil, piece.width, piece.height, type),
        ink: await traceMask(piece.mask, piece.width, piece.height, type),
      };
    }
  }
  return out;
}

function buildModule(paths: PathMap) {
  const header =
    '// GENERADO por scripts/build-piece-sets.ts: trazado vectorial de los sets de piezas (viewBox 0 0 100 100).\n' +
    '// `sil` = silueta (se rellena con la textura o de blanco); `ink` = tinta (contornos, detalles y piezas negras).\n' +
    '// Ambos usan fillRule="evenodd". No editar a mano: `npm run build:pieces`.\n\n';
  const types =
    "export type PieceSetId = 'clasico' | 'minimalista' | 'gotico' | 'redondeado' | 'contorneado';\n" +
    "export type MaterialPathSetId = 'madera' | 'marmol' | 'magma';\n" +
    'export type PathSetId = PieceSetId | MaterialPathSetId;\n' +
    "export type PieceKey = 'wk' | 'wq' | 'wb' | 'wn' | 'wr' | 'wp' | 'bk' | 'bq' | 'bb' | 'bn' | 'br' | 'bp';\n" +
    'export type PiecePaths = { sil: string; ink: string };\n\n' +
    "export const DEFAULT_PIECE_SET: PieceSetId = 'clasico';\n\n";
  const meta =
    'export const PIECE_SET_META: { id: PieceSetId; name: string; description: string }[] = ' +
    JSON.stringify(PIECE_SET_META, null, 2) +
    ';\n\n';
  const map = 'export const PIECE_PATHS: Record<PathSetId, Record<PieceKey, PiecePaths>> = ' + JSON.stringify(paths) + ';\n';
  return header + types + meta + map;
}

async function main() {
  const files = (fs.existsSync(SRC) ? fs.readdirSync(SRC) : []).filter((f) => /\.(png|webp)$/i.test(f));
  const pending = (Object.keys(SHEETS) as SheetSet[]).filter((set) => files.includes(SHEETS[set]));
  if (!pending.length)
    fail(`no hay hojas en ${path.relative(ROOT, SRC)} (se esperaban ${Object.values(SHEETS).join(', ')}). No se cambió nada.`);

  const current = PIECE_PATHS as unknown as PathMap;
  const paths: PathMap = { ...current };
  for (const set of pending) {
    const file = SHEETS[set];
    try {
      paths[set] = await readSheet(set, path.join(SRC, file));
      console.log(`${set}: 12 piezas trazadas`);
    } catch (e) {
      fail(`${file}: ${(e as Error).message}. No se cambió nada.`);
    }
  }

  fs.writeFileSync(TMP, buildModule(paths));
  fs.renameSync(TMP, OUT);
  console.log(`${pending.length} sets → ${path.relative(ROOT, OUT)}`);
}

main().catch((e) => fail((e as Error).message));
