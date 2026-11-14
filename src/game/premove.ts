import { Chess, type Square } from 'chess.js';

export type PremovePiece = 'q' | 'r' | 'b' | 'n';
export type Premove = { from: Square; to: Square; promotion?: PremovePiece };

/** Cambia el turno del FEN y borra la casilla de paso al paso. */
export function passTurn(fen: string): string {
  const parts = fen.split(' ');
  if (parts.length < 4) return fen;
  parts[1] = parts[1] === 'w' ? 'b' : 'w';
  parts[3] = '-';
  return parts.join(' ');
}

/** Aplica una premove al plan y devuelve el FEN con el turno pasado al usuario. */
function applyPlanMove(fen: string, premove: Premove): string | null {
  try {
    const chess = new Chess(fen);
    chess.move({ from: premove.from, to: premove.to, promotion: premove.promotion });
    return passTurn(chess.fen());
  } catch {
    return null;
  }
}

/**
 * Posición del tablero de plan: la posición real con la cola aplicada y el turno en el usuario.
 * Devuelve null si alguna jugada de la cola ya no se puede aplicar.
 */
export function planPremoveFen(realFen: string, premoves: Premove[]): string | null {
  let current = passTurn(realFen);
  for (const premove of premoves) {
    const next = applyPlanMove(current, premove);
    if (next === null) return null;
    current = next;
  }
  return current;
}

/** Prefijo válido de la cola: se corta en la primera jugada que ya no se puede aplicar. */
export function clipPremoves(realFen: string, premoves: Premove[]): Premove[] {
  let current = passTurn(realFen);
  for (let i = 0; i < premoves.length; i++) {
    const next = applyPlanMove(current, premoves[i]);
    if (next === null) return premoves.slice(0, i);
    current = next;
  }
  return premoves;
}

/** Prueba una premove en la posición real y la devuelve tal cual, o null si ya no es legal. */
export function resolvePremove(fen: string, premove: Premove): Premove | null {
  try {
    const chess = new Chess(fen);
    chess.move({ from: premove.from, to: premove.to, promotion: premove.promotion });
    return premove;
  } catch {
    return null;
  }
}
