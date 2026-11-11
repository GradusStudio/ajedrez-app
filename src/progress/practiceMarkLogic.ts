// Marca local de práctica del día: lógica pura, sin navegador (practiceMark.web.ts la usa).

import type { Streak } from './streak';

/** Caché de Cache Storage donde se guarda la marca; el service worker lee la misma (scripts/push-sw.js). */
export const PRACTICE_CACHE = 'gradus-practica';
/** Clave de la marca dentro de esa caché. */
export const PRACTICE_KEY = '/app/practica-hoy';

/** true si la racha ya registró alguna acción hoy (lección, puzzle o bot). La fecha de la marca es la de hoy. */
export function practicedToday(streak: Streak, today: string): boolean {
  const a = streak.actions;
  return !!a && a.date === today && (a.lesson || a.puzzle || a.bot);
}
