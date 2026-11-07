import { migrate, type Progress, type StoredProgress } from './progressStore';

// Archivo de copia del progreso: lo que el usuario guarda y vuelve a cargar a mano (Ajustes > Datos).

export type ProgressFileError = 'notJson' | 'notGradus' | 'tooNew';
export type ProgressFileResult = { ok: true; progress: Progress } | { ok: false; error: ProgressFileError };

/** Versión del progreso que esta app entiende (Progress.version). */
const CURRENT_VERSION = 4;
/** Id fijo con el que se migra un archivo de las versiones 1 a 3: importarlo dos veces no suma dos veces. */
const LEGACY_DEVICE_ID = 'legacy';

export function progressToFile(p: Progress, now: Date): string {
  return JSON.stringify({ app: 'gradus', kind: 'progress', exportedAt: now.toISOString(), progress: p });
}

const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
/** Tope de cualquier contador de un archivo (monedas, errores, jugadas): más allá es un archivo dañado o inventado. */
const MAX_COUNT = 1_000_000_000;
const isCount = (x: unknown) => typeof x === 'number' && Number.isFinite(x) && x >= 0 && x <= MAX_COUNT;
const isString = (x: unknown) => typeof x === 'string';
const isStrings = (x: unknown) => Array.isArray(x) && x.every(isString);
const isStringOrNull = (x: unknown) => x === null || isString(x);
/** Claves que, usadas como `registro[clave]`, tocan prototipos: un registro del archivo no puede tenerlas. */
const UNSAFE_KEYS = ['__proto__', 'constructor', 'prototype'];
const isRecord = (x: unknown): x is Record<string, unknown> => isObject(x) && !Object.keys(x).some((k) => UNSAFE_KEYS.includes(k));
const everyValue = (x: unknown, ok: (v: Record<string, unknown>) => boolean) =>
  isRecord(x) && Object.values(x).every((v) => isObject(v) && ok(v));
const everyItem = (x: unknown, ok: (v: Record<string, unknown>) => boolean) =>
  Array.isArray(x) && x.every((v) => isObject(v) && ok(v));

/** Un archivo se puede editar a mano o llegar dañado: solo se acepta una estructura que el resto de la app pueda usar. */
function hasUsableStructure(p: Record<string, unknown>): boolean {
  const has = (k: string) => k in p;
  const lessonOk = (l: Record<string, unknown>) =>
    p.version === 1
      ? isCount(l.bestErrors) && isString(l.completedAt) && isCount(l.completions)
      : l.done === true && isCount(l.errors) && isString(l.completedAt) && isCount(l.completions);
  if (has('lessons') && !everyValue(p.lessons, lessonOk)) return false;
  if (has('puzzles') && !everyValue(p.puzzles, (r) => ['clean', 'solved', 'failed'].includes(r.result as string) && isString(r.at))) return false;
  if (has('drafts') && !everyValue(p.drafts, (d) => isCount(d.stepIndex) && isCount(d.errors) && isStrings(d.mistakes))) return false;
  if (has('mistakes') && !everyItem(p.mistakes, (m) => isString(m.stepId) && isString(m.lessonId) && isString(m.lastSeen) && isCount(m.count))) return false;
  const gameOk = (g: Record<string, unknown>) =>
    isString(g.botId) && ['w', 'b'].includes(g.userColor as string) && ['win', 'loss', 'draw'].includes(g.result as string) && isString(g.playedAt) && isStrings(g.moves);
  if (has('games') && !everyItem(p.games, gameOk)) return false;
  for (const k of ['pieceSets', 'boardThemes', 'turningPoints']) {
    if (has(k) && !isStrings(p[k])) return false;
  }
  if (has('deviceId') && !isString(p.deviceId)) return false;
  if (has('resetAt') && !isStringOrNull(p.resetAt)) return false;
  if (has('stamps') && !(isRecord(p.stamps) && Object.values(p.stamps).every((v) => v === undefined || isString(v)))) return false;
  if (has('coinLedger') && !everyValue(p.coinLedger, (c) => isCount(c.earned) && isCount(c.spent))) return false;
  if (has('rewards') && !(isObject(p.rewards) && (!('botWins' in p.rewards) || isRecord(p.rewards.botWins)))) return false;
  if (has('practice') && !isObject(p.practice)) return false;
  if (has('profile') && !isObject(p.profile)) return false;
  // La versión 1 no tenía racha.
  if (p.version === 1 && !has('streak')) return true;
  const s = p.streak;
  return isObject(s) && isCount(s.current) && isCount(s.best) && (!('lastActiveDate' in s) || isStringOrNull(s.lastActiveDate));
}

export function parseProgressFile(text: string): ProgressFileResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'notJson' };
  }
  if (!isObject(data) || data.app !== 'gradus' || data.kind !== 'progress' || !isObject(data.progress)) {
    return { ok: false, error: 'notGradus' };
  }
  const p = data.progress;
  const v = p.version;
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 1) return { ok: false, error: 'notGradus' };
  if (v > CURRENT_VERSION) return { ok: false, error: 'tooNew' };
  if (!hasUsableStructure(p)) return { ok: false, error: 'notGradus' };
  return { ok: true, progress: migrate(p as unknown as StoredProgress, LEGACY_DEVICE_ID) };
}
