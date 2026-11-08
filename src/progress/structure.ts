// Comprobación de forma del progreso que viene de fuera del código: un archivo importado, el que baja de Drive,
// lo que otra pestaña guardó o lo que hay en el almacenamiento. Todos pasan por aquí antes de `migrate`, porque se
// pueden editar a mano o llegar dañados. Módulo puro y sin dependencias, para que lo usen sin ciclos de importación.

const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
/** Tope de cualquier contador (monedas, errores, jugadas): más allá es un archivo dañado o inventado. */
const MAX_COUNT = 1_000_000_000;
const isCount = (x: unknown) => typeof x === 'number' && Number.isFinite(x) && x >= 0 && x <= MAX_COUNT;
const isInt = (x: unknown) => isCount(x) && Number.isInteger(x);
const isString = (x: unknown) => typeof x === 'string';
const isStrings = (x: unknown) => Array.isArray(x) && x.every(isString);
const isStringOrNull = (x: unknown) => x === null || isString(x);
/** Claves que, usadas como `registro[clave]`, tocan prototipos: un registro no puede tenerlas. */
const UNSAFE_KEYS = ['__proto__', 'constructor', 'prototype'];
const isRecord = (x: unknown): x is Record<string, unknown> => isObject(x) && !Object.keys(x).some((k) => UNSAFE_KEYS.includes(k));
const everyValue = (x: unknown, ok: (v: Record<string, unknown>) => boolean) =>
  isRecord(x) && Object.values(x).every((v) => isObject(v) && ok(v));
const everyItem = (x: unknown, ok: (v: Record<string, unknown>) => boolean) =>
  Array.isArray(x) && x.every((v) => isObject(v) && ok(v));

const PLAYER_LEVELS = ['nuevo', 'basico', 'casual'];

/** Solo se acepta una estructura que el resto de la app pueda usar sin romperse. */
export function hasUsableStructure(p: Record<string, unknown>): boolean {
  const has = (k: string) => k in p;
  const lessonOk = (l: Record<string, unknown>) =>
    p.version === 1
      ? isCount(l.bestErrors) && isString(l.completedAt) && isCount(l.completions)
      : l.done === true && isCount(l.errors) && isString(l.completedAt) && isCount(l.completions);
  if (has('lessons') && !everyValue(p.lessons, lessonOk)) return false;
  if (has('puzzles') && !everyValue(p.puzzles, (r) => ['clean', 'solved', 'failed'].includes(r.result as string) && isString(r.at))) return false;
  if (has('drafts') && !everyValue(p.drafts, (d) => isInt(d.stepIndex) && isCount(d.errors) && isStrings(d.mistakes))) return false;
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
  if (has('rewards')) {
    const r = p.rewards;
    if (!isObject(r)) return false;
    if ('goalDate' in r && !isStringOrNull(r.goalDate)) return false;
    // `botWins` puede faltar (se completa al migrar), pero si está, cada valor es el día del premio.
    if ('botWins' in r && !(isRecord(r.botWins) && Object.values(r.botWins).every(isString))) return false;
  }
  if (has('practice')) {
    const pr = p.practice;
    if (!(isObject(pr) && isCount(pr.seconds) && (!('date' in pr) || isStringOrNull(pr.date)))) return false;
  }
  if (has('profile')) {
    const pf = p.profile;
    if (!(isObject(pf) && (!('level' in pf) || PLAYER_LEVELS.includes(pf.level as string)) && (!('onboarded' in pf) || typeof pf.onboarded === 'boolean'))) return false;
  }
  if (has('lastUnit') && !isInt(p.lastUnit)) return false;
  // La versión 1 no tenía racha.
  if (p.version === 1 && !has('streak')) return true;
  const s = p.streak;
  return isObject(s) && isCount(s.current) && isCount(s.best) && (!('lastActiveDate' in s) || isStringOrNull(s.lastActiveDate));
}
