import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  emptyProgress,
  GameRecord,
  LessonDraft,
  LessonFinish,
  loadProgress,
  Progress,
  PuzzleResult,
  ReviewFinish,
  saveProgress,
  withDraft,
  withGameFinished,
  withLastUnit,
  withLessonFinished,
  withPieceSetBought,
  withPractice,
  withProfile,
  withPuzzleFinished,
  withReviewFinished,
  withTurningPointSolved,
  withBoardThemeBought,
  withReset,
} from './progressStore';
import { mergeImport } from './merge';
import { useCrossTabSync } from './useCrossTabSync';

/** Monedas ganadas por algo terminado, y aparte el premio del día si se cumplió en ese momento. */
export type Earned = { coins: number; dailyBonus: number; streakRecovered: boolean };

type ProgressValue = {
  progress: Progress;
  loaded: boolean;
  /** Guarda la lección como terminada y devuelve las monedas ganadas (0 si ya estaba hecha). */
  finishLesson: (f: LessonFinish) => Earned;
  /** Guarda el repaso y devuelve el premio del día y si con él se recuperó la racha. */
  finishReview: (r: ReviewFinish) => Earned;
  /** Guarda (o borra, con null) el avance de una lección a medio hacer. */
  saveDraft: (lessonId: string, draft: LessonDraft | null) => void;
  /** Recuerda la unidad de la última lección empezada en Aprender. */
  setLastUnit: (unit: number) => void;
  addPractice: (seconds: number) => void;
  finishGame: (
    game: Omit<GameRecord, 'playedAt'>,
    seconds: number,
    botElo: number,
    countsForStreak: boolean
  ) => Earned;
  finishPuzzle: (id: string, result: PuzzleResult, seconds: number) => Earned;
  /** Punto de giro encontrado en el quiz de la revisión: devuelve las monedas (0 si ya se había cobrado). */
  finishTurningPoint: (key: string, clean: boolean) => number;
  /** Compra un set de piezas: devuelve false si no alcanzan las monedas. */
  buyPieceSet: (id: string, price: number) => boolean;
  /** Compra un tablero: devuelve false si no alcanzan las monedas. */
  buyBoardTheme: (id: string, price: number) => boolean;
  updateProfile: (patch: Partial<Progress['profile']>) => void;
  /** Borra todo el progreso. Conserva la bienvenida ya hecha y el nivel, y anota la fecha (`resetAt`). */
  resetProgress: () => void;
  /** Combina otra copia del progreso (archivo o Drive) con la de este dispositivo, sin perder nada (merge.ts). */
  importProgress: (incoming: Progress) => void;
};

const ProgressContext = createContext<ProgressValue | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [loaded, setLoaded] = useState(false);
  // Copia sincrónica del estado, para encadenar cambios y calcular resultados en el mismo toque.
  const current = useRef<Progress>(emptyProgress);
  const canSave = useRef(true);

  useEffect(() => {
    loadProgress().then((r) => {
      current.current = r.progress;
      canSave.current = r.canSave;
      setProgress(r.progress);
      setLoaded(true);
    });
  }, []);

  const commit = useCallback((next: Progress) => {
    current.current = next;
    setProgress(next);
    if (canSave.current) saveProgress(next).catch(() => {});
  }, []);

  // En la web, lo que guarde otra pestaña o ventana se combina con lo de esta en vez de pisarse.
  useCrossTabSync(loaded, current, commit);

  const finishLesson = useCallback(
    (f: LessonFinish) => {
      const result = withLessonFinished(current.current, f);
      commit(result.progress);
      return { coins: result.coinsEarned, dailyBonus: result.dailyBonus, streakRecovered: result.streakRecovered };
    },
    [commit]
  );

  const finishReview = useCallback(
    (r: ReviewFinish) => {
      const result = withReviewFinished(current.current, r);
      commit(result.progress);
      return { coins: 0, dailyBonus: result.dailyBonus, streakRecovered: result.streakRecovered };
    },
    [commit]
  );

  const saveDraft = useCallback(
    (lessonId: string, draft: LessonDraft | null) => commit(withDraft(current.current, lessonId, draft)),
    [commit]
  );

  const setLastUnit = useCallback((unit: number) => commit(withLastUnit(current.current, unit)), [commit]);

  const addPractice = useCallback((seconds: number) => commit(withPractice(current.current, seconds)), [commit]);

  /** Guarda el resultado y separa las monedas propias del premio del día. */
  const commitEarned = useCallback(
    (before: Progress, r: { progress: Progress; coinsEarned: number; streakRecovered: boolean }): Earned => {
      commit(r.progress);
      return {
        coins: r.coinsEarned,
        dailyBonus: r.progress.coins - before.coins - r.coinsEarned,
        streakRecovered: r.streakRecovered,
      };
    },
    [commit]
  );

  const finishGame = useCallback(
    (game: Omit<GameRecord, 'playedAt'>, seconds: number, botElo: number, countsForStreak: boolean) =>
      commitEarned(current.current, withGameFinished(current.current, game, seconds, botElo, countsForStreak)),
    [commitEarned]
  );

  const finishPuzzle = useCallback(
    (id: string, result: PuzzleResult, seconds: number) =>
      commitEarned(current.current, withPuzzleFinished(current.current, id, result, seconds)),
    [commitEarned]
  );

  const finishTurningPoint = useCallback(
    (key: string, clean: boolean) => {
      const r = withTurningPointSolved(current.current, key, clean);
      if (r.coinsEarned) commit(r.progress);
      return r.coinsEarned;
    },
    [commit]
  );

  const buyPieceSet = useCallback(
    (id: string, price: number) => {
      const next = withPieceSetBought(current.current, id, price);
      if (next) commit(next);
      return !!next;
    },
    [commit]
  );

  const buyBoardTheme = useCallback(
    (id: string, price: number) => {
      const next = withBoardThemeBought(current.current, id, price);
      if (next) commit(next);
      return !!next;
    },
    [commit]
  );

  const updateProfile = useCallback(
    (patch: Partial<Progress['profile']>) => commit(withProfile(current.current, patch)),
    [commit]
  );

  // Se guarda directo, sin borrar la clave antes: si la app se cierra en medio, no se pierde la marca `resetAt`.
  const resetProgress = useCallback(() => commit(withReset(current.current)), [commit]);

  const importProgress = useCallback(
    (incoming: Progress) => commit(mergeImport(current.current, incoming)),
    [commit]
  );

  return (
    <ProgressContext.Provider
      value={{
        progress,
        loaded,
        finishLesson,
        finishReview,
        saveDraft,
        setLastUnit,
        addPractice,
        finishGame,
        finishPuzzle,
        finishTurningPoint,
        buyPieceSet,
        buyBoardTheme,
        updateProfile,
        resetProgress,
        importProgress,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress(): ProgressValue {
  const value = useContext(ProgressContext);
  if (!value) throw new Error('useProgress debe usarse dentro de ProgressProvider');
  return value;
}
