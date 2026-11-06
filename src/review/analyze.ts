import { Chess } from 'chess.js';
import type { UciEngine } from '../engine/uci';
import { isBad } from './types';
import type { ParsedGame, PositionEval, ReviewPly } from './types';

// Pasa por Stockfish todas las posiciones de la partida. Sin React Native (el motor se recibe de afuera).

export const REVIEW_DEPTH = 11;
/** Profundidad con la que se vuelven a mirar las jugadas malas, y cuántas como máximo (las más costosas primero). */
export const REFINE_DEPTH = 16;
export const REFINE_MAX = 16;

/** Evaluación de una posición terminada, sin preguntarle al motor. */
function terminal(fen: string): PositionEval | null {
  const c = new Chess(fen);
  if (c.isCheckmate()) return { score: c.turn() === 'w' ? -10000 : 10000, best: '' };
  if (c.isGameOver()) return { score: 0, best: '' };
  return null;
}

/** Evalúa una posición (la terminada se resuelve sin motor). `score` va desde las blancas. */
export async function evaluatePosition(engine: UciEngine, fen: string, depth = REVIEW_DEPTH): Promise<PositionEval> {
  const done = terminal(fen);
  if (done) return done;
  const r = await engine.search({ fen, multipv: 1, depth });
  const line = r.lines[0];
  const turn = fen.split(' ')[1];
  return { score: line ? (turn === 'w' ? line.score : -line.score) : 0, best: r.bestmove, pv: line?.pv?.slice(0, 8) ?? [] };
}

/**
 * Evalúa las n + 1 posiciones de la partida, de a una. `onProgress(hechas, total)` avisa el avance;
 * si `isCancelled()` da true corta y devuelve null (por ejemplo, al salir de la pantalla).
 */
export async function analyzeGame(
  engine: UciEngine,
  game: ParsedGame,
  onProgress: (done: number, total: number) => void,
  isCancelled: () => boolean,
  depth = REVIEW_DEPTH
): Promise<PositionEval[] | null> {
  const fens = [game.moves[0].fenBefore, ...game.moves.map((m) => m.fenAfter)];
  const out: PositionEval[] = [];
  for (let i = 0; i < fens.length; i++) {
    if (isCancelled()) return null;
    out.push(await evaluatePosition(engine, fens[i], depth));
    onProgress(i + 1, fens.length);
  }
  // La mejor jugada de la posición posterior a una jugada es la respuesta que el rival tiene a mano (build.ts).
  return out;
}

/** Índices (0 = primera jugada) de las jugadas malas que se vuelven a mirar a más profundidad, de mayor a menor pérdida y en orden de partida. */
export function refineCandidates(plies: ReviewPly[], max = REFINE_MAX): number[] {
  return plies
    .map((p, i) => ({ i, loss: p.loss, bad: isBad(p.quality) }))
    .filter((x) => x.bad)
    .sort((a, b) => b.loss - a.loss)
    .slice(0, max)
    .map((x) => x.i)
    .sort((a, b) => a - b);
}

/** Evaluación más profunda de la posición anterior y posterior a cada jugada revisada. */
export type Refined = Map<number, { before: PositionEval; after: PositionEval }>;

/**
 * Vuelve a evaluar, a más profundidad, las posiciones de las jugadas `candidates` (la de antes y la de después, una sola vez
 * cada una aunque dos jugadas la compartan). Cada jugada se califica con su par de evaluaciones profundas: mezclar
 * profundidades en una misma jugada inventaría pérdidas. `onProgress(hechas, total)` avisa el avance; con `isCancelled()` corta y devuelve null.
 */
export async function refineGame(
  engine: UciEngine,
  game: ParsedGame,
  candidates: number[],
  onProgress: (done: number, total: number) => void,
  isCancelled: () => boolean,
  depth = REFINE_DEPTH
): Promise<Refined | null> {
  const fens = [game.moves[0].fenBefore, ...game.moves.map((m) => m.fenAfter)];
  const cache = new Map<number, PositionEval>();
  const total = new Set(candidates.flatMap((i) => [i, i + 1])).size;
  const evaluate = async (index: number) => {
    const known = cache.get(index);
    if (known) return known;
    const e = await evaluatePosition(engine, fens[index], depth);
    cache.set(index, e);
    onProgress(cache.size, total);
    return e;
  };
  const out: Refined = new Map();
  for (const i of candidates) {
    if (isCancelled()) return null;
    const before = await evaluate(i);
    const after = await evaluate(i + 1);
    out.set(i, { before, after });
  }
  return out;
}
