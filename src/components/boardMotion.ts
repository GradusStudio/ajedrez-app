// Cálculos puros de las animaciones del tablero (sin React Native, para probarlos con npm test).
// Spec: docs/superpowers/specs/2026-11-09-animaciones-de-piezas-design.md.
import { Chess, Square } from 'chess.js';

/** Inclinación máxima de una pieza (grados). */
export const MAX_TILT = 12;
/** Grados por cada px/ms de velocidad horizontal del dedo al arrastrar. */
const TILT_PER_SPEED = 14;
/** Inclinación de una pieza que se desliza sola (jugada del bot, de la lección o tocando destino). */
const SLIDE_TILT = 8;

const clamp = (v: number) => Math.max(-MAX_TILT, Math.min(MAX_TILT, v));

/**
 * Inclinación de la pieza arrastrada según la velocidad horizontal del dedo (px/ms): hacia la derecha, sentido horario
 * (la base va atrás, como una pieza llevada de la punta). Entre -12° y 12°.
 */
export function dragTilt(speedX: number): number {
  return clamp(speedX * TILT_PER_SPEED);
}

/**
 * Inclinación de una pieza que se desliza sola. `dx` es lo que hay desde la casilla final hasta la de partida (como en
 * MovingPiece): negativo si viene de la izquierda, es decir, si va hacia la derecha.
 */
export function slideTilt(dx: number): number {
  if (dx === 0) return 0;
  return dx < 0 ? SLIDE_TILT : -SLIDE_TILT;
}

/**
 * En jaque mate: la casilla del rey vencido y las vecinas vacías (las que no puede usar para escapar). Si la posición
 * no es mate, o no se puede leer, null.
 */
export function mateSquares(fen: string): { king: Square; escapes: Square[] } | null {
  let chess: Chess;
  try {
    chess = new Chess(fen);
  } catch {
    return null;
  }
  if (!chess.isCheckmate()) return null;
  const color = chess.turn();
  let king: Square | null = null;
  for (const row of chess.board()) {
    for (const cell of row) if (cell && cell.type === 'k' && cell.color === color) king = cell.square;
  }
  if (!king) return null;
  const f = king.charCodeAt(0) - 97;
  const r = Number(king[1]);
  const escapes: Square[] = [];
  for (let df = -1; df <= 1; df++) {
    for (let dr = -1; dr <= 1; dr++) {
      if (df === 0 && dr === 0) continue;
      const nf = f + df;
      const nr = r + dr;
      if (nf < 0 || nf > 7 || nr < 1 || nr > 8) continue;
      const sq = `${String.fromCharCode(97 + nf)}${nr}` as Square;
      if (!chess.get(sq)) escapes.push(sq);
    }
  }
  return { king, escapes };
}
