import { useMemo, useRef } from 'react';
import { Chess } from 'chess.js';
import type { BoardMove } from '../../components/Board';
import type { UciEngine } from '../../engine/uci';
import { evaluatePosition } from '../../review/analyze';
import { bookPositions, positionKey } from '../../review/book';
import { ratePly } from '../../review/build';
import type { GameMove, PositionEval, Review } from '../../review/types';
import type { Playback } from './useReviewPlayback';

/**
 * Jugadas propias sobre el tablero: si coincide con la de la partida se avanza; si no, se abre una
 * variante y el motor la evalúa. `fen` = posición que se ve ahora.
 */
export function useBranchPlay(review: Review | null, engine: UciEngine | null, pb: Playback, fen: string) {
  const branchId = useRef(0);
  // Evaluaciones ya conocidas: las de la partida y las de las jugadas propias.
  const evalCache = useRef(new Map<string, PositionEval>());
  const reviewEvals = useMemo(() => {
    const m = new Map<string, PositionEval>();
    if (!review) return m;
    review.plies.forEach((p, i) => m.set(positionKey(p.move.fenBefore), { score: review.scores[i], best: p.bestUci }));
    const last = review.plies[review.plies.length - 1];
    if (last) m.set(positionKey(last.move.fenAfter), { score: review.scores[review.plies.length], best: last.replyUci });
    return m;
  }, [review]);

  return (m: BoardMove) => {
    if (!review || pb.fast || pb.autoplaying) return;
    const { idx, branch, lastVar } = pb;
    const n = review.plies.length;
    const fenBefore = fen;
    let mv: GameMove;
    try {
      const c = new Chess(fenBefore);
      const r = c.move({ from: m.from, to: m.to, promotion: m.promotion });
      mv = { san: r.san, uci: `${m.from}${m.to}${r.promotion ?? ''}`, color: r.color, fenBefore, fenAfter: c.fen() };
    } catch {
      return;
    }
    pb.setPlaying(false);
    pb.setFfTarget(null);
    pb.setShowBest(false);
    if (!branch && idx < n && review.plies[idx].move.uci === mv.uci) return pb.goTo(idx + 1);
    const id = ++branchId.current;
    const prev = lastVar ? lastVar.rated ?? undefined : idx > 0 ? review.plies[idx - 1] : undefined;
    const number = (branch ? branch.from : idx) + (branch?.moves.length ?? 0) + 1;
    pb.setBranch({ from: branch ? branch.from : idx, moves: [...(branch?.moves ?? []), { id, move: mv, rated: null }] });
    if (!engine) return;
    const evalOf = async (f: string) => {
      const key = positionKey(f);
      const known = evalCache.current.get(key) ?? reviewEvals.get(key);
      if (known) return known;
      const e = await evaluatePosition(engine, f);
      evalCache.current.set(key, e);
      return e;
    };
    (async () => {
      try {
        const before = await evalOf(mv.fenBefore);
        const after = await evalOf(mv.fenAfter);
        const rated = ratePly(number, mv, before, after, bookPositions(), prev);
        pb.setBranch((b) => (b ? { ...b, moves: b.moves.map((x) => (x.id === id ? { ...x, rated } : x)) } : b));
      } catch {
        // sin respuesta del motor: la jugada queda «analizando»
      }
    })();
  };
}
