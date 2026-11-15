import type { MessageKey } from '../../i18n/I18nContext';
import type { LineMove } from '../../review/bestLine';
import type { GameMove, ReviewPly } from '../../review/types';

/** Filtro del botón principal: todas las jugadas o solo las destacadas. */
export type PlaybackFilter = 'all' | 'highlights';

/** Una jugada de la variante propia; `rated` es null mientras el motor no la califica. */
export type BranchMove = { id: number; move: GameMove; rated: ReviewPly | null };

/** Jugadas propias sobre una posición de la partida (`from` = jugada desde la que se desvió). */
export type Branch = { from: number; moves: BranchMove[] };

/** La línea del motor reproducida sobre el tablero desde `baseFen`; `step` = jugadas ya hechas. */
export type Preview = { baseFen: string; moves: LineMove[]; step: number };

export type NextState = {
  preview: boolean;
  branch: boolean;
  /** Destino de la cámara rápida; `null` si no hay ninguna en curso. */
  ffTarget: number | null;
  idx: number;
  n: number;
  filter: PlaybackFilter;
  /** Índice 0-based en `highlights` de la próxima destacada, o undefined si no queda ninguna. */
  nextHighlight: number | undefined;
};

export type NextAction =
  | { type: 'stopPreview'; label: MessageKey }
  | { type: 'leaveBranch'; label: MessageKey }
  | { type: 'goTo'; target: number; label: MessageKey }
  | { type: 'finish'; label: MessageKey }
  | { type: 'fastForward'; target: number; label: MessageKey };

const momentLabel: MessageKey = 'review.nextMoment';

/**
 * Qué hace el botón principal («Siguiente momento clave») en cada estado y qué debe decir su etiqueta. Función pura:
 * la pantalla y el hook usan la misma decisión. Cierra la línea, vuelve de la variante, salta la cámara rápida, avanza
 * una jugada, salta a la próxima destacada o termina la revisión.
 */
export function nextAction(s: NextState): NextAction {
  if (s.preview) return { type: 'stopPreview', label: 'review.stopLine' };
  if (s.branch) return { type: 'leaveBranch', label: 'review.leaveBranch' };
  if (s.ffTarget !== null && s.idx < s.ffTarget) return { type: 'goTo', target: s.ffTarget, label: momentLabel };
  if (s.idx >= s.n) return { type: 'finish', label: 'review.finish' };
  if (s.filter === 'all') return { type: 'goTo', target: Math.min(s.n, s.idx + 1), label: 'review.ctrlNext' };
  if (s.nextHighlight === undefined) return { type: 'finish', label: 'review.finish' };
  const target = s.nextHighlight + 1;
  return target - s.idx > 1 ? { type: 'fastForward', target, label: momentLabel } : { type: 'goTo', target, label: momentLabel };
}
