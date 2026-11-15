import type { Square } from 'chess.js';
import { uciSquares } from '../../review/bestLine';
import { isBad, type ReviewPly } from '../../review/types';
import { badgeOf, BEST_ARROW, REPLY_ARROW, type Badge } from '../../review/quality';
import type { Branch, BranchMove, Preview } from './playbackMachine';

export type ReviewViewInput = {
  /** Posición de la partida en la jugada actual (sin variante ni línea). */
  fen: string;
  plies: ReviewPly[];
  scores: number[];
  idx: number;
  lastVar: BranchMove | null;
  preview: Preview | null;
  branch: Branch | null;
  me: 'w' | 'b' | null;
  showBest: boolean;
};

export type ReviewView = {
  ply: ReviewPly | undefined;
  /** La variante propia todavía no está calificada por el motor. */
  pendingOwn: boolean;
  shownFen: string;
  lastMove: { from: Square; to: Square } | null;
  mine: boolean;
  bad: boolean;
  badge: Badge | null;
  colorArrows: { move: string; color: string }[];
  score: number;
};

/**
 * Evaluación de una variante: la de su última jugada calificada o, si ninguna lo está, la de la posición de la que
 * se desvió.
 */
export function branchScore(branch: Branch, scores: number[]): number {
  for (let i = branch.moves.length - 1; i >= 0; i--) {
    const rated = branch.moves[i].rated;
    if (rated) return rated.scoreAfter;
  }
  return scores[branch.from] ?? 0;
}

/**
 * Lo que se ve en el tablero y el panel en cada paso: la jugada de la partida, la variante propia o la línea del
 * motor, con su insignia, flechas y evaluación. Función pura (sin React Native) y probada en reviewView.test.ts.
 */
export function reviewView(o: ReviewViewInput): ReviewView {
  const ply = o.lastVar ? (o.lastVar.rated ?? undefined) : o.idx > 0 ? o.plies[o.idx - 1] : undefined;
  const pendingOwn = !!o.lastVar && !o.lastVar.rated;
  const previewMove = o.preview && o.preview.step > 0 ? o.preview.moves[o.preview.step - 1] : null;
  const shownFen = o.preview ? (previewMove ? previewMove.fenAfter : o.preview.baseFen) : o.fen;
  const shownMove = o.preview ? previewMove : o.lastVar ? o.lastVar.move : ply?.move;
  // Una revisión guardada vieja puede traer una jugada que no es UCI: sin casillas no hay última jugada ni flechas.
  const lastMove = shownMove ? uciSquares(shownMove.uci) : null;
  const mine = o.me !== null && (o.lastVar ? o.lastVar.move.color === o.me : ply ? ply.move.color === o.me : false);
  const bad = !!ply && isBad(ply.quality);
  const badge = ply ? badgeOf(ply) : null;
  const colorArrows: { move: string; color: string }[] = [];
  const reply = ply ? uciSquares(ply.replyUci) : null;
  if (!o.preview && ply && bad && reply) colorArrows.push({ move: `${reply.from}${reply.to}`, color: REPLY_ARROW });
  const best = ply ? uciSquares(ply.bestUci) : null;
  if (!o.preview && ply && o.showBest && best) colorArrows.push({ move: `${best.from}${best.to}`, color: BEST_ARROW });
  const score = o.branch ? branchScore(o.branch, o.scores) : (o.scores[o.idx] ?? 0);
  return { ply, pendingOwn, shownFen, lastMove, mine, bad, badge, colorArrows, score };
}
