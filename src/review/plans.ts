// Detector de planes: dice para que sirve una jugada tranquila usando solo lo que el tablero comprueba.
// Ante la duda cae a la siguiente regla y, al final, a `plain` (la pieza va a la casilla). Nunca lanza.
import { Chess } from 'chess.js';
import type { PieceKind } from './types';

export type PlanKind = 'develop' | 'center' | 'rookFile' | 'pawnBreak' | 'pawnAdvance' | 'trade' | 'retreat' | 'kingActive' | 'plain';
export type Plan = { kind: PlanKind; piece: PieceKind; from: string; to: string };

const VALUE: Record<PieceKind, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };
const FILES = 'abcdefgh';
const CENTER = ['d4', 'e4', 'd5', 'e5'];

/** Distancia (de rey) de una casilla al centro: 0 en d4, e4, d5 y e5. */
const centerDistance = (s: string) => {
  const f = FILES.indexOf(s[0]);
  const r = Number(s[1]) - 1;
  return Math.max(Math.abs(f - 3.5), Math.abs(r - 3.5)) - 0.5;
};

export function planFor(fenBefore: string, uci: string): Plan {
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  let game: Chess;
  let move;
  try {
    game = new Chess(fenBefore);
    move = game.move({ from, to, promotion: uci.slice(4, 5) || undefined });
  } catch {
    let piece: PieceKind = 'p';
    try {
      piece = (new Chess(fenBefore).get(from as never)?.type as PieceKind) ?? 'p';
    } catch {
      // FEN ilegible: se queda con el peon por defecto.
    }
    return { kind: 'plain', piece, from, to };
  }
  const piece = move.piece as PieceKind;
  const color = move.color;
  const plan = (kind: PlanKind): Plan => ({ kind, piece, from, to });
  const isCapture = Boolean(move.captured);
  const board = game.board();

  // Cambio: captura de igual valor (sin reyes).
  if (isCapture && piece !== 'k' && VALUE[move.captured as PieceKind] === VALUE[piece]) return plan('trade');

  // Desarrollo: pieza menor que sale de su casilla inicial de la fila de atras.
  const homeRank = color === 'w' ? '1' : '8';
  const homeFiles = piece === 'n' ? 'bg' : piece === 'b' ? 'cf' : '';
  if (homeFiles.includes(from[0]) && from[1] === homeRank && to[1] !== homeRank) return plan('develop');

  // Centro: peon o pieza (no el rey) que llega a d4, e4, d5 o e5 desde fuera del centro.
  if (piece !== 'k' && CENTER.includes(to) && !CENTER.includes(from)) return plan('center');

  // Torre a una columna abierta (sin peones) o semiabierta (sin peones propios), distinta de la que dejo.
  if (piece === 'r' && from[0] !== to[0]) {
    const col = FILES.indexOf(to[0]);
    const ownPawn = board.some((row) => row[col]?.type === 'p' && row[col]?.color === color);
    if (!ownPawn) return plan('rookFile');
  }

  if (piece === 'p') {
    // Ruptura: el peon queda atacando a un peon rival.
    const col = FILES.indexOf(to[0]);
    const ahead = Number(to[1]) - 1 + (color === 'w' ? 1 : -1);
    const hits = [col - 1, col + 1].some((c) => {
      const p = c >= 0 && c < 8 && ahead >= 0 && ahead < 8 ? board[7 - ahead][c] : null;
      return p?.type === 'p' && p.color !== color;
    });
    if (hits) return plan('pawnBreak');
    if (!isCapture) return plan('pawnAdvance');
  }

  // Rey activo: final sin damas y el rey se acerca al centro.
  if (piece === 'k' && !board.flat().some((p) => p?.type === 'q') && centerDistance(to) < centerDistance(from)) return plan('kingActive');

  // Retirada: pieza menor que vuelve hacia su lado sin capturar.
  if ((piece === 'n' || piece === 'b') && !isCapture) {
    const back = color === 'w' ? Number(to[1]) < Number(from[1]) : Number(to[1]) > Number(from[1]);
    if (back) return plan('retreat');
  }

  return plan('plain');
}
