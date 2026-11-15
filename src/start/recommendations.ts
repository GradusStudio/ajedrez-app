import type { PlayerLevel } from '../progress/progressStore';

// Qué bot y qué curso se recomiendan en Inicio según el nivel de la bienvenida. Módulo puro: sin React Native.

/** Índice del bot recomendado (los bots vienen de menor a mayor Elo). */
export function recommendedBotIndex(level: PlayerLevel): number {
  return level === 'nuevo' ? 0 : level === 'basico' ? 2 : 4;
}

/** Bot recomendado para el nivel; con una lista más corta, el último; sin bots, undefined. */
export function recommendedBotFor<T>(level: PlayerLevel, bots: readonly T[]): T | undefined {
  const index = Math.min(recommendedBotIndex(level), Math.max(0, bots.length - 1));
  return bots[index] ?? bots[0];
}

/** Id del curso recomendado para el nivel. */
export function recommendedCourseId(level: PlayerLevel): string {
  return level === 'nuevo' ? 'italian' : level === 'basico' ? 'london' : 'scotch';
}

/** Curso recomendado; si ese id no está, el primero de la lista. */
export function recommendedCourseFor<T extends { id: string }>(level: PlayerLevel, courses: readonly T[]): T | undefined {
  const id = recommendedCourseId(level);
  return courses.find((c) => c.id === id) ?? courses[0];
}
