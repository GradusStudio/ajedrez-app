// La línea del motor y el texto de las jugadas que la pantalla puede mostrar y reproducir. Sin React Native.
import { Chess, type Square } from 'chess.js';
import type { ReviewPly } from './types';

export type LineMove = { san: string; uci: string; color: 'w' | 'b'; fenAfter: string };

/** Cuántas jugadas de la variante se muestran como máximo. */
export const LINE_PLIES = 6;

/** Reproduce la variante desde `fen`; se detiene en la primera jugada ilegal. Con menos de 2 jugadas no hay línea que mostrar. */
export function lineMoves(fen: string, pv: string[] | undefined, max = LINE_PLIES): LineMove[] {
  if (!pv || pv.length === 0) return [];
  const out: LineMove[] = [];
  try {
    const game = new Chess(fen);
    for (const uci of pv.slice(0, max)) {
      const m = game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.slice(4, 5) || undefined });
      out.push({ san: m.san, uci, color: m.color, fenAfter: game.fen() });
    }
  } catch {
    // Una jugada ilegal corta la línea: se queda con lo que sí se pudo reproducir.
  }
  return out.length >= 2 ? out : [];
}

/** Número de jugada que corresponde a la posición, según el FEN; 1 si no se puede leer. */
export function moveNumber(fen: string): number {
  const n = Number(fen.split(' ')[5]);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/** El número con su separador («7.» con blancas, «7...» con negras), leído del FEN de la posición. */
export function movePrefix(move: { color: 'w' | 'b'; fenBefore: string }): string {
  const n = moveNumber(move.fenBefore);
  return move.color === 'w' ? `${n}.` : `${n}...`;
}

/** La jugada con su número («7.Cg5» o «7...d5»), como en el resumen y las pruebas. */
export function plyLabel(move: { san: string; color: 'w' | 'b'; fenBefore: string }, fmt: (san: string) => string): string {
  return `${movePrefix(move)}${fmt(move.san)}`;
}

/** Jugadas completas que muestra el resumen: el número de la última, contado desde el FEN inicial. */
export function fullMoves(plies: ReviewPly[]): number {
  const last = plies[plies.length - 1];
  return last ? moveNumber(last.move.fenBefore) : 0;
}

/** Las casillas de una jugada UCI (`e2e4`, `e7e8q`), o null si el texto no es una jugada UCI válida. */
export function uciSquares(uci: unknown): { from: Square; to: Square } | null {
  if (typeof uci !== 'string') return null;
  const m = /^([a-h][1-8])([a-h][1-8])([qrbn])?$/.exec(uci);
  // Una jugada no puede empezar y terminar en la misma casilla.
  if (!m || m[1] === m[2]) return null;
  return { from: m[1] as Square, to: m[2] as Square };
}

/**
 * La línea como texto con números de jugada: «7. Cg5 d5 8. exd5 Ca5» o «7... d5 8. exd5».
 * `fmt` pasa cada jugada de notación inglesa a la del usuario.
 */
export function lineText(fen: string, moves: LineMove[], fmt: (san: string) => string): string {
  let number = moveNumber(fen);
  const parts: string[] = [];
  moves.forEach((m, i) => {
    if (m.color === 'w') parts.push(`${number}.`);
    else if (i === 0) parts.push(`${number}...`);
    parts.push(fmt(m.san));
    if (m.color === 'b') number++;
  });
  return parts.join(' ');
}
