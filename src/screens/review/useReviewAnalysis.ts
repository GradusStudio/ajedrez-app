import { useEffect, useState } from 'react';
import { useUciEngine } from '../../engine/useUciEngine';
import { analyzeGame, refineCandidates, refineGame } from '../../review/analyze';
import { bookPositions } from '../../review/book';
import { buildReview } from '../../review/build';
import type { ParsedGame, Review } from '../../review/types';

/** Primero se recorre toda la partida (scan) y después se vuelven a mirar a más profundidad las jugadas malas (refine). */
export type AnalysisPhase = 'scan' | 'refine';

/** Motor + análisis de toda la partida. `engineView` hay que dibujarlo una vez en la pantalla. */
export function useReviewAnalysis(game: ParsedGame | null) {
  const [failed, setFailed] = useState(false);
  const [review, setReview] = useState<Review | null>(null);
  const [phase, setPhase] = useState<AnalysisPhase>('scan');
  const [progress, setProgress] = useState({ done: 0, total: 1 });
  // Si el análisis falló, el motor se apaga hasta que se reintente.
  const { engine, error: engineError, retry: retryEngine, view: engineView } = useUciEngine(!failed);

  useEffect(() => {
    if (!engine || !game || review) return;
    let cancelled = false;
    (async () => {
      const evals = await analyzeGame(engine, game, (done, total) => !cancelled && setProgress({ done, total }), () => cancelled);
      if (!evals || cancelled) return;
      const book = bookPositions();
      const base = buildReview(game, evals, book);
      const candidates = refineCandidates(base.plies);
      if (candidates.length === 0) return setReview(base);
      setPhase('refine');
      setProgress({ done: 0, total: 1 });
      try {
        const refined = await refineGame(engine, game, candidates, (done, total) => !cancelled && setProgress({ done, total }), () => cancelled);
        if (!cancelled) setReview(refined ? buildReview(game, evals, book, refined) : base);
      } catch {
        // Si el motor falla al profundizar, la revisión sigue con el análisis rápido.
        if (!cancelled) setReview(base);
      }
    })().catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      engine.stop();
    };
  }, [engine, game, review]);

  const retry = () => {
    setFailed(false);
    setPhase('scan');
    retryEngine();
  };

  return { engine, engineError, engineView, review, progress, phase, failed, retry };
}
