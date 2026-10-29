import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  clearProgress,
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
  withPractice,
  withProfile,
  withPuzzleFinished,
  withReviewFinished,
} from './progressStore';

type ProgressValue = {
  progress: Progress;
  loaded: boolean;
  /** Guarda la lección como terminada y devuelve la XP ganada (0 si ya estaba hecha). */
  finishLesson: (f: LessonFinish) => number;
  finishReview: (r: ReviewFinish) => void;
  /** Guarda (o borra, con null) el avance de una lección a medio hacer. */
  saveDraft: (lessonId: string, draft: LessonDraft | null) => void;
  /** Recuerda la unidad de la última lección empezada en Aprender. */
  setLastUnit: (unit: number) => void;
  addPractice: (seconds: number) => void;
  finishGame: (game: Omit<GameRecord, 'playedAt'>, seconds: number) => void;
  finishPuzzle: (id: string, result: PuzzleResult, seconds: number) => void;
  updateProfile: (patch: Partial<Progress['profile']>) => void;
  /** Borra todo el progreso. Conserva la bienvenida ya hecha y la meta diaria. */
  resetProgress: () => void;
};

const ProgressContext = createContext<ProgressValue | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [loaded, setLoaded] = useState(false);
  // Copia sincrónica del estado, para encadenar cambios y calcular resultados en el mismo toque.
  const current = useRef<Progress>(emptyProgress);

  useEffect(() => {
    loadProgress().then((p) => {
      current.current = p;
      setProgress(p);
      setLoaded(true);
    });
  }, []);

  const commit = useCallback((next: Progress) => {
    current.current = next;
    setProgress(next);
    saveProgress(next).catch(() => {});
  }, []);

  const finishLesson = useCallback(
    (f: LessonFinish) => {
      const result = withLessonFinished(current.current, f);
      commit(result.progress);
      return result.xpEarned;
    },
    [commit]
  );

  const finishReview = useCallback((r: ReviewFinish) => commit(withReviewFinished(current.current, r)), [commit]);

  const saveDraft = useCallback(
    (lessonId: string, draft: LessonDraft | null) => commit(withDraft(current.current, lessonId, draft)),
    [commit]
  );

  const setLastUnit = useCallback((unit: number) => commit(withLastUnit(current.current, unit)), [commit]);

  const addPractice = useCallback((seconds: number) => commit(withPractice(current.current, seconds)), [commit]);

  const finishGame = useCallback(
    (game: Omit<GameRecord, 'playedAt'>, seconds: number) => commit(withGameFinished(current.current, game, seconds)),
    [commit]
  );

  const finishPuzzle = useCallback(
    (id: string, result: PuzzleResult, seconds: number) => commit(withPuzzleFinished(current.current, id, result, seconds)),
    [commit]
  );

  const updateProfile = useCallback(
    (patch: Partial<Progress['profile']>) => commit(withProfile(current.current, patch)),
    [commit]
  );

  const resetProgress = useCallback(() => {
    const fresh = { ...emptyProgress, profile: current.current.profile };
    clearProgress()
      .catch(() => {})
      .finally(() => commit(fresh));
  }, [commit]);

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
        updateProfile,
        resetProgress,
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
