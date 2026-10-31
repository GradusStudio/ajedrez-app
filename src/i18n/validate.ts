import { sanToSpanish, usesLettersOf } from '../chess/notation';
import type { Bot } from '../data/bots';
import { languageFiles, localizedContent } from '../data/localized';
import type { Step } from '../data/lessonTypes';
import { LIST_FIELDS, STRING_FIELDS, type Content, type LanguageFiles, type LessonText, type StepText } from '../data/translate';
import type { Language } from './languages';

// Comprobación automática de una traducción contra el español (que es la referencia).
// Módulo puro, sin React Native: lo usan las pruebas con npm test.

/** Ids de pasos donde las jugadas nombradas pueden diferir del español (lecciones que enseñan la notación). */
export const MOVE_EXCEPTIONS: string[] = [];

/**
 * Jugadas escritas en un texto. Una jugada lleva siempre una casilla (a-h + 1-8) o es un enroque, así que
 * "Una", "Dama", "Ta" no cuentan. La letra de pieza es cualquier mayúscula: una letra de otro idioma no se
 * descarta en silencio, aparece como jugada y, al no coincidir con el español, se revisa a mano.
 */
export function namedMoves(text: string): string[] {
  const re = /(?<![\p{L}\d])(?:[O0]-[O0](?:-[O0])?|[A-Z]?[a-h]?[1-8]?x?[a-h][1-8](?:=[A-Z])?)[+#]?(?![\p{L}\d])/gu;
  return (text.match(re) ?? []).map((m) => m.replace(/0/g, 'O'));
}

/** Jugada escrita en la notación de `language`, con las letras de pieza españolas: "Lxf7+" (de) → "Axf7+". */
export function toSpanishLetters(san: string, language: Language): string {
  return sanToSpanish(san, language);
}

const markers = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(',');
const isText = (v: unknown): v is string => typeof v === 'string' && v !== '';

type Ctx = { language: Language; exceptions: Set<string>; problems: string[] };

/** Un texto: no vacío, mismos marcadores y (salvo excepción) mismas jugadas que el español. */
function checkText(c: Ctx, where: string, es: string, tr: unknown, stepId?: string): void {
  if (!isText(tr)) return void c.problems.push(`${where}: falta o está vacío`);
  if (markers(es) !== markers(tr)) c.problems.push(`${where}: marcadores distintos (es: ${markers(es) || '-'}; ${c.language}: ${markers(tr) || '-'})`);
  if (stepId !== undefined && c.exceptions.has(stepId)) return;
  // Una letra de pieza de otro idioma (p. ej. un «Cf3» español que quedó en inglés) no se convierte y pasaría por igual.
  const foreign = c.language === 'es' ? [] : namedMoves(tr).filter((m) => !usesLettersOf(m, c.language));
  if (foreign.length) c.problems.push(`${where}: letras de pieza que no son de ${c.language}: ${foreign.join(' ')}`);
  const want = namedMoves(es).join(' ');
  const got = namedMoves(tr).map((m) => toSpanishLetters(m, c.language)).join(' ');
  if (want !== got) c.problems.push(`${where}: jugadas distintas, revisar a mano (es: ${want || '-'}; ${c.language}: ${got || '-'})`);
}

/** Lista de textos del mismo largo; donde el español tiene '' la traducción también. */
function checkList(c: Ctx, where: string, es: string[], tr: unknown, stepId?: string): void {
  if (!Array.isArray(tr) || tr.length !== es.length) return void c.problems.push(`${where}: lista de otro largo (se esperan ${es.length})`);
  es.forEach((e, i) => {
    if (e === '') {
      if (tr[i] !== '') c.problems.push(`${where}[${i}]: debe ir vacío`);
    } else checkText(c, `${where}[${i}]`, e, tr[i], stepId);
  });
}

/** Ids de `have` que no están en `known`. */
function extras(c: Ctx, where: string, have: object | undefined, known: string[]): void {
  for (const id of Object.keys(have ?? {})) if (!known.includes(id)) c.problems.push(`${where}: sobra la clave «${id}»`);
}

function checkStep(c: Ctx, where: string, step: Step, tr: StepText | undefined): void {
  if (!tr) return void c.problems.push(`${where}: falta el paso`);
  const es = step as unknown as Record<string, unknown>;
  for (const f of STRING_FIELDS) {
    if (isText(es[f])) checkText(c, `${where}.${f}`, es[f], tr[f], step.id);
  }
  for (const f of LIST_FIELDS) {
    if (Array.isArray(es[f])) checkList(c, `${where}.${f}`, es[f] as string[], tr[f], step.id);
  }
  if (step.type === 'line' && step.moves.some((m) => m.note !== undefined)) {
    checkList(c, `${where}.notes`, step.moves.map((m) => m.note ?? ''), tr.notes, step.id);
  }
  extras(c, where, tr, [...STRING_FIELDS, ...LIST_FIELDS, 'notes']);
}

function checkLessons(c: Ctx, where: string, lessons: Content['units'][number]['lessons'], tr: Record<string, LessonText> | undefined): void {
  extras(c, where, tr, lessons.map((l) => l.id));
  for (const l of lessons) {
    const w = `${where} > ${l.id}`;
    const lt = tr?.[l.id];
    if (!lt) {
      c.problems.push(`${w}: falta la lección`);
      continue;
    }
    checkText(c, `${w}.title`, l.title, lt.title);
    checkText(c, `${w}.summary`, l.summary, lt.summary);
    extras(c, w, lt.steps, l.steps.map((s) => s.id));
    for (const s of l.steps) checkStep(c, `${w} > ${s.id}`, s, lt.steps?.[s.id]);
  }
}

function checkBot(c: Ctx, es: Bot, tr: NonNullable<LanguageFiles['bots']>[string] | undefined): void {
  const w = `bot ${es.id}`;
  if (!tr) return void c.problems.push(`${w}: falta el bot`);
  for (const f of ['name', 'tagline', 'trait', 'teaches'] as const) checkText(c, `${w}.${f}`, es[f], tr[f]);
  for (const f of Object.keys(es.lines) as (keyof Bot['lines'])[]) checkText(c, `${w}.lines.${f}`, es.lines[f], tr.lines?.[f]);
  for (const f of ['welcome', 'close'] as const) checkList(c, `${w}.teaching.${f}`, es.teaching[f], tr.teaching?.[f]);
  for (const f of Object.keys(es.teaching.reminder) as (keyof Bot['teaching']['reminder'])[]) {
    checkText(c, `${w}.teaching.reminder.${f}`, es.teaching.reminder[f], tr.teaching?.reminder?.[f]);
  }
  // Los bots no usan exclamaciones (design.md).
  if (JSON.stringify(tr).includes('!')) c.problems.push(`${w}: tiene un signo «!»`);
}

/** Problemas de una traducción frente al español. Puro: recibe los dos contenidos y las excepciones. */
export function checkTranslation(language: Language, spanish: Content, files: LanguageFiles | undefined, exceptions: Set<string>): string[] {
  const c: Ctx = { language, exceptions, problems: [] };
  extras(c, 'units', files?.units, spanish.units.map((u) => String(u.unit)));
  for (const u of spanish.units) {
    const ut = files?.units?.[String(u.unit)];
    if (!ut) c.problems.push(`unidad ${u.unit}: falta`);
    else {
      checkText(c, `unidad ${u.unit}.title`, u.title, ut.title);
      checkLessons(c, `unidad ${u.unit}`, u.lessons, ut.lessons);
    }
  }
  extras(c, 'openings', files?.openings, spanish.openings.map((o) => o.id));
  for (const o of spanish.openings) {
    const ot = files?.openings?.[o.id];
    if (!ot) c.problems.push(`apertura ${o.id}: falta`);
    else {
      checkText(c, `apertura ${o.id}.name`, o.name, ot.name);
      checkText(c, `apertura ${o.id}.summary`, o.summary, ot.summary);
      checkLessons(c, `apertura ${o.id}`, o.lessons, ot.lessons);
    }
  }
  extras(c, 'bots', files?.bots, spanish.bots.map((b) => b.id));
  for (const b of spanish.bots) checkBot(c, b, files?.bots?.[b.id]);
  return c.problems;
}

/** Problemas de la traducción de un idioma (lista vacía: está completa). El español es la referencia. */
export function findProblems(language: Language): string[] {
  return checkTranslation(language, localizedContent('es'), languageFiles(language), new Set(MOVE_EXCEPTIONS));
}
