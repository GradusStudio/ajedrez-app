import { useCallback, useEffect, useState } from 'react';
import { getPuzzleSource, loadPuzzleSource } from './puzzleSource';
import { PuzzleSource, PuzzlesUnavailable } from './source';

export type PuzzlesState =
  | { status: 'loading' }
  | { status: 'error'; offline: boolean; retry: () => void }
  | { status: 'ready'; source: PuzzleSource };

/** `offline` para el aviso de error: true si el error fue por falta de conexión. */
export const isOfflineError = (e: unknown) => e instanceof PuzzlesUnavailable && e.offline;

/**
 * La fuente de puzzles (puzzleSource.ts en el celular, puzzleSource.web.ts en la web). En el celular, la primera vez
 * carga la lista de 50.000; en la web está lista enseguida (los trozos se piden después, de a uno).
 */
export function usePuzzleSource(): PuzzlesState {
  const [source, setSource] = useState(getPuzzleSource);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => {
    setFailed(false);
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    if (source) return;
    let cancelled = false;
    loadPuzzleSource().then(
      (s) => !cancelled && setSource(s),
      () => !cancelled && setFailed(true)
    );
    return () => {
      cancelled = true;
    };
  }, [source, attempt]);

  if (source) return { status: 'ready', source };
  if (failed) return { status: 'error', offline: false, retry };
  return { status: 'loading' };
}
