import type { Review } from './types';

// Revisiones guardadas en el dispositivo (tarea 34, spec «Análisis», sección Datos). Se guardan las últimas 10
// aparte del progreso porque pesan: no se sincronizan. Módulo puro y probado; el guardado va en reviewStore.ts.

/** Una revisión guardada: la partida analizada y de quién era el bando, para los errores pendientes. */
export type StoredReview = {
  /** Id de la partida: `bot:<playedAt>` (partidas de bots) o `pgn:<hash>` (importadas). */
  id: string;
  /** Fecha ISO en que se guardó. */
  savedAt: string;
  /** Bando del usuario, si se conoce (sin él no hay errores pendientes que ofrecer). */
  me: 'w' | 'b' | null;
  /** Bot comentarista elegido en la revisión (lo usa el quiz de puntos de giro). */
  coachId: string;
  review: Review;
};

export const MAX_REVIEWS = 10;

/** Identificador corto y estable de una partida importada, a partir de su PGN. */
export function reviewId(pgn: string): string {
  let hash = 2166136261;
  for (let i = 0; i < pgn.length; i++) {
    hash ^= pgn.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `pgn:${(hash >>> 0).toString(36)}`;
}

/** La lista con `next` al frente, sin duplicar su id y con el tope de la spec (descarta la más vieja). */
export function trimReviews(list: StoredReview[], next: StoredReview, max = MAX_REVIEWS): StoredReview[] {
  return [next, ...list.filter((r) => r.id !== next.id)].slice(0, max);
}

/** Valida lo leído del almacenamiento: un dato roto se descarta en vez de romper la pestaña. */
export function isStoredReview(value: unknown): value is StoredReview {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  const review = v.review as Record<string, unknown> | null | undefined;
  return (
    typeof v.id === 'string' &&
    typeof v.savedAt === 'string' &&
    (v.me === null || v.me === 'w' || v.me === 'b') &&
    typeof v.coachId === 'string' &&
    typeof review === 'object' &&
    review !== null &&
    Array.isArray((review as Record<string, unknown>).plies)
  );
}
