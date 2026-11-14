// Primeros pasos de la cuenta nueva (feedback del tester, 14-11-2026). Módulo puro: sin React Native.
// Se leen del progreso: lección terminada, puzzle resuelto y partida jugada.

export type FirstStepId = 'lesson' | 'puzzle' | 'game';
export type FirstStepState = 'done' | 'next' | 'later';
export type FirstStep = { id: FirstStepId; state: FirstStepState };

/** Lo mínimo del progreso que hace falta (Progress lo cumple). */
export type FirstStepsProgress = {
  lessons: Record<string, unknown>;
  puzzles: Record<string, { result?: string }>;
  games: readonly unknown[];
};

const ORDER: readonly FirstStepId[] = ['lesson', 'puzzle', 'game'];

/**
 * Estado de los tres primeros pasos, en orden: hechos, el siguiente (uno solo, el primero sin hacer)
 * y los que quedan después.
 */
export function firstSteps(progress: FirstStepsProgress): FirstStep[] {
  const done: Record<FirstStepId, boolean> = {
    lesson: Object.keys(progress.lessons).length > 0,
    puzzle: Object.values(progress.puzzles).some((p) => p.result !== 'failed'),
    game: progress.games.length > 0,
  };
  let nextAssigned = false;
  return ORDER.map((id) => {
    if (done[id]) return { id, state: 'done' as const };
    const state: FirstStepState = nextAssigned ? 'later' : 'next';
    nextAssigned = true;
    return { id, state };
  });
}

/** true cuando los tres primeros pasos están hechos (toca el festejo y desaparecen). */
export function firstStepsDone(steps: readonly FirstStep[]): boolean {
  return steps.every((s) => s.state === 'done');
}
