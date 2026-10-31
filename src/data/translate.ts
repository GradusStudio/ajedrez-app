import type { Bot } from './bots';
import type { Lesson, OpeningCourse, Step, Unit } from './lessonTypes';

// Aplica traducciones de texto sobre el contenido en español. Sin imports de React Native:
// lo usan las pruebas con tsx. El español sigue siendo la única fuente de posiciones y
// soluciones (fen, solutions, answer, orden de options): una traducción solo cambia texto.

/** Campos de texto que una traducción puede reemplazar en un paso. Cualquier otro se ignora. */
const STRING_FIELDS = ['text', 'prompt', 'hint', 'success', 'explanation'] as const;
/** Listas de texto alineadas con las del español (misma cantidad de elementos). */
const LIST_FIELDS = ['options', 'feedback'] as const;

type StringField = (typeof STRING_FIELDS)[number];
type ListField = (typeof LIST_FIELDS)[number];

/** Texto traducido de un paso. `notes` va alineada con `moves` de un paso `line`. */
export type StepText = Partial<Record<StringField, string>> & Partial<Record<ListField | 'notes', string[]>>;
export type LessonText = { title?: string; summary?: string; steps?: Record<string, StepText> };
export type UnitText = { title?: string; lessons?: Record<string, LessonText> };
export type OpeningText = { name?: string; summary?: string; lessons?: Record<string, LessonText> };
export type BotText = {
  name?: string;
  tagline?: string;
  trait?: string;
  teaches?: string;
  lines?: Partial<Bot['lines']>;
  teaching?: { welcome?: string[]; close?: string[]; reminder?: Partial<Bot['teaching']['reminder']> };
};
/** Archivos de un idioma: texto por número de unidad, por id de curso y por id de bot. */
export type LanguageFiles = {
  units?: Record<string, UnitText>;
  openings?: Record<string, OpeningText>;
  bots?: Record<string, BotText>;
};

const isText = (v: unknown): v is string => typeof v === 'string' && v !== '';
const isList = (v: unknown): v is string[] => Array.isArray(v) && v.every(isText);

function applyStepText(step: Step, text: StepText | undefined): Step {
  if (!text) return step;
  const out: Record<string, unknown> = { ...step };
  for (const field of STRING_FIELDS) {
    if (field in step && isText(text[field])) out[field] = text[field];
  }
  for (const field of LIST_FIELDS) {
    const original = (step as unknown as Record<string, unknown>)[field];
    const translated = text[field];
    if (!Array.isArray(original) || !Array.isArray(translated) || translated.length !== original.length) continue;
    // Un '' solo vale donde el español también lo tiene (en feedback, la opción correcta); en el resto se exige texto.
    const valid = translated.every((t, i) => (original[i] === '' ? t === '' : isText(t)));
    if (valid) out[field] = translated;
  }
  // Las jugadas sin nota llevan '' en la lista; las que tienen nota exigen texto.
  const notes = text.notes;
  if (step.type === 'line' && Array.isArray(notes) && notes.length === step.moves.length) {
    const valid = step.moves.every((m, i) => m.note === undefined || isText(notes[i]));
    if (valid) out.moves = step.moves.map((m, i) => (m.note !== undefined ? { ...m, note: notes[i] } : m));
  }
  return out as Step;
}

/** Lección con el texto traducido. Sin traducción, o para lo que falte, queda el español. */
export function applyLessonText(lesson: Lesson, text: LessonText | undefined): Lesson {
  if (!text) return lesson;
  const steps = text.steps;
  return {
    ...lesson,
    title: isText(text.title) ? text.title : lesson.title,
    summary: isText(text.summary) ? text.summary : lesson.summary,
    steps: steps ? lesson.steps.map((s) => applyStepText(s, steps[s.id])) : lesson.steps,
  };
}

function applyLessons(lessons: Lesson[], text: Record<string, LessonText> | undefined): Lesson[] {
  return text ? lessons.map((l) => applyLessonText(l, text[l.id])) : lessons;
}

export function applyUnitText(unit: Unit, text: UnitText | undefined): Unit {
  if (!text) return unit;
  return { ...unit, title: isText(text.title) ? text.title : unit.title, lessons: applyLessons(unit.lessons, text.lessons) };
}

export function applyOpeningText(course: OpeningCourse, text: OpeningText | undefined): OpeningCourse {
  if (!text) return course;
  return {
    ...course,
    name: isText(text.name) ? text.name : course.name,
    summary: isText(text.summary) ? text.summary : course.summary,
    lessons: applyLessons(course.lessons, text.lessons),
  };
}

/** Misma cantidad de frases que en español, o se queda el español. */
function phrases(original: string[], translated: unknown): string[] {
  return isList(translated) && translated.length === original.length ? translated : original;
}

export function applyBotText(bot: Bot, text: BotText | undefined): Bot {
  if (!text) return bot;
  const pick = (original: string, translated: unknown) => (isText(translated) ? translated : original);
  const lines = { ...bot.lines };
  for (const key of Object.keys(lines) as (keyof Bot['lines'])[]) lines[key] = pick(lines[key], text.lines?.[key]);
  const reminder = { ...bot.teaching.reminder };
  for (const key of Object.keys(reminder) as (keyof Bot['teaching']['reminder'])[]) {
    reminder[key] = pick(reminder[key], text.teaching?.reminder?.[key]);
  }
  return {
    ...bot,
    name: pick(bot.name, text.name),
    tagline: pick(bot.tagline, text.tagline),
    trait: pick(bot.trait, text.trait),
    teaches: pick(bot.teaches, text.teaches),
    lines,
    teaching: {
      welcome: phrases(bot.teaching.welcome, text.teaching?.welcome),
      close: phrases(bot.teaching.close, text.teaching?.close),
      reminder,
    },
  };
}

export type Content = { units: Unit[]; openings: OpeningCourse[]; bots: Bot[] };

/** Contenido en español con los archivos de un idioma encima. Sin archivos, devuelve el español. */
export function buildContent(base: Content, files: LanguageFiles | undefined): Content {
  if (!files) return base;
  return {
    units: base.units.map((u) => applyUnitText(u, files.units?.[String(u.unit)])),
    openings: base.openings.map((o) => applyOpeningText(o, files.openings?.[o.id])),
    bots: base.bots.map((b) => applyBotText(b, files.bots?.[b.id])),
  };
}
