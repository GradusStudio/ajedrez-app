import { Chess } from 'chess.js';

/** Jugadas UCI (`e2e4`, `e7e8q`) de una partida ya jugada. */
export function uciMoves(chess: Chess): string[] {
  return chess.history({ verbose: true }).map((m) => m.from + m.to + (m.promotion ?? ''));
}

/**
 * Rearma una partida guardada jugando sus jugadas desde el inicio. Devuelve null si alguna es ilegal o si la
 * partida ya estaba terminada: una partida guardada así no se puede continuar y hay que descartarla.
 */
export function replayMoves(moves: string[]): Chess | null {
  const chess = new Chess();
  try {
    for (const m of moves) chess.move({ from: m.slice(0, 2), to: m.slice(2, 4), promotion: m[4] });
  } catch {
    return null;
  }
  return chess.isGameOver() ? null : chess;
}
