// Cuándo se puede aplicar una versión nueva de la web (recargar la página) sin cortar lo que el usuario hace.
// Módulo puro para poder probarlo; lo usa register.web.ts.

/** Primer tramo de las rutas donde una recarga cortaría algo a medias. */
const ACTIVITY_ROUTES = ['leccion', 'puzzle', 'partida', 'quiz-partida', 'revision', 'analisis-libre'];

/** true si `pathname` es una lección, un puzzle, una partida, una revisión, el quiz de la revisión o el análisis libre. */
export function isInsideActivity(pathname: string): boolean {
  const first = pathname.split('/').find((part) => part !== '') ?? '';
  return ACTIVITY_ROUTES.includes(first);
}
