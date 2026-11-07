import { useCallback, useEffect, useState } from 'react';
import { loadPuzzles, Puzzle } from './puzzles';

export type PuzzlesState = { status: 'loading' } | { status: 'error'; retry: () => void } | { status: 'ready'; puzzles: Puzzle[] };

/** Carga los puzzles la primera vez que una pantalla los pide; después salen de la memoria. */
export function usePuzzles(): PuzzlesState {
  const [state, setState] = useState<{ status: 'loading' | 'error' | 'ready'; puzzles?: Puzzle[] }>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadPuzzles().then(
      (puzzles) => !cancelled && setState({ status: 'ready', puzzles }),
      () => !cancelled && setState({ status: 'error' })
    );
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (state.status === 'ready') return { status: 'ready', puzzles: state.puzzles! };
  if (state.status === 'error') return { status: 'error', retry };
  return { status: 'loading' };
}
