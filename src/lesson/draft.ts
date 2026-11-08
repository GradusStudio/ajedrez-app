// Avance guardado de una lección. Viene del almacenamiento, de un archivo importado o de Drive: se usa solo si el
// paso en el que quedó existe en la lección.
export function usableDraft<T extends { stepIndex: number }>(draft: T | undefined | null, stepCount: number): T | undefined {
  if (!draft || typeof draft.stepIndex !== 'number') return undefined;
  const i = draft.stepIndex;
  return Number.isInteger(i) && i >= 0 && i < stepCount ? draft : undefined;
}
