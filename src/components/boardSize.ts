/** Ancho de la columna de la app: en pantallas anchas la web la centra con este máximo (WebColumn.web.tsx). */
export const COLUMN_MAX = 480;
const GUTTER = 16;

/** Lado del tablero en píxeles, múltiplo de 8: el ancho de la columna menos un margen de 16 px a cada lado. */
export function boardPixels(windowWidth: number): number {
  return Math.floor((Math.min(windowWidth, COLUMN_MAX) - GUTTER * 2) / 8) * 8;
}
