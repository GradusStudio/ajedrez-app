import { space } from '../theme';
import { WIDE_LIST_COLUMN } from './wideLayout';

/** Columna derecha de Aprender y separación con la ruta. */
export const HOME_PANEL = 280;
export const HOME_GAP = space.xl;
export const HOME_MIN_ROUTE = 480;
/** Espacio reservado a la derecha para la barra de desplazamiento de la ruta. */
export const HOME_SCROLLBAR = 20;

export type HomeColumns = { route: number; panel: number; gap: number; total: number };

/** Anchos de la ruta y del panel de Aprender para el contenido disponible; null si no entra. */
export function homeWideColumns(contentWidth: number): HomeColumns | null {
  const route = Math.min(WIDE_LIST_COLUMN, contentWidth - HOME_SCROLLBAR - HOME_PANEL - HOME_GAP);
  if (route < HOME_MIN_ROUTE) return null;
  return { route, panel: HOME_PANEL, gap: HOME_GAP, total: route + HOME_GAP + HOME_PANEL };
}
