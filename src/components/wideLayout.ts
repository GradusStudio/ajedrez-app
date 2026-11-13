// Pantalla ancha de la web (docs/superpowers/specs/2026-11-08-web-pantalla-ancha-design.md). Sin React Native: se puede probar.

/** Desde este ancho de ventana la web pasa a barra lateral y tablero con panel al costado. */
export const WIDE_MIN_WIDTH = 960;
/** Por debajo de este ancho, la barra lateral muestra solo los íconos, para dejarle lugar al tablero. */
export const SIDEBAR_LABELS_MIN_WIDTH = 1200;
/** Ancho de la barra lateral con etiquetas y solo con íconos (WideSidebar). */
export const SIDEBAR_WIDTH = 232;
export const SIDEBAR_ICON_WIDTH = 76;

/** Ancho disponible para el contenido de una pestaña, descontada la barra lateral. */
export function wideContentWidth(windowWidth: number): number {
  return windowWidth - (windowWidth >= SIDEBAR_LABELS_MIN_WIDTH ? SIDEBAR_WIDTH : SIDEBAR_ICON_WIDTH);
}

/** Columna de las pantallas de lista en pantalla ancha (en el celular ocupan todo el ancho). */
export const WIDE_LIST_COLUMN = 640;
/** Columna de las pantallas con grillas (Créditos, Piezas, Tableros e historial de bots) en pantalla ancha. */
export const WIDE_GRID_COLUMN = 960;

export const isWideWidth = (width: number) => width >= WIDE_MIN_WIDTH;
