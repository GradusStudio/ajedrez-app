// Marca de práctica del día en Cache Storage, para que el service worker no muestre el recordatorio si ya se practicó.

import { PRACTICE_CACHE, PRACTICE_KEY, practicedToday } from './practiceMarkLogic';
import { todayKey, type Streak } from './streak';

/**
 * Guarda la fecha de hoy bajo `PRACTICE_KEY` si la racha ya tiene una acción de hoy.
 * El service worker compara esa fecha con el día actual: al día siguiente ya no coincide y la marca vence sola.
 * Si Cache Storage falla (navegador viejo, modo privado), se ignora: la app sigue funcionando sin la marca.
 */
export function markPracticed(streak: Streak): void {
  const today = todayKey();
  if (!practicedToday(streak, today)) return;
  try {
    caches
      .open(PRACTICE_CACHE)
      .then((cache) => cache.put(PRACTICE_KEY, new Response(today)))
      .catch(() => {});
  } catch {
    // Sin Cache Storage disponible: no hay marca que guardar.
  }
}
