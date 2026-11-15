// Datos del Perfil (spec del perfil, secciones 1 a 4). Módulo puro: probado en profileView.test.ts.
import type { OpeningCourse, Unit } from '../data/lessonTypes';
import type { Bot } from '../data/bots';
import { isPuzzleSolved, type GameRecord, type PlayerLevel, type Progress } from '../progress/progressStore';
import { unitOpen } from '../progress/path';

export type UnitCardState = 'complete' | 'current' | 'locked';
export type ProfileUnit = { unit: Unit; done: number; total: number; state: UnitCardState | null };

/**
 * Unidades con su avance para «Tu camino»: completa, la que se está cursando (la última abierta en
 * Aprender, o la primera abierta sin terminar) y cerradas para el nivel «nuevo».
 */
export function unitCards(units: Unit[], progress: Progress, level: PlayerLevel | undefined, openAllUnits: boolean): ProfileUnit[] {
  const open = new Set(unitOpen(units, progress, level, openAllUnits));
  const done = (u: Unit) => u.lessons.filter((l) => progress.lessons[l.id]).length;
  const current =
    progress.lastUnit !== undefined
      ? units.find((u) => u.unit === progress.lastUnit && open.has(u.unit) && done(u) < u.lessons.length)
      : undefined;
  const fallback = units.find((u) => open.has(u.unit) && done(u) < u.lessons.length);
  const currentUnit = current ?? fallback;

  return units.map((u) => {
    const lessonsDone = done(u);
    const total = u.lessons.length;
    const state: UnitCardState | null =
      total > 0 && lessonsDone === total ? 'complete' : !open.has(u.unit) ? 'locked' : u === currentUnit ? 'current' : null;
    return { unit: u, done: lessonsDone, total, state };
  });
}

export type BotRecord = { bot: Bot; wins: number; losses: number; draws: number; played: number; beaten: boolean };

/** Récord contra cada bot (sin la práctica de aperturas) y el próximo rival: el de menor nivel sin vencer. */
export function botRecords(bots: Bot[], games: GameRecord[]): { records: BotRecord[]; nextRival: BotRecord | undefined } {
  const records = [...bots]
    .sort((a, b) => a.elo - b.elo)
    .map((bot) => {
      const played = games.filter((g) => g.botId === bot.id && !g.practiceCourseId);
      const wins = played.filter((g) => g.result === 'win').length;
      const losses = played.filter((g) => g.result === 'loss').length;
      const draws = played.filter((g) => g.result === 'draw').length;
      return { bot, wins, losses, draws, played: played.length, beaten: wins > 0 };
    });
  return { records, nextRival: records.find((r) => !r.beaten) };
}

/** Conteos del resumen: lecciones de la ruta, cursos de aperturas completos y puzzles resueltos. */
export function profileSummary(progress: Progress, units: Unit[], openings: OpeningCourse[]) {
  const lessons = units.flatMap((u) => u.lessons);
  const puzzles = Object.keys(progress.puzzles).filter((id) => isPuzzleSolved(progress, id)).length;
  return {
    lessonsDone: lessons.filter((l) => progress.lessons[l.id]).length,
    lessonsTotal: lessons.length,
    coursesDone: openings.filter((o) => o.lessons.every((l) => progress.lessons[l.id])).length,
    coursesTotal: openings.length,
    puzzlesSolved: puzzles,
  };
}
