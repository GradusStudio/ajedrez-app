import { useCallback, useEffect, useState } from 'react';
import type { Puzzle } from './puzzles';
import type { PuzzleSource } from './source';
import { isOfflineError } from './usePuzzles';

export type Daily = { status: 'loading' } | { status: 'error'; offline: boolean } | { status: 'ready'; puzzle: Puzzle };

/**
 * El puzzle del día y su carga (con reintento). Lo usan la tarjeta de Inicio y la pestaña Puzzles: la misma regla,
 * el mismo estado y el mismo mensaje de sin conexión. `source` es null mientras la fuente todavía no está lista.
 */
export function useDailyPuzzle(source: PuzzleSource | null) {
  const [daily, setDaily] = useState<Daily>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!source) return;
    let cancelled = false;
    source.daily().then(
      (puzzle) => !cancelled && setDaily({ status: 'ready', puzzle }),
      (e) => !cancelled && setDaily({ status: 'error', offline: isOfflineError(e) })
    );
    return () => {
      cancelled = true;
    };
  }, [source, attempt]);

  const retry = useCallback(() => {
    setDaily({ status: 'loading' });
    setAttempt((n) => n + 1);
  }, []);

  return { daily, retry };
}
