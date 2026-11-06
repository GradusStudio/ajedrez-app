import { Chess } from 'chess.js';
import { whiteShare } from '../engine/evalFormat';
import { positionKey } from './book';
import { analyzeLine } from './lines';
import type { LineFacts } from './lines';
import { planFor } from './plans';
import { detectTactics, mateIn } from './tactics';
import type { Facts, GameMove, MoveQuality, ParsedGame, PieceKind, PositionEval, Review, ReviewPly } from './types';

// Del análisis del motor a la revisión: calidad de cada jugada, hechos verificados con el tablero,
// jugadas destacadas y precisión. Funciones puras, sin React Native.

/** Cota superior (en puntos de probabilidad de ganar perdidos) de cada categoría; desde mistake hasta arriba es error grave. */
export const THRESHOLDS = { excellent: 2, good: 5, inaccuracy: 10, mistake: 20 } as const;

const PIECE_VALUE: Record<PieceKind, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

/** Probabilidad (0–100) de que gane el bando `color`, dada la evaluación desde las blancas. */
export const winPercent = (scoreWhite: number, color: 'w' | 'b') =>
  100 * (color === 'w' ? whiteShare(scoreWhite) : 1 - whiteShare(scoreWhite));

function classify(loss: number): MoveQuality {
  if (loss < THRESHOLDS.excellent) return 'excellent';
  if (loss < THRESHOLDS.good) return 'good';
  if (loss < THRESHOLDS.inaccuracy) return 'inaccuracy';
  if (loss < THRESHOLDS.mistake) return 'mistake';
  return 'blunder';
}

/** Aplica una jugada UCI; null si no es legal en esa posición. */
function tryMove(fen: string, uci: string) {
  if (!uci) return null;
  try {
    return new Chess(fen).move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
  } catch {
    return null;
  }
}

/** Hechos de la jugada jugada, de la mejor y de la respuesta del rival, todos comprobados con chess.js. */
export function factsFor(
  move: GameMove,
  bestUci: string,
  replyUci: string,
  quality: MoveQuality,
  scoreAfter?: number,
  prevTo?: string,
  pvs?: { reply?: string[]; best?: string[] }
): Facts {
  const facts: Facts = {};
  const played = tryMove(move.fenBefore, move.uci);
  if (played) {
    if (played.san.endsWith('#')) facts.did = { kind: 'mate' };
    else if (played.san.endsWith('+')) facts.did = { kind: 'check' };
    else if (played.captured) facts.did = { kind: 'capture', piece: played.captured as PieceKind };
    else if (played.san.startsWith('O-O')) facts.did = { kind: 'castle' };
  }
  let tactics = detectTactics(move.fenBefore, move.uci);
  // En un mate solo cuentan el jaque doble y el mate del pasillo: lo demás tapa lo importante.
  if (played?.san.endsWith('#')) tactics = tactics.filter((t) => t.kind === 'doubleCheck' || t.kind === 'backRank');
  // Recapturar en la casilla donde el rival acaba de capturar no es «encontrar una pieza colgada».
  if (prevTo && prevTo === move.uci.slice(2, 4)) tactics = tactics.filter((t) => t.kind !== 'hanging');
  tactics = tactics.slice(0, 2);
  if (tactics.length > 0) facts.found = tactics;
  if (!facts.did && !facts.found) facts.plan = planFor(move.fenBefore, move.uci);

  const bad = quality === 'inaccuracy' || quality === 'mistake' || quality === 'blunder';
  const mate = scoreAfter === undefined ? null : mateIn(scoreAfter);
  if (mate) {
    const mover = mate.by === move.color;
    // k = 0 ya es did.mate y, para el rival, k = 1 ya es allows.mate.
    if (mover && mate.n >= 1 && (quality === 'best' || quality === 'excellent' || quality === 'book')) facts.mateIn = { n: mate.n + 1, mover: true };
    else if (!mover && mate.n >= 2 && bad) facts.mateIn = { n: mate.n, mover: false };
  }
  if (!bad) return facts;

  const reply = tryMove(move.fenAfter, replyUci);
  if (reply) {
    if (reply.san.endsWith('#')) facts.allows = { kind: 'mate', san: reply.san };
    else if (reply.captured && PIECE_VALUE[reply.captured as PieceKind] >= 3)
      facts.allows = { kind: 'capture', piece: reply.captured as PieceKind, san: reply.san, ofMoved: reply.to === played?.to };
    else if (reply.san.endsWith('+')) facts.allows = { kind: 'check', san: reply.san };
    const tactic = detectTactics(move.fenAfter, replyUci)[0];
    // Una pieza colgada ya la dice `allows` (la misma captura): no se repite.
    if (tactic && !(tactic.kind === 'hanging' && facts.allows?.kind === 'capture')) facts.allowsTactic = { tactic, san: reply.san };
  }
  const best = tryMove(move.fenBefore, bestUci);
  if (best) {
    if (best.san.endsWith('#')) facts.missed = { kind: 'mate' };
    else if (best.captured && PIECE_VALUE[best.captured as PieceKind] >= 3 && best.captured !== played?.captured)
      facts.missed = { kind: 'capture', piece: best.captured as PieceKind };
  }
  const line = informative(move.fenAfter, pvs?.reply);
  if (line) facts.line = line;
  const missedLine = informative(move.fenBefore, pvs?.best);
  if (missedLine) facts.missedLine = missedLine;
  return facts;
}

