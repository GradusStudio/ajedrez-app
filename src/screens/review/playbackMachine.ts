/** Filtro del botón principal: todas las jugadas o solo las destacadas. */
export type PlaybackFilter = 'all' | 'highlights';

export type NextState = {
  preview: boolean;
  branch: boolean;
  fast: boolean;
  ffTarget: number | null;
  idx: number;
  n: number;
  filter: PlaybackFilter;
  /** Índice de ply (1-based) de la próxima destacada, o undefined si no queda ninguna. */
  nextHighlight: number | undefined;
};

export type NextAction =
  | { type: 'stopPreview' }
  | { type: 'leaveBranch' }
  | { type: 'goTo'; target: number }
  | { type: 'finish' }
  | { type: 'fastForward'; target: number };

/**
 * Qué hace el botón principal («Siguiente momento clave») en cada estado: cierra la línea, abandona la variante,
 * salta la cámara rápida, avanza una jugada, salta a la próxima destacada o termina la revisión. Función pura.
 */
export function nextAction(s: NextState): NextAction {
  if (s.preview) return { type: 'stopPreview' };
  if (s.branch) return { type: 'leaveBranch' };
  if (s.fast && s.ffTarget !== null) return { type: 'goTo', target: s.ffTarget };
  if (s.idx >= s.n) return { type: 'finish' };
  if (s.filter === 'all') return { type: 'goTo', target: Math.min(s.n, s.idx + 1) };
  if (s.nextHighlight === undefined) return { type: 'finish' };
  const target = s.nextHighlight + 1;
  return target - s.idx > 1 ? { type: 'fastForward', target } : { type: 'goTo', target };
}
