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

const QUALITIES = new Set(['book', 'best', 'excellent', 'good', 'inaccuracy', 'mistake', 'blunder']);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === 'string';

/** Cada jugada tiene todo lo que consumen la pantalla, el resumen, el gráfico y el quiz. */
function isStoredPly(p: unknown): boolean {
  if (typeof p !== 'object' || p === null) return false;
  const ply = p as Record<string, unknown>;
  const move = ply.move as Record<string, unknown> | null | undefined;
  const facts = ply.facts;
  return (
    isNum(ply.ply) &&
    Number.isInteger(ply.ply) &&
    typeof move === 'object' &&
    move !== null &&
    (move.color === 'w' || move.color === 'b') &&
    isStr(move.san) &&
    isStr(move.uci) &&
    isStr(move.fenBefore) &&
    isStr(move.fenAfter) &&
    isStr(ply.quality) &&
    QUALITIES.has(ply.quality) &&
    isNum(ply.loss) &&
    isNum(ply.cpLoss) &&
    isNum(ply.scoreAfter) &&
    typeof ply.great === 'boolean' &&
    typeof ply.highlight === 'boolean' &&
    isStr(ply.bestUci) &&
    isStr(ply.bestSan) &&
    isStr(ply.replyUci) &&
    isStr(ply.replySan) &&
    (ply.bestPv === undefined || (Array.isArray(ply.bestPv) && ply.bestPv.every(isStr))) &&
    typeof facts === 'object' &&
    facts !== null
  );
}

/** Valida lo leído del almacenamiento: un dato roto se descarta en vez de romper la pestaña. */
export function isStoredReview(value: unknown): value is StoredReview {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  const review = v.review as Record<string, unknown> | null | undefined;
  if (typeof review !== 'object' || review === null) return false;
  const game = review.game as Record<string, unknown> | null | undefined;
  const gameOk =
    typeof game === 'object' &&
    game !== null &&
    isStr(game.white) &&
    isStr(game.black) &&
    isStr(game.result) &&
    isStr(game.startFen) &&
    Array.isArray(game.moves);
  const accuracy = review.accuracy as Record<string, unknown> | null | undefined;
  const accuracyOk = typeof accuracy === 'object' && accuracy !== null && isNum(accuracy.w) && isNum(accuracy.b);
  const scores = review.scores;
  const scoresOk = Array.isArray(scores) && scores.every(isNum);
  const plies = review.plies;
  const pliesOk = Array.isArray(plies) && plies.every(isStoredPly);
  const highlights = review.highlights;
  const highlightsOk =
    Array.isArray(highlights) &&
    highlights.every((h) => isNum(h) && Number.isInteger(h) && h >= 0 && (!Array.isArray(plies) || h < plies.length));
  // La evaluación tiene una posición más que jugadas (inicial + después de cada una).
  const lengthsOk = scoresOk && Array.isArray(plies) && scores.length === plies.length + 1;
  return (
    typeof v.id === 'string' &&
    typeof v.savedAt === 'string' &&
    (v.me === null || v.me === 'w' || v.me === 'b') &&
    typeof v.coachId === 'string' &&
    gameOk &&
    accuracyOk &&
    scoresOk &&
    pliesOk &&
    highlightsOk &&
    lengthsOk
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
