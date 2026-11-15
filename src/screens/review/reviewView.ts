import type { Square } from 'chess.js';
import { isBad, type GameMove, type ReviewPly } from '../../review/types';
import { badgeOf, BEST_ARROW, REPLY_ARROW, type Badge } from './quality';

type VarMove = { move: GameMove; rated: ReviewPly | null };
type BranchLike = { from: number; moves: VarMove[] } | null;
type PreviewLike = { baseFen: string; moves: { fenAfter: string; uci: string }[]; step: number } | null;

export type ReviewViewInput = {
  /** Posición de la partida en la jugada actual (sin variante ni línea). */
  fen: string;
  plies: ReviewPly[];
  scores: number[];
  idx: number;
  lastVar: VarMove | null;
  preview: PreviewLike;
  branch: BranchLike;
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
 * Lo que se ve en el tablero y el panel en cada paso: la jugada de la partida, la variante propia o la línea del
 * motor, con su insignia, flechas y evaluación. Función pura (sin React Native) y probada en reviewView.test.ts.
 */
export function reviewView(o: ReviewViewInput): ReviewView {
  const ply = o.lastVar ? (o.lastVar.rated ?? undefined) : o.idx > 0 ? o.plies[o.idx - 1] : undefined;
  const pendingOwn = !!o.lastVar && !o.lastVar.rated;
  const previewMove = o.preview && o.preview.step > 0 ? o.preview.moves[o.preview.step - 1] : null;
  const shownFen = o.preview ? (previewMove ? previewMove.fenAfter : o.preview.baseFen) : o.fen;
  const shownMove = o.preview ? previewMove : o.lastVar ? o.lastVar.move : ply?.move;
  const lastMove = shownMove ? { from: shownMove.uci.slice(0, 2) as Square, to: shownMove.uci.slice(2, 4) as Square } : null;
  const mine = o.me !== null && (o.lastVar ? o.lastVar.move.color === o.me : ply ? ply.move.color === o.me : false);
  const bad = !!ply && isBad(ply.quality);
  const badge = ply ? badgeOf(ply) : null;
  const colorArrows: { move: string; color: string }[] = [];
  if (!o.preview && ply && bad && ply.replyUci) colorArrows.push({ move: ply.replyUci.slice(0, 4), color: REPLY_ARROW });
  if (!o.preview && ply && o.showBest && ply.bestUci) colorArrows.push({ move: ply.bestUci.slice(0, 4), color: BEST_ARROW });
  const score = o.branch
    ? (ply?.scoreAfter ?? o.branch.moves.slice(0, -1).reverse().find((m) => m.rated)?.rated?.scoreAfter ?? o.scores[o.branch.from] ?? 0)
    : (o.scores[o.idx] ?? 0);
  return { ply, pendingOwn, shownFen, lastMove, mine, bad, badge, colorArrows, score };
}
