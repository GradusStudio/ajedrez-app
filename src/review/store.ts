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
  // Las cabeceras Event, Site y Date cambian entre el PGN en vivo y el de la partida guardada de la misma partida
  // (la primera no las trae); no la identifican, así que no entran en el hash.
  const normalized = pgn.replace(/^\[(?:Event|Site|Date)\s+"[^"]*"\][ \t]*\r?\n?/gm, '');
  let hash = 2166136261;
  for (let i = 0; i < normalized.length; i++) {
    hash ^= normalized.charCodeAt(i);
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
  if (typeof review !== 'object' || review === null) return false;
  const scores = review.scores;
  const scoresOk = Array.isArray(scores) && scores.every((n) => typeof n === 'number' && Number.isFinite(n));
  // Cada jugada tiene lo que usan el resumen, el quiz y los errores pendientes.
  const pliesOk =
    Array.isArray(review.plies) &&
    review.plies.every((p) => {
      if (typeof p !== 'object' || p === null) return false;
      const ply = p as Record<string, unknown>;
      const move = ply.move as Record<string, unknown> | null | undefined;
      return typeof ply.ply === 'number' && typeof move === 'object' && move !== null && typeof move.color === 'string' && typeof ply.bestUci === 'string';
    });
  return (
    typeof v.id === 'string' &&
    typeof v.savedAt === 'string' &&
    (v.me === null || v.me === 'w' || v.me === 'b') &&
    typeof v.coachId === 'string' &&
    scoresOk &&
    pliesOk
  );
}

/**
 * La revisión guardada de una partida, por cualquiera de sus ids: el de la partida de bot (`bot:<playedAt>`) o el
 * hash de su PGN (cuando se revisó desde la capa del resultado, que no conoce el id de la partida).
 */
export function findReview(list: StoredReview[], ...ids: string[]): StoredReview | undefined {
  for (const id of ids) {
    const found = list.find((r) => r.id === id);
    if (found) return found;
  }
  return undefined;
}
