import type { PlayerLevel } from './progressStore';

// Nivel de puzzles: Elo sencillo con el rating de Lichess del puzzle como rival. Módulo puro (pruebas en
// puzzleRating.test.ts). Spec: docs/superpowers/specs/2026-11-09-nivel-de-puzzles-design.md.

/**
 * `rated`: cuántos puzzles movieron el nivel. `at`: fecha ISO del último cambio. `pending`: puzzles que ya bajaron el
 * nivel por un fallo cobrado en el momento pero todavía no se terminaron (no vuelven a moverlo).
 */
export type PuzzleRating = { rating: number; rated: number; at: string | null; pending: string[] };

export const RATING_MIN = 400;
export const RATING_MAX = 3000;
export const MAX_PENDING = 500;
/** K alto al principio para que el nivel se acomode rápido. */
const K_START = 40;
const K_AFTER = 20;
const K_START_COUNT = 20;

const INITIAL: Record<PlayerLevel, number> = { nuevo: 800, basico: 1100, casual: 1400 };

export const initialRating = (level?: PlayerLevel): number => (level ? INITIAL[level] : 1000);

export function currentRating(p: { puzzleRating?: PuzzleRating; profile: { level?: PlayerLevel } }): number {
  return p.puzzleRating?.rating ?? initialRating(p.profile.level);
}

/** Cambio de nivel: `score` 1 si se resolvió sin errores ni pista, 0 si no. */
export function ratingDelta(rating: number, rated: number, puzzleRating: number, score: 0 | 1): number {
  const expected = 1 / (1 + 10 ** ((puzzleRating - rating) / 400));
  const k = rated < K_START_COUNT ? K_START : K_AFTER;
  return Math.round(k * (score - expected));
}

export function applyRating(state: PuzzleRating, puzzleRating: number, score: 0 | 1, now: Date): { state: PuzzleRating; delta: number } {
  const raw = state.rating + ratingDelta(state.rating, state.rated, puzzleRating, score);
  const rating = Math.min(RATING_MAX, Math.max(RATING_MIN, raw));
  return { state: { ...state, rating, rated: state.rated + 1, at: now.toISOString() }, delta: rating - state.rating };
}

/** «+8», «−18» (signo menos, no guion) o «0». */
export const formatDelta = (delta: number): string => (delta > 0 ? `+${delta}` : delta < 0 ? `−${-delta}` : '0');
