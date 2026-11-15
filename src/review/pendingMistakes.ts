import type { StoredReview } from './store';
import { turningPointKey, turningPoints, type TurningPoint } from './turningPoints';

// Errores pendientes de practicar (tarea 34, spec «Análisis», sección Datos): los puntos de giro que
// turningPoints.ts elige en cada revisión guardada, menos los que ya se practicaron en progress.turningPoints.
// Módulo puro y probado.

export type PendingMistakes = {
  /** Posiciones a practicar, de la revisión más reciente a la más vieja. */
  points: TurningPoint[];
  /** Bando del usuario en la primera revisión con puntos (orienta el tablero del quiz). */
  me: 'w' | 'b';
  /** Bot comentarista de esa revisión. */
  coachId: string;
};

/** Hasta cuántas posiciones lleva el quiz global (el de una sola partida usa 3). */
export const MAX_PENDING = 20;

/**
 * Posiciones pendientes de todas las revisiones guardadas. Cada revisión aporta hasta 3 (las que elige
 * `turningPoints`); se descartan las ya cobradas (`done`, las claves de `progress.turningPoints`) y se corta en
 * `max`. Devuelve null si no queda ninguna (la tarjeta «Aprende de tus errores» no se muestra).
 */
export function pendingMistakes(reviews: StoredReview[], done: string[], max = MAX_PENDING): PendingMistakes | null {
  const doneSet = new Set(done);
  const points: TurningPoint[] = [];
  let me: 'w' | 'b' | null = null;
  let coachId = '';
  for (const stored of reviews) {
    if (!stored.me) continue;
    const fresh = turningPoints(stored.review, stored.me).filter((tp) => !doneSet.has(turningPointKey(tp)));
    if (fresh.length === 0) continue;
    if (me === null) {
      me = stored.me;
      coachId = stored.coachId;
    }
    points.push(...fresh);
    if (points.length >= max) break;
  }
  if (me === null || points.length === 0) return null;
  return { points: points.slice(0, max), me, coachId };
}
