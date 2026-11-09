/** Ancho de la columna de la app: en pantallas anchas la web la centra con este máximo (WebColumn.web.tsx). */
export const COLUMN_MAX = 480;
const GUTTER = 16;

/** Lado del tablero en píxeles, múltiplo de 8: el ancho de la columna menos un margen de 16 px a cada lado. */
export function boardPixels(windowWidth: number): number {
  return Math.floor((Math.min(windowWidth, COLUMN_MAX) - GUTTER * 2) / 8) * 8;
}

/** Pantalla ancha (web, `useWideLayout`): ancho del panel de la derecha, separación y márgenes de los costados. */
export const WIDE_PANEL = 380;
export const WIDE_GAP = 32;
const WIDE_SIDES = 48;
const WIDE_MAX = 720;
const WIDE_MIN = 320;

/**
 * Lado del tablero con el panel al costado: el mayor que entre por alto (menos lo que ocupan encabezado y barras,
 * `reserveHeight`) y por ancho (menos panel, separación y márgenes), entre 320 y 720 px, múltiplo de 8.
 */
export function wideBoardPixels({ width, height, reserveHeight }: { width: number; height: number; reserveHeight: number }): number {
  const byHeight = height - reserveHeight;
  const byWidth = width - WIDE_PANEL - WIDE_GAP - WIDE_SIDES;
  const side = Math.max(WIDE_MIN, Math.min(WIDE_MAX, byHeight, byWidth));
  return Math.floor(side / 8) * 8;
}
