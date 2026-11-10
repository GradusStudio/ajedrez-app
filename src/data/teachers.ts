import { Bot, findBot } from './bots';
import { openings } from './openings';

// Quién enseña cada lección. Diseño: docs/superpowers/specs/2026-10-30-personajes-design.md.
// Sin imports de React Native: lo usan las pruebas con tsx.

/** Ruta de Aprender: bot -> ids de lección (ids reales de src/data/unidad-*.json). */
const PATH_TEACHERS: Record<string, string[]> = {
  pipo: ['u1-l01', 'u1-l02', 'u1-l03', 'u1-l04', 'u1-l05', 'u1-l06', 'u1-l07', 'u1-l10', 'u1-l12', 'u7-l05', 'u9-l01'],
  lola: ['u1-l08', 'u1-l09', 'u1-l11', 'u2-l04', 'u2-l05', 'u9-l04'],
  ramiro: ['u2-l01', 'u2-l03', 'u2-l06', 'u4-l01', 'u4-l02', 'u9-l05'],
  tomas: ['u2-l02', 'u3-l07', 'u4-l07', 'u7-l01', 'u7-l03'],
  sofia: ['u3-l01', 'u3-l02', 'u3-l05', 'u3-l06', 'u3-l08', 'u3-l09', 'u7-l02', 'u7-l04', 'u7-l08'],
  valentina: ['u3-l03', 'u3-l04', 'u7-l06', 'u7-l07'],
  camila: ['u4-l03', 'u4-l04', 'u4-l06', 'u6-l03', 'u9-l03', 'u9-l06'],
  bruno: ['u4-l05', 'u6-l02', 'u9-l02'],
  ivo: ['u5-l01', 'u5-l02', 'u5-l03', 'u5-l04', 'u5-l05', 'u5-l06', 'u8-l01', 'u8-l02', 'u8-l03', 'u8-l04', 'u8-l05', 'u8-l06'],
  ada: ['u6-l01', 'u6-l04'],
};

/** Aperturas: bot -> ids de curso. Un curso cubre todas sus lecciones. Ada no enseña aperturas. */
const COURSE_TEACHERS: Record<string, string[]> = {
  pipo: ['italian'],
  lola: ['london', 'scandinavian'],
  tomas: ['vienna', 'albin'],
  valentina: ['sicilian', 'kings-gambit', 'danish', 'bdg'],
  ramiro: ['scotch', 'french', 'petrov', 'alapin'],
  camila: ['english', 'catalan', 'queens-gambit', 'queens-gambit-declined', 'modern'],
  bruno: ['caro-kann', 'kia', 'pirc'],
  sofia: ['evans', 'kings-indian', 'dragon'],
  ivo: ['ruy-lopez', 'nimzo-indian', 'rossolimo', 'queens-gambit-accepted'],
};

function invert(table: Record<string, string[]>): Map<string, string> {
  const map = new Map<string, string>();
  for (const [bot, ids] of Object.entries(table)) for (const id of ids) map.set(id, bot);
  return map;
}

const byLesson = invert(PATH_TEACHERS);
const byCourse = invert(COURSE_TEACHERS);
const courseOfLesson = new Map(openings.flatMap((c) => c.lessons.map((l) => [l.id, c.id] as const)));

/** Id del bot que enseña un curso de aperturas, o undefined si no tiene profesor. */
export function teacherForCourse(courseId: string): string | undefined {
  return byCourse.get(courseId);
}

/** Id del bot que enseña una lección, o undefined si no se conoce. */
export function teacherIdOrNull(lessonId: string): string | undefined {
  const course = courseOfLesson.get(lessonId);
  return course ? byCourse.get(course) : byLesson.get(lessonId);
}

/** Bot que enseña una lección. Si no se conoce, Don Ramiro. */
export function teacherForLesson(lessonId: string): Bot {
  const bot = findBot(teacherIdOrNull(lessonId) ?? 'ramiro');
  if (!bot) throw new Error('Falta Don Ramiro en bots.json');
  return bot;
}

/**
 * Elige una frase al azar, sin repetir la anterior si hay otra.
 * `random` devuelve un número en [0, 1) (se puede inyectar en pruebas).
 */
export function pickPhrase(list: string[], previous?: string, random: () => number = Math.random): string {
  const options = list.length > 1 ? list.filter((p) => p !== previous) : list;
  return options[Math.floor(random() * options.length)];
}
