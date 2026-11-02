// Evaluaciones del motor en texto y en barra. Sin React Native: lo usan las pruebas con tsx.
import type { EngineLine } from './uci';

/** Evaluación desde el punto de vista de las blancas (el motor la da para el bando que mueve). */
export const whiteScore = (line: EngineLine, turn: 'w' | 'b') => (turn === 'w' ? line.score : -line.score);

export const isMate = (score: number) => Math.abs(score) >= 9000;

/** "+1,3", "−0,4", "M3" (mate de las blancas en 3), "−M2" (mate de las negras en 2). `decimal` es el separador del idioma. */
export function formatScore(score: number, decimal: string): string {
  if (isMate(score)) return `${score > 0 ? '' : '−'}M${10000 - Math.abs(score)}`;
  const pawns = (Math.abs(score) / 100).toFixed(1).replace('.', decimal);
  return score > 0 ? `+${pawns}` : score < 0 ? `−${pawns}` : `0${decimal}0`;
}

/** Parte de la barra que es blanca (0 a 1). Misma curva que Lichess: ±4 peones ≈ 90 %. */
export function whiteShare(score: number): number {
  if (isMate(score)) return score > 0 ? 1 : 0;
  return 1 / (1 + Math.exp(-0.00368208 * score));
}
