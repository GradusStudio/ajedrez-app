import { Lesson, Step, Unit } from '../data/lessonTypes';
import { Progress } from './progressStore';

/**
 * true: dentro de cada unidad, las lecciones se desbloquean de a una, al terminar la anterior.
 * false: todas se pueden abrir desde el inicio.
 * Entre unidades no hay bloqueo: la primera lección de cada unidad siempre está disponible,
 * para que cada uno empiece por la unidad que corresponde a su nivel.
 */
export const LOCK_LESSONS = true;

export type NodeState = 'done' | 'current' | 'open' | 'locked';

/** Estado de cada lección de una unidad. La actual es la primera sin terminar de esa unidad. */
export function lessonStates(lessons: Lesson[], progress: Progress): NodeState[] {
  const currentIndex = lessons.findIndex((l) => !progress.lessons[l.id]);
  return lessons.map((l, i) => {
    if (progress.lessons[l.id]) return 'done';
    if (i === currentIndex) return 'current';
    return LOCK_LESSONS ? 'locked' : 'open';
  });
}

/**
 * Lección sugerida para el botón "Empezar": la siguiente de la unidad donde se terminó
 * la última lección (o la unidad siguiente, si esa ya está completa). Al principio, la de la Unidad 1.
 */
export function suggestedLesson(units: Unit[], progress: Progress): Lesson | undefined {
  const firstPending = (u: Unit) => u.lessons.find((l) => !progress.lessons[l.id]);

  let lastUnit = 0;
  let lastDate = '';
  units.forEach((u, i) => {
    for (const l of u.lessons) {
      const done = progress.lessons[l.id];
      if (done && done.completedAt > lastDate) {
        lastDate = done.completedAt;
        lastUnit = i;
      }
    }
  });

  for (let k = 0; k < units.length; k++) {
    const pending = firstPending(units[(lastUnit + k) % units.length]);
    if (pending) return pending;
  }
  return undefined;
}

/**
 * Números de las unidades abiertas, en orden.
 * - Cualquier nivel distinto de `nuevo` (o con «Abrir todas las unidades»): todas.
 * - `nuevo`: la Unidad 1; una unidad con alguna lección hecha cuenta como abierta; también se abre
 *   con la prueba aprobada o al terminar todas las lecciones de la anterior.
 */
export function unitOpen(
  units: Unit[],
  progress: Progress,
  level: Progress['profile']['level'] = progress.profile.level,
  openAll = false,
): number[] {
  const everything = openAll || level !== 'nuevo';
  return units
    .filter((u, i) => {
      if (everything || i === 0) return true;
      if (u.lessons.some((l) => progress.lessons[l.id])) return true;
      if ((progress.unitTests ?? []).includes(u.unit)) return true;
      const previous = units[i - 1];
      return previous.lessons.every((l) => progress.lessons[l.id]);
    })
    .map((u) => u.unit);
}

const TEST_STEP_TYPES = new Set<Step['type']>(['move', 'line', 'quiz']);

/**
 * Ejercicios para la prueba de una unidad: uno por lección, el último de tipo move/line/quiz,
 * empezando por las últimas lecciones. Hasta `count` (6).
 */
export function unitTestSteps(unit: Unit, count = 6): Step[] {
  const steps: Step[] = [];
  for (let i = unit.lessons.length - 1; i >= 0 && steps.length < count; i--) {
    const step = [...unit.lessons[i].steps].reverse().find((s) => TEST_STEP_TYPES.has(s.type));
    if (step) steps.push(step);
  }
  return steps;
}
