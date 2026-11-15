import { Chess } from 'chess.js';
import type { Level, Puzzle } from './puzzles';
import type { PuzzleSource } from './source';
import { todayKey, type Progress } from '../progress/progressStore';

/** Posición final de un puzzle (resuelto o con la solución vista), para el tablero del puzzle del día. */
export function puzzleFinalFen(puzzle: Puzzle): string {
  const chess = new Chess(puzzle.fen);
  try {
    for (const uci of puzzle.moves) {
      chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
    }
    return chess.fen();
  } catch {
    return puzzle.fen;
  }
}

export type WeekState = 'solved' | 'seen' | 'none';

/** Los siete días de la semana de `today` (lunes a domingo), con su clave local `YYYY-MM-DD`. */
export function weekDays(today = new Date()): { key: string; date: Date }[] {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return { key: todayKey(date), date };
  });
}

/** Estado de cada día de la semana para el puzzle del día: resuelto, con la solución vista o sin jugar. */
export async function dailyWeek(
  progress: Pick<Progress, 'puzzles'>,
  source: Pick<PuzzleSource, 'daily'>,
  today = new Date()
): Promise<{ key: string; state: WeekState }[]> {
  return Promise.all(
    weekDays(today).map(async ({ key, date }) => {
      const puzzle = await source.daily(date).catch(() => undefined);
      const record = puzzle ? progress.puzzles[puzzle.id] : undefined;
      const state: WeekState = !record ? 'none' : record.result === 'failed' ? 'seen' : 'solved';
      return { key, state };
    })
  );
}

/** Puzzles resueltos de un tema (`null` = todos), contados solo desde que se guardan los temas. */
export function themeSolvedCount(progress: Pick<Progress, 'puzzles'>, theme: string | null): number {
  return Object.entries(progress.puzzles).filter(
    ([, record]) => record.result !== 'failed' && (!theme || record.themes?.includes(theme))
  ).length;
}

/** Cuántos puzzles hay de un tema en todos los niveles (`null` = todos). */
export function themeCount(source: Pick<PuzzleSource, 'count' | 'total'>, levels: readonly Level[], theme: string | null): number {
  return theme ? levels.reduce((sum, level) => sum + source.count(level, theme), 0) : source.total;
}

export type QuantityUnit = 'full' | 'thousands' | 'millions';

/** Redondeo de una cantidad grande para mostrarla: «820 mil», «6,2 M». */
export function quantity(n: number): { value: number; unit: QuantityUnit } {
  if (n >= 1_000_000) return { value: Math.round(n / 100_000) / 10, unit: 'millions' };
  if (n >= 1000) return { value: Math.round(n / 1000), unit: 'thousands' };
  return { value: n, unit: 'full' };
}

/** Cambio del nivel de puzzles en los últimos siete días (desde el primer punto del historial en la ventana). */
export function weekRatingDelta(history: readonly { at: string; rating: number }[], rating: number, today = new Date()): number {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  start.setDate(start.getDate() - 6);
  const first = history.find((p) => new Date(p.at) >= start);
  return first ? rating - first.rating : 0;
}
