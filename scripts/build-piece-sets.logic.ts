// Lógica pura de `scripts/build-piece-sets.ts`: no usa sharp ni potrace, así que se prueba sola.
// Separa las 12 piezas de una hoja (fila blanca arriba, negra abajo), rellena los huecos de la tinta
// para obtener la silueta y encaja cada pieza en el viewBox 0 0 100 100 del Clásico.

export type PieceType = 'k' | 'q' | 'r' | 'b' | 'n' | 'p';
export type PieceKey =
  | 'wk' | 'wq' | 'wb' | 'wn' | 'wr' | 'wp'
  | 'bk' | 'bq' | 'bb' | 'bn' | 'br' | 'bp';

/** Orden de las piezas en las hojas de ChatGPT (spec 2026-11-15-piezas-con-chatgpt-design.md). */
export const PIECE_ORDER: PieceType[] = ['k', 'q', 'r', 'b', 'n', 'p'];

/**
 * Alto de cada silueta del Clásico, medido renderizando su path con sharp (unidades del viewBox).
 * El script escala cada pieza nueva a esta altura para que el tablero no salte al cambiar de set.
 */
export const TARGET_HEIGHTS: Record<PieceType, number> = { k: 93.9, q: 88.9, r: 79.9, b: 88.1, n: 86.7, p: 76.7 };

/** Línea de base del Clásico (todas las piezas apoyan en y = 97) y eje de simetría. */
export const BASELINE = 97;
export const CENTER_X = 50;
/** Ancho máximo del viewBox que puede ocupar una pieza (margen de 2 por lado). */
export const MAX_WIDTH = 96;
/** Resolución con la que se traza: 10 px por unidad, así potrace divide por 10 y no hay que reescalar curvas. */
export const PX_PER_UNIT = 10;
export const SHEET_PX = 100 * PX_PER_UNIT;

export type Box = { x0: number; y0: number; x1: number; y1: number };
export type Placement = { left: number; top: number; width: number; height: number };

/** Cajas (en píxeles inclusivos) de las 12 piezas: primero las 6 blancas y después las 6 negras. */
export type SheetBoxes = { white: Box[]; black: Box[] };

/** Dónde y con qué tamaño se compone cada pieza en el lienzo de 1000 × 1000 px que se pasa a potrace. */
export function placementFor(type: PieceType, cropW: number, cropH: number): Placement {
  if (!(cropW > 0) || !(cropH > 0)) throw new Error('la pieza no tiene píxeles');
  const targetH = TARGET_HEIGHTS[type] * PX_PER_UNIT;
  let width = (cropW * targetH) / cropH;
  let height = targetH;
  const maxW = MAX_WIDTH * PX_PER_UNIT;
  if (width > maxW) {
    width = maxW;
    height = (cropH * maxW) / cropW;
  }
  const w = Math.round(width);
  const h = Math.round(height);
  return {
    left: Math.round(CENTER_X * PX_PER_UNIT - w / 2),
    top: Math.round(BASELINE * PX_PER_UNIT - h),
    width: w,
    height: h,
  };
}

/** Bandas contiguas de filas o columnas con tinta; ignora motas de menos del 0,2 % del máximo. */
function bands(counts: number[]): { from: number; to: number }[] {
  const max = counts.reduce((m, c) => Math.max(m, c), 0);
  const min = Math.max(1, Math.floor(max * 0.002));
  const out: { from: number; to: number }[] = [];
  let from = -1;
  for (let i = 0; i <= counts.length; i++) {
    const on = i < counts.length && counts[i] > min;
    if (on && from < 0) from = i;
    if (!on && from >= 0) {
      out.push({ from, to: i - 1 });
      from = -1;
    }
  }
  return out;
}

/** Se queda con las `count` bandas más grandes (las piezas) y las devuelve en orden de posición. */
function pickMain(list: { from: number; to: number }[], count: number, what: string) {
  if (list.length < count) throw new Error(`se esperaban ${count} ${what} y aparecieron ${list.length}`);
  return [...list]
    .sort((a, b) => b.to - b.from - (a.to - a.from))
    .slice(0, count)
    .sort((a, b) => a.from - b.from);
}

/**
 * Separa las piezas de la hoja por proyecciones de la tinta: dos filas y seis columnas por fila.
 * `ink[i]` vale 1 en los píxeles oscuros (contorno, detalles o pieza negra) y 0 en el fondo blanco.
 * Si la hoja trae marcos o sombras de borde se descartan: cuentan las dos filas más altas y las seis columnas más anchas.
 */
export function splitSheet(ink: Uint8Array, width: number, height: number): SheetBoxes {
  if (ink.length !== width * height) throw new Error('la máscara no coincide con el tamaño de la hoja');
  const rowCounts = new Array<number>(height).fill(0);
  for (let y = 0; y < height; y++) {
    let n = 0;
    for (let x = 0; x < width; x++) n += ink[y * width + x];
    rowCounts[y] = n;
  }
  const rows = pickMain(bands(rowCounts), 2, 'filas de piezas');
  const boxes: SheetBoxes = { white: [], black: [] };
  rows.forEach((row, r) => {
    const colCounts = new Array<number>(width).fill(0);
    for (let y = row.from; y <= row.to; y++) {
      for (let x = 0; x < width; x++) colCounts[x] += ink[y * width + x];
    }
    const cols = pickMain(bands(colCounts), 6, `columnas en la fila ${r + 1}`);
    for (const col of cols) {
      let y0 = row.to;
      let y1 = row.from;
      for (let y = row.from; y <= row.to; y++) {
        for (let x = col.from; x <= col.to; x++) {
          if (!ink[y * width + x]) continue;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
      if (y0 > y1) throw new Error(`la fila ${r + 1} tiene una columna vacía`);
      (r === 0 ? boxes.white : boxes.black).push({ x0: col.from, y0, x1: col.to, y1 });
    }
  });
  return boxes;
}

/** Rellena los huecos interiores de una máscara (inunda desde el borde y marca lo que no se alcanzó). */
export function fillHoles(mask: Uint8Array, width: number, height: number): Uint8Array {
  if (mask.length !== width * height) throw new Error('la máscara no coincide con el tamaño');
  const outside = new Uint8Array(width * height);
  const stack: number[] = [];
  const visit = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const i = y * width + x;
    if (outside[i] || mask[i]) return;
    outside[i] = 1;
    stack.push(i);
  };
  for (let x = 0; x < width; x++) {
    visit(x, 0);
    visit(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    visit(0, y);
    visit(width - 1, y);
  }
  while (stack.length) {
    const i = stack.pop() as number;
    const x = i % width;
    const y = (i - x) / width;
    visit(x - 1, y);
    visit(x + 1, y);
    visit(x, y - 1);
    visit(x, y + 1);
  }
  const out = new Uint8Array(mask);
  for (let i = 0; i < out.length; i++) if (!mask[i] && !outside[i]) out[i] = 1;
  return out;
}

/** Escala todos los números de un path de potrace (coordenadas absolutas en píxeles del lienzo). */
export function scalePathNumbers(d: string, factor: number): string {
  return d.replace(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi, (token) => {
    const value = Number((Number(token) * factor).toFixed(3));
    return String(value === 0 ? 0 : value);
  });
}

/** Extrae el `d` del SVG que devuelve potrace. */
export function pathFromSvg(svg: string): string {
  const m = /<path[^>]*\sd="([^"]+)"/i.exec(svg);
  if (!m) throw new Error('potrace no devolvió un path');
  return m[1];
}
