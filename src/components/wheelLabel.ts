// Corte del nombre de una unidad para el gajo de la corona. Sin React Native.
// Anchos medidos con Chrome (canvas measureText) sobre Nunito ExtraBold a 100 px. Sumar glifos sobreestima hasta un
// 3,2 % y subestima hasta un 1,5 % respecto del ancho real (kerning); el margen del 2 % cubre la subestimación.

/** Largo útil del texto sobre el eje del gajo: R − RIN − 26 = 112 px. */
export const WHEEL_TEXT_WIDTH = 112;
/** Tamaño mínimo: si el nombre no entra en dos renglones, se achica hasta acá. */
export const MIN_WHEEL_FONT = 12;

const GLYPH: Record<string, number> = {
  ' ': 27.9,
  '-': 44.0,
  '.': 26.0,
  A: 75.3,
  B: 69.5,
  C: 68.4,
  D: 77.4,
  E: 60.5,
  F: 57.0,
  G: 74.2,
  H: 78.0,
  I: 29.7,
  K: 68.8,
  L: 57.3,
  M: 87.6,
  N: 75.3,
  O: 79.6,
  P: 66.4,
  Q: 79.6,
  R: 69.6,
  S: 64.1,
  T: 63.2,
  V: 72.7,
  W: 112.0,
  a: 55.7,
  b: 61.0,
  c: 47.8,
  d: 61.0,
  e: 54.9,
  f: 38.2,
  g: 61.5,
  h: 59.5,
  i: 26.8,
  j: 27.3,
  k: 55.8,
  l: 33.3,
  m: 88.9,
  n: 59.5,
  o: 58.9,
  p: 61.0,
  q: 61.0,
  r: 41.2,
  s: 49.2,
  t: 40.4,
  u: 59.0,
  v: 53.4,
  w: 86.1,
  y: 53.3,
  z: 48.0,
  É: 60.5,
  á: 55.7,
  ä: 55.7,
  ç: 47.8,
  è: 54.9,
  é: 54.9,
  ó: 58.9,
  ö: 58.9,
  ü: 59.0,
};
/** Un carácter que no está en la tabla (otro idioma, una unidad nueva): ancho medio-alto para no quedarse corto. */
const DEFAULT_GLYPH = 62;
const SAFETY = 1.02;

/** Ancho estimado de un texto con Nunito ExtraBold, con el margen de seguridad. */
export function estimateTextWidth(text: string, size: number): number {
  let w = 0;
  for (const c of text) w += GLYPH[c] ?? DEFAULT_GLYPH;
  return (w * size * SAFETY) / 100;
}

/**
 * Parte un nombre por palabras en uno o dos renglones que entren en el largo útil del gajo. Si no entra, achica la
 * letra de medio punto en medio punto hasta 12 px. Devuelve `lines: []` para un nombre vacío.
 */
export function fitWheelLabel(name: string, size: number, maxLines = 2, maxWidth = WHEEL_TEXT_WIDTH): { lines: string[]; size: number } {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return { lines: [], size };
  for (let s = size; s >= MIN_WHEEL_FONT; s -= 0.5) {
    const lines = [''];
    for (const w of words) {
      const cur = lines[lines.length - 1];
      const next = cur ? `${cur} ${w}` : w;
      if (estimateTextWidth(next, s) <= maxWidth || !cur) lines[lines.length - 1] = next;
      else lines.push(w);
    }
    if (lines.length <= maxLines && lines.every((l) => estimateTextWidth(l, s) <= maxWidth)) return { lines, size: s };
  }
  // Ni al mínimo entra (una palabra más larga que el gajo): se deja el nombre entero, como el prototipo.
  return { lines: [name.trim()], size: MIN_WHEEL_FONT };
}
