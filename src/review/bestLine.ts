// La línea del motor en forma que la pantalla puede mostrar y reproducir. Sin React Native.
import { Chess } from 'chess.js';

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

/**
 * La línea como texto con números de jugada: «7. Cg5 d5 8. exd5 Ca5» o «7... d5 8. exd5».
 * `fmt` pasa cada jugada de notación inglesa a la del usuario.
 */
export function lineText(fen: string, moves: LineMove[], fmt: (san: string) => string): string {
  let number = Number(fen.split(' ')[5]) || 1;
  const parts: string[] = [];
  moves.forEach((m, i) => {
    if (m.color === 'w') parts.push(`${number}.`);
    else if (i === 0) parts.push(`${number}...`);
    parts.push(fmt(m.san));
    if (m.color === 'b') number++;
  });
  return parts.join(' ');
}
