// Lógica pura del repaso de pasos («Paso anterior»): sin React, probada en review.test.ts.
// Un paso anterior se muestra como quedó al terminarlo; no cobra errores ni da monedas.

/** null = se ve el paso actual; un número = índice del paso ya resuelto que se está mirando. */
export type ReviewAt = number | null;

/**
 * Paso al que se va al tocar «Paso anterior», desde el paso actual o desde el que ya se está mirando.
 * Devuelve null cuando no hay ninguno antes (el primer paso).
 */
export function previousStep(current: number, reviewing: ReviewAt): number | null {
  const from = reviewing ?? current;
  return from > 0 ? from - 1 : null;
}

/**
 * Progreso de la barra mientras se revisa: los pasos completados hasta el que se mira. En revisión
 * cuenta el paso mirado como completado; en el actual, suma uno si ya se resolvió (`solvedCurrent`).
 */
export function reviewProgress(reviewing: ReviewAt, current: number, total: number, solvedCurrent: boolean): number {
  if (total <= 0) return 0;
  const shown = reviewing ?? current;
  const done = reviewing !== null || solvedCurrent ? 1 : 0;
  return Math.min(1, (shown + done) / total);
}
