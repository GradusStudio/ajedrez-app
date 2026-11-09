import type { OngoingGame } from './progressStore';

// Quién puede escribir la partida sin terminar. Con la sincronización, otro dispositivo puede retomarla, terminarla o
// empezar otra mientras esta pantalla sigue abierta; sin este control, el siguiente guardado resucitaría o pisaría esa partida.

/**
 * ¿Esta pantalla puede guardar su partida? `stored` es lo guardado ahora (ya con lo que llegó de otros dispositivos),
 * `mine` la identidad de la partida de esta pantalla (su `startedAt`) y `savedBefore` si ya la guardó alguna vez.
 * Sí: no hay nada guardado y es su primer guardado, o lo guardado es su misma partida.
 * No: hay otra partida guardada, o ya la guardó y ahora no hay nada (se terminó o abandonó en otro lado).
 */
export function shouldSaveOngoing(stored: OngoingGame | undefined, mine: { startedAt: string } | null, savedBefore: boolean): boolean {
  if (!mine) return false;
  if (!stored) return !savedBefore;
  return stored.startedAt === mine.startedAt;
}

/** ¿Lo guardado es la partida de esta pantalla? Solo entonces terminarla puede borrarlo. */
export function ownsOngoing(stored: OngoingGame | undefined, mine: { startedAt: string } | null): boolean {
  return !!stored && !!mine && stored.startedAt === mine.startedAt;
}
