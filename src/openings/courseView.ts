import { Chess, type Square } from 'chess.js';
import { botsForOpening, type Bot } from '../data/bots';
import type { Lesson, LineMove, LineStep, OpeningCourse } from '../data/lessonTypes';

// Datos de la ficha del curso (tarea 32, spec «aperturas y volver», sección 2). Todo puro y probado: la línea
// principal con sus posiciones, la notación numerada, los grupos de lecciones, el progreso y los bots del curso.

/** Posición del tablero después de cada jugada de una línea (la primera es la de partida). */
export type LineFrame = { fen: string; last: { from: Square; to: Square } | null };

/** Posiciones de una línea: la de partida y una por jugada. Se detiene si una jugada no aplica. */
export function lineFrames(step: Pick<LineStep, 'fen' | 'moves'>): LineFrame[] {
  const frames: LineFrame[] = [{ fen: step.fen, last: null }];
  const chess = new Chess(step.fen);
  for (const move of step.moves) {
    const from = move.uci.slice(0, 2) as Square;
    const to = move.uci.slice(2, 4) as Square;
    try {
      chess.move({ from, to, promotion: move.uci[4] ?? 'q' });
    } catch {
      break;
    }
    frames.push({ fen: chess.fen(), last: { from, to } });
  }
  return frames;
}

/** Una jugada numerada, para pintar la línea completa con la actual resaltada. */
export type NotationMove = { no: number; white: boolean; san: string };

/**
 * Jugadas numeradas desde la posición de partida del paso: «1. d4 d5 2. Af4 …». Si la línea empieza con las
 * negras, el primer número lleva puntos suspensivos (23… Cxe5).
 */
export function lineNotation(step: Pick<LineStep, 'fen' | 'moves'>): NotationMove[] {
  const [, turn, , , , full] = step.fen.split(' ');
  let moveNo = Number(full) || 1;
  let white = turn !== 'b';
  return step.moves.map((move) => {
    const token = { no: moveNo, white, san: move.san };
    if (!white) moveNo++;
    white = !white;
    return token;
  });
}

/** La línea principal del curso, con todas sus posiciones: el paso `line` de la lección `l02`. */
export type CourseLine = { startFen: string; moves: LineMove[]; frames: LineFrame[] };

export function mainLine(course: OpeningCourse): CourseLine | null {
  const lesson = course.lessons.find((l) => l.id === `${course.id}-l02`) ?? course.lessons.find((l) => l.order === 2);
  const step = lesson?.steps.find((s): s is LineStep => s.type === 'line');
  if (!step) return null;
  return { startFen: step.fen, moves: step.moves, frames: lineFrames(step) };
}

export type LessonGroupId = 'essentials' | 'lines' | 'review';
export type LessonGroup = { id: LessonGroupId; lessons: Lesson[] };

/**
 * Lecciones agrupadas como en la ficha: «Lo esencial» (la idea y la línea principal), «Variantes y trampas»
 * (las guías) y «Repaso final». Devuelve los tres grupos en orden; la pantalla no dibuja los vacíos.
 */
export function lessonGroups(course: OpeningCourse): LessonGroup[] {
  const sorted = [...course.lessons].sort((a, b) => a.order - b.order);
  const isReview = (l: Lesson) => l.id === `${course.id}-l04`;
  const essentials = sorted.filter((l) => !isReview(l) && l.order <= 2);
  const review = sorted.filter(isReview);
  const lines = sorted.filter((l) => !essentials.includes(l) && !isReview(l));
  return [
    { id: 'essentials', lessons: essentials },
    { id: 'lines', lessons: lines },
    { id: 'review', lessons: review },
  ];
}

export type CourseSummary = { done: number; total: number; next: Lesson | null; allDone: boolean };

/** Progreso del curso y próxima lección (la primera sin terminar, en el orden del curso). */
export function courseSummary(course: OpeningCourse, isDone: (lessonId: string) => boolean): CourseSummary {
  const total = course.lessons.length;
  const done = course.lessons.filter((l) => isDone(l.id)).length;
  return { done, total, next: course.lessons.find((l) => !isDone(l.id)) ?? null, allDone: done === total };
}

/** Bots que tienen el curso en su repertorio, del más flojo al más fuerte (la misma regla que la partida). */
export { botsForOpening };

/** Bot para practicar el curso: el más flojo que lo juega; si ninguno, Don Ramiro (igual que `botForOpening`). */
export function practiceBotForOpening(courseId: string, all: Bot[]): Bot {
  return botsForOpening(courseId, all)[0] ?? all.find((b) => b.id === 'ramiro') ?? all[0];
}