/** La línea del motor solo se cuenta si el tablero comprueba algo que vale la pena decir. */
function informative(fen: string, pv?: string[]): LineFacts | undefined {
  if (!pv || pv.length === 0) return undefined;
  const facts = analyzeLine(fen, pv);
  return facts && (facts.removeDefender || facts.material >= 2) ? facts : undefined;
}

const sanOf = (fen: string, uci: string) => tryMove(fen, uci)?.san ?? '';

/** Puntaje de precisión de una jugada (misma fórmula que Lichess, sobre puntos de probabilidad perdidos). */
const moveAccuracy = (loss: number) => Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * loss) - 3.1669));

/**
 * Califica una jugada: `before` es la evaluación de la posición antes de jugarla y `after`, la de después.
 * `prev` es la jugada anterior (del rival), para reconocer las «grandes jugadas».
 */
export function ratePly(
  ply: number,
  move: GameMove,
  before: PositionEval,
  after: PositionEval,
  book: Set<string>,
  prev?: Pick<ReviewPly, 'quality' | 'loss'> & { move?: GameMove }
): ReviewPly {
  const loss = Math.max(0, winPercent(before.score, move.color) - winPercent(after.score, move.color));
  let quality: MoveQuality;
  if (book.has(positionKey(move.fenAfter)) && loss < THRESHOLDS.mistake) quality = 'book';
  else if (move.uci === before.best || loss < 0.5) quality = 'best';
  else quality = classify(loss);
  const great = quality === 'best' && !!prev && (prev.quality === 'blunder' || prev.quality === 'mistake') && prev.loss >= 20;
  const mateGiven = move.san.endsWith('#');
  const highlight = quality === 'inaccuracy' || quality === 'mistake' || quality === 'blunder' || great || mateGiven;
  // Lo que sigue a la jugada: la mejor respuesta del rival, según el motor.
  return {
    ply,
    move,
    quality,
    loss,
    great,
    highlight,
    scoreAfter: after.score,
    bestUci: before.best,
    bestSan: sanOf(move.fenBefore, before.best),
    replyUci: after.best,
    replySan: sanOf(move.fenAfter, after.best),
    facts: factsFor(move, before.best, after.best, quality, after.score, prev?.move?.uci.slice(2, 4), { reply: after.pv, best: before.pv }),
  };
}

/**
 * Arma la revisión. `evals[i]` es la evaluación de la posición antes de la jugada i + 1
 * (y `evals[n]`, la de la posición final): hay una más que jugadas.
 */
export function buildReview(game: ParsedGame, evals: PositionEval[], book: Set<string>): Review {
  const n = game.moves.length;
  const plies: ReviewPly[] = [];
  const acc: Record<'w' | 'b', number[]> = { w: [], b: [] };

  game.moves.forEach((move, i) => {
    const rated = ratePly(i + 1, move, evals[i], evals[i + 1], book, plies[i - 1]);
    plies.push(rated);
    acc[move.color].push(rated.quality === 'book' ? 100 : moveAccuracy(rated.loss));
  });

  const mean = (xs: number[]) => (xs.length === 0 ? 100 : xs.reduce((a, b) => a + b, 0) / xs.length);
  return {
    game,
    scores: evals.slice(0, n + 1).map((e) => e.score),
    plies,
    highlights: plies.flatMap((p, i) => (p.highlight ? [i] : [])),
    accuracy: { w: mean(acc.w), b: mean(acc.b) },
  };
}
