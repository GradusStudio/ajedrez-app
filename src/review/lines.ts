// Detector de líneas: reproduce la variación del motor con chess.js y solo devuelve lo que el tablero comprueba.
// Ante la duda no devuelve nada (mejor un falso negativo que inventar algo).
import { Chess } from 'chess.js';
import type { Color, Move } from 'chess.js';
import { capturableForFree } from './tactics';
import type { PieceKind } from './types';

export type RemoveDefender = { capturer: PieceKind; removed: PieceKind; removedSq: string; target: PieceKind; targetSq: string };

/** `sans`: SAN en inglés de las jugadas reproducidas (como mucho 4). `material`: puntos netos para quien mueve primero. */
export type LineFacts = { sans: string[]; material: number; removeDefender?: RemoveDefender };

const VALUE: Record<PieceKind, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };
const MAX_PLIES = 4;

const opposite = (c: Color): Color => (c === 'w' ? 'b' : 'w');

function play(game: Chess, uci: string): Move | null {
  try {
    return game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.slice(4, 5) || undefined });
  } catch {
    return null;
  }
}

export function analyzeLine(fen: string, pv: string[]): LineFacts | null {
  try {
    return analyze(fen, pv);
  } catch {
    return null;
  }
}

function analyze(fen: string, pv: string[]): LineFacts | null {
  if (pv.length === 0) return null;
  const start = new Chess(fen);
  const game = new Chess(fen);
  const moves: Move[] = [];
  // boards[i] = posición tras la jugada i.
  const boards: Chess[] = [];
  for (const uci of pv.slice(0, MAX_PLIES)) {
    const m = play(game, uci);
    if (!m) break;
    moves.push(m);
    boards.push(new Chess(game.fen()));
  }
  if (moves.length === 0) return null;

  const me: Color = moves[0].color;
  const rival = opposite(me);

  // La última captura de quien mueve primero no cuenta si esa pieza se pierde gratis,
  // salvo que la jugada siguiente ya la recapture (entonces ya está contada).
  let lastMine = -1;
  moves.forEach((m, i) => {
    if (m.color === me && m.captured) lastMine = i;
  });
  let discounted = -1;
  if (lastMine >= 0) {
    const next = moves[lastMine + 1];
    const recaptured = !!next && !!next.captured && next.to === moves[lastMine].to;
    if (!recaptured && capturableForFree(boards[lastMine], moves[lastMine].to, me, rival)) discounted = lastMine;
  }
  let material = 0;
  moves.forEach((m, i) => {
    if (!m.captured || i === discounted) return;
    material += (m.color === me ? 1 : -1) * VALUE[m.captured as PieceKind];
  });

  const facts: LineFacts = { sans: moves.map((m) => m.san), material };
  const rd = removeDefender(start, moves, boards, me, rival);
  if (rd && material >= 1) facts.removeDefender = rd;
  return facts;
}

function removeDefender(start: Chess, moves: Move[], boards: Chess[], me: Color, rival: Color): RemoveDefender | undefined {
  if (moves.length < 3) return undefined;
  const [m1, m2, m3] = moves;
  // Los controles de rey son defensivos: chess.js nunca deja capturar un rey en una línea legal.
  // Con promoción la pieza que queda en `s` no es la que salió, y al paso la capturada no está en `to`: no se afirma nada.
  if (!m1.captured || m1.captured === 'k' || m1.flags.includes('e') || m1.promotion) return undefined;
  if (m2.color !== rival || m3.color !== me || !m3.captured) return undefined;
  const s = m1.to;
  const t = m3.to;
  if (t === s) return undefined;
  const target = start.get(t);
  if (!target || target.color !== rival || target.type === 'k') return undefined;
  if (m3.captured !== target.type || m2.from === t) return undefined;
  // La pieza capturada defendía al objetivo.
  const defendersBefore = start.attackers(t, rival);
  if (!defendersBefore.includes(s)) return undefined;
  // Tras la 2.ª jugada el objetivo tiene menos defensores que antes de empezar.
  if (boards[1].attackers(t, rival).length >= defendersBefore.length) return undefined;
  return { capturer: m1.piece as PieceKind, removed: m1.captured as PieceKind, removedSq: s, target: target.type as PieceKind, targetSq: t };
}
