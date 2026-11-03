import { Chess } from 'chess.js';
import { whiteShare } from '../engine/evalFormat';
import { positionKey } from './book';
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
export function factsFor(move: GameMove, bestUci: string, replyUci: string, quality: MoveQuality): Facts {
  const facts: Facts = {};
  const played = tryMove(move.fenBefore, move.uci);
  if (played) {
    if (played.san.endsWith('#')) facts.did = { kind: 'mate' };
    else if (played.san.endsWith('+')) facts.did = { kind: 'check' };
    else if (played.captured) facts.did = { kind: 'capture', piece: played.captured as PieceKind };
    else if (played.san.startsWith('O-O')) facts.did = { kind: 'castle' };
  }
  if (quality !== 'inaccuracy' && quality !== 'mistake' && quality !== 'blunder') return facts;

  const reply = tryMove(move.fenAfter, replyUci);
  if (reply) {
    if (reply.san.endsWith('#')) facts.allows = { kind: 'mate', san: reply.san };
    else if (reply.captured && PIECE_VALUE[reply.captured as PieceKind] >= 3)
      facts.allows = { kind: 'capture', piece: reply.captured as PieceKind, san: reply.san, ofMoved: reply.to === played?.to };
    else if (reply.san.endsWith('+')) facts.allows = { kind: 'check', san: reply.san };
  }
  const best = tryMove(move.fenBefore, bestUci);
  if (best) {
    if (best.san.endsWith('#')) facts.missed = { kind: 'mate' };
    else if (best.captured && PIECE_VALUE[best.captured as PieceKind] >= 3 && best.captured !== played?.captured)
      facts.missed = { kind: 'capture', piece: best.captured as PieceKind };
  }
  return facts;
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
  prev?: Pick<ReviewPly, 'quality' | 'loss'>
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
    facts: factsFor(move, before.best, after.best, quality),
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
