import { Chess } from 'chess.js';
import type { UciEngine } from '../engine/uci';
import type { ParsedGame, PositionEval } from './types';

// Pasa por Stockfish todas las posiciones de la partida. Sin React Native (el motor se recibe de afuera).

export const REVIEW_DEPTH = 11;

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
  return { score: line ? (turn === 'w' ? line.score : -line.score) : 0, best: r.bestmove };
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
