import { useEffect, useState } from 'react';
import { useUciEngine } from '../../engine/useUciEngine';
import { analyzeGame } from '../../review/analyze';
import { bookPositions } from '../../review/book';
import { buildReview } from '../../review/build';
import type { ParsedGame, Review } from '../../review/types';

/** Motor + análisis de toda la partida. `engineView` hay que dibujarlo una vez en la pantalla. */
export function useReviewAnalysis(game: ParsedGame | null) {
  const [failed, setFailed] = useState(false);
  const [review, setReview] = useState<Review | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 1 });
  // Si el análisis falló, el motor se apaga hasta que se reintente.
  const { engine, error: engineError, retry: retryEngine, view: engineView } = useUciEngine(!failed);

  useEffect(() => {
    if (!engine || !game || review) return;
    let cancelled = false;
    analyzeGame(engine, game, (done, total) => !cancelled && setProgress({ done, total }), () => cancelled)
      .then((evals) => {
        if (!evals || cancelled) return;
        setReview(buildReview(game, evals, bookPositions()));
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      engine.stop();
    };
  }, [engine, game, review]);

  const retry = () => {
    setFailed(false);
    retryEngine();
  };

  return { engine, engineError, engineView, review, progress, failed, retry };
}
