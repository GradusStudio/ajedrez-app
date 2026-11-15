// Logros del Perfil (spec del perfil, sección 5). Módulo puro: se calculan con datos que ya existen.
// Sin React Native: probado en achievements.test.ts.
import type { OpeningCourse, Unit } from '../data/lessonTypes';
import type { Bot } from '../data/bots';
import { currentRating } from './puzzleRating';
import { isPuzzleSolved, type Progress } from './progressStore';

export type AchievementColor = 'verde' | 'naranja' | 'dorado' | 'azul' | 'violeta' | 'rojo';

export type AchievementId =
  | 'firstLesson'
  | 'unit1'
  | 'unit2'
  | 'unit3'
  | 'fiveClean'
  | 'streak3'
  | 'streak7'
  | 'streak30'
  | 'puzzles10'
  | 'puzzles100'
  | 'rating1500'
  | 'botFirst'
  | 'botFive'
  | 'beatAda'
  | 'course1'
  | 'course3'
  | 'turningPoint'
  | 'collector';

export type Achievement = {
  id: AchievementId;
  color: AchievementColor;
  earned: boolean;
  /** Avance hacia la meta, para los que se prestan a mostrarlo («6/7»). */
  progress?: { value: number; goal: number };
};

/** Lo que hace falta del contenido para calcular los logros. */
export type AchievementContent = { units: Unit[]; openings: OpeningCourse[]; bots: Bot[] };

/** Logro de la tabla de la spec, en el orden en que se muestra. */
const COLOR: Record<AchievementId, AchievementColor> = {
  firstLesson: 'verde',
  unit1: 'verde',
  unit2: 'verde',
  unit3: 'verde',
  fiveClean: 'verde',
  streak3: 'naranja',
  streak7: 'naranja',
  streak30: 'naranja',
  puzzles10: 'dorado',
  puzzles100: 'dorado',
  rating1500: 'dorado',
  botFirst: 'azul',
  botFive: 'azul',
  beatAda: 'azul',
  course1: 'violeta',
  course3: 'violeta',
  turningPoint: 'violeta',
  collector: 'rojo',
};

const ORDER = Object.keys(COLOR) as AchievementId[];

/** Racha más larga de lecciones con 0 errores, en orden de la primera vez que se completaron. */
function cleanLessonStreak(progress: Progress): number {
  const dates = Object.values(progress.lessons).sort((a, b) => a.completedAt.localeCompare(b.completedAt));
  let best = 0;
  let run = 0;
  for (const lesson of dates) {
    if (lesson.errors === 0) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
  }
  return best;
}

const lessonsDone = (units: Unit[], progress: Progress): number =>
  units.flatMap((u) => u.lessons).filter((l) => progress.lessons[l.id]).length;

const unitProgress = (unit: Unit | undefined, progress: Progress): { value: number; goal: number } => ({
  value: unit ? unit.lessons.filter((l) => progress.lessons[l.id]).length : 0,
  goal: unit?.lessons.length ?? 0,
});

const isUnitDone = (unit: Unit | undefined, progress: Progress): boolean =>
  !!unit && unit.lessons.every((l) => progress.lessons[l.id]);

const coursesDone = (openings: OpeningCourse[], progress: Progress): number =>
  openings.filter((o) => o.lessons.every((l) => progress.lessons[l.id])).length;

const botsBeaten = (progress: Progress): number =>
  new Set(progress.games.filter((g) => g.result === 'win' && !g.practiceCourseId).map((g) => g.botId)).size;

const puzzlesSolved = (progress: Progress): number =>
  Object.keys(progress.puzzles).filter((id) => isPuzzleSolved(progress, id)).length;

const bestRating = (progress: Progress): number =>
  Math.max(currentRating(progress), ...(progress.puzzleRating?.history ?? []).map((p) => p.rating));

/** Los 18 logros con su estado actual y, cuando corresponde, el avance hacia la meta. */
export function achievements(progress: Progress, content: AchievementContent): Achievement[] {
  const { units, openings } = content;
  const lessons = lessonsDone(units, progress);
  const clean = cleanLessonStreak(progress);
  const solved = puzzlesSolved(progress);
  const beaten = botsBeaten(progress);
  const courses = coursesDone(openings, progress);
  const ratings = bestRating(progress);
  const unitOf = (n: number) => units.find((u) => u.unit === n);
  const adaWin = progress.games.some((g) => g.botId === 'ada' && g.result === 'win' && !g.practiceCourseId);

  const value = (id: AchievementId, earned: boolean, p?: { value: number; goal: number }): Achievement => ({
    id,
    color: COLOR[id],
    earned,
    ...(p ? { progress: p } : {}),
  });

  const byId: Record<AchievementId, Achievement> = {
    firstLesson: value('firstLesson', lessons >= 1, { value: lessons, goal: 1 }),
    unit1: value('unit1', isUnitDone(unitOf(1), progress), unitProgress(unitOf(1), progress)),
    unit2: value('unit2', isUnitDone(unitOf(2), progress), unitProgress(unitOf(2), progress)),
    unit3: value('unit3', isUnitDone(unitOf(3), progress), unitProgress(unitOf(3), progress)),
    fiveClean: value('fiveClean', clean >= 5, { value: clean, goal: 5 }),
    streak3: value('streak3', progress.streak.best >= 3, { value: progress.streak.best, goal: 3 }),
    streak7: value('streak7', progress.streak.best >= 7, { value: progress.streak.best, goal: 7 }),
    streak30: value('streak30', progress.streak.best >= 30, { value: progress.streak.best, goal: 30 }),
    puzzles10: value('puzzles10', solved >= 10, { value: solved, goal: 10 }),
    puzzles100: value('puzzles100', solved >= 100, { value: solved, goal: 100 }),
    rating1500: value('rating1500', ratings >= 1500),
    botFirst: value('botFirst', beaten >= 1, { value: beaten, goal: 1 }),
    botFive: value('botFive', beaten >= 5, { value: beaten, goal: 5 }),
    beatAda: value('beatAda', adaWin),
    course1: value('course1', courses >= 1, { value: courses, goal: 1 }),
    course3: value('course3', courses >= 3, { value: courses, goal: 3 }),
    turningPoint: value('turningPoint', progress.turningPoints.length > 0),
    collector: value('collector', progress.pieceSets.length + progress.boardThemes.length > 0),
  };
  return ORDER.map((id) => byId[id]);
}

/** Cuántos logros se consiguieron y cuántos hay en total. */
export function achievementCount(list: readonly Achievement[]): { earned: number; total: number } {
  return { earned: list.filter((a) => a.earned).length, total: list.length };
}

/** Logros recién conseguidos que todavía no se vieron (para la etiqueta «Nuevo»). */
export function newAchievements(list: readonly Achievement[], seen: readonly string[]): AchievementId[] {
  return list.filter((a) => a.earned && !seen.includes(a.id)).map((a) => a.id);
}
