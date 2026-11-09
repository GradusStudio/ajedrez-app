import { MAX_OPENED, PROGRESS_VERSION, PUZZLE_RANK, coinBalance, withBalance, type GameRecord, type LessonProgress, type Mistake, type Progress, type PuzzleRecord } from './progressStore';
import { MAX_PENDING, type PuzzleRating } from './puzzleRating';
import type { DayActions, Streak } from './streak';

// Combina dos copias del progreso (la del dispositivo y una importada de un archivo o de Drive) sin perder nada.
// Reglas en docs/superpowers/specs/2026-11-07-version-web-design.md, «Cómo se combinan dos versiones».
// Es pura, conmutativa (salvo `deviceId`, que siempre es el local) e idempotente: combinar otra vez con
// lo mismo no cambia nada. Para eso, cada empate se rompe igual sin importar el orden de los argumentos,
// y las listas que son conjuntos salen ordenadas.

const MAX_GAMES = 50;

/** Milisegundos de una fecha ISO o de un día `2026-11-07`; null o ilegible cuenta como la más vieja. */
function time(s: string | null | undefined): number {
  if (!s) return -Infinity;
  const t = Date.parse(s);
  return Number.isNaN(t) ? -Infinity : t;
}

/** 1 si `a` es más reciente, -1 si es más vieja, 0 si son iguales (sin restar: -Infinity - -Infinity da NaN). */
function cmpDate(a: string | null | undefined, b: string | null | undefined): number {
  const ta = time(a);
  const tb = time(b);
  return ta > tb ? 1 : ta < tb ? -1 : 0;
}

/** JSON con las claves ordenadas: sirve para desempatar siempre igual. */
function stableKey(x: unknown): string {
  if (x === undefined) return '';
  if (Array.isArray(x)) return `[${x.map(stableKey).join(',')}]`;
  if (x && typeof x === 'object') {
    const entries = Object.entries(x as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([k1], [k2]) => (k1 < k2 ? -1 : k1 > k2 ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableKey(v)}`).join(',')}}`;
  }
  return JSON.stringify(x);
}

/** true si los dos progresos tienen los mismos datos (sin importar el orden de las claves). */
export function sameProgress(a: Progress, b: Progress): boolean {
  return stableKey(a) === stableKey(b);
}

/** El que gana según `cmp` (> 0: gana `a`); en un empate, el de clave estable mayor, para no depender del orden. */
function pick<T>(a: T, b: T, cmp: number): T {
  if (cmp > 0) return a;
  if (cmp < 0) return b;
  return stableKey(a) >= stableKey(b) ? a : b;
}

function laterDate<T extends string | null | undefined>(a: T, b: T): T {
  return pick(a, b, cmpDate(a, b));
}

function earlierDate(a: string, b: string): string {
  return pick(a, b, cmpDate(b, a));
}

/**
 * Une dos registros por clave; `both` decide cuando la clave está en los dos. Solo mira claves propias y arma el
 * resultado con `Object.fromEntries`: una clave `__proto__` de un archivo queda como dato y no cambia el prototipo.
 */
function mergeRecord<T>(a: Record<string, T>, b: Record<string, T>, both: (x: T, y: T) => T): Record<string, T> {
  const out = new Map<string, T>(Object.entries(a));
  for (const [k, v] of Object.entries(b)) out.set(k, Object.prototype.hasOwnProperty.call(a, k) ? both(a[k], v) : v);
  return Object.fromEntries(out);
}

const union = (a: string[], b: string[]) => [...new Set([...a, ...b])].sort();

function mergeLesson(a: LessonProgress, b: LessonProgress): LessonProgress {
  return {
    done: true,
    errors: Math.min(a.errors, b.errors),
    completedAt: earlierDate(a.completedAt, b.completedAt),
    completions: Math.max(a.completions, b.completions),
  };
}

function mergeMistakes(a: Mistake[], b: Mistake[]): Mistake[] {
  const byStep = new Map<string, Mistake>();
  for (const m of [...a, ...b]) {
    const prev = byStep.get(m.stepId);
    if (!prev) {
      byStep.set(m.stepId, m);
      continue;
    }
    const newer = pick(prev, m, cmpDate(prev.lastSeen, m.lastSeen));
    byStep.set(m.stepId, { ...newer, count: Math.max(prev.count, m.count) });
  }
  return [...byStep.values()].sort((x, y) => (x.stepId < y.stepId ? -1 : x.stepId > y.stepId ? 1 : 0));
}

function mergeGames(a: GameRecord[], b: GameRecord[]): GameRecord[] {
  const key = (g: GameRecord) => `${g.playedAt}|${g.botId}`;
  const byKey = new Map<string, GameRecord>();
  for (const g of [...a, ...b]) {
    const prev = byKey.get(key(g));
    byKey.set(key(g), prev ? pick(prev, g, 0) : g);
  }
  return [...byKey.values()]
    .sort((x, y) => cmpDate(y.playedAt, x.playedAt) || (key(x) < key(y) ? -1 : key(x) > key(y) ? 1 : 0))
    .slice(0, MAX_GAMES);
}

/** Acciones del día: gana el día más reciente; el mismo día se juntan las de los dos dispositivos. */
function mergeActions(a: DayActions | undefined, b: DayActions | undefined): DayActions | undefined {
  if (!a || !b) return a ?? b;
  const c = cmpDate(a.date, b.date);
  if (c > 0) return a;
  if (c < 0) return b;
  return { date: a.date, lesson: a.lesson || b.lesson, puzzle: a.puzzle || b.puzzle, bot: a.bot || b.bot };
}

function mergeStreak(a: Streak, b: Streak): Streak {
  const winner = pick(a, b, cmpDate(a.lastActiveDate, b.lastActiveDate) || a.current - b.current);
  const { actions: _own, ...rest } = winner;
  const actions = mergeActions(a.actions, b.actions);
  return { ...rest, best: Math.max(a.best, b.best), ...(actions ? { actions } : {}) };
}

/** Entrada del libro que recibe las monedas devueltas. */
export const REFUND_ID = '_refund';

/** El saldo nunca queda negativo: si dos dispositivos gastaron las mismas monedas, se devuelve la diferencia. */
function refundOverspend(ledger: Progress['coinLedger']): Progress['coinLedger'] {
  const deficit = -coinBalance(ledger);
  if (deficit <= 0) return ledger;
  const prev = ledger[REFUND_ID] ?? { earned: 0, spent: 0 };
  return { ...ledger, [REFUND_ID]: { ...prev, earned: prev.earned + deficit } };
}

function mergePractice(a: Progress['practice'], b: Progress['practice']): Progress['practice'] {
  if (a.date === b.date) return { seconds: Math.max(a.seconds, b.seconds), date: a.date };
  return pick(a, b, cmpDate(a.date, b.date));
}

/** «Gana el dispositivo que lo cambió último»: por fecha; en un empate, el que tiene valor. */
function lastChanged<T>(
  a: { value: T | undefined; stamp?: string },
  b: { value: T | undefined; stamp?: string }
): { value: T | undefined; stamp?: string } {
  const defined = Number(a.value !== undefined) - Number(b.value !== undefined);
  const winner = pick(a.value, b.value, cmpDate(a.stamp, b.stamp) || defined);
  return { value: winner, stamp: laterDate(a.stamp, b.stamp) };
}

/**
 * Puzzles abiertos (el más reciente primero): intercala por posición desde el frente de cada lista. En cada posición
 * toma el par (a[i], b[i]) en orden alfabético y salta repetidos. Es conmutativa e idempotente, y al cortar la cola
 * se pierden los más viejos de las dos listas, no los recién abandonados.
 */
function mergeOpened(a: string[], b: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const pair = [a[i], b[i]].filter((x): x is string => x !== undefined).sort();
    for (const id of pair) {
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}

/**
 * Nivel de puzzles: gana el que contó más puzzles (`rated`); si empatan, el cambiado más tarde. `pending` se une, sin
 * los puzzles que ya están terminados en `puzzles` (tope MAX_PENDING).
 */
export function mergePuzzleRating(
  a: PuzzleRating | undefined,
  b: PuzzleRating | undefined,
  puzzles: Record<string, PuzzleRecord>
): PuzzleRating | undefined {
  if (!a || !b) {
    const only = a ?? b;
    return only && { ...only, pending: only.pending.filter((id) => !puzzles[id]).slice(-MAX_PENDING) };
  }
  const winner = pick(a, b, a.rated - b.rated || cmpDate(a.at, b.at));
  const pending = union(a.pending, b.pending).filter((id) => !puzzles[id]).slice(-MAX_PENDING);
  return { ...winner, pending };
}

/** Combina el progreso local con otro (importado o bajado de Drive). El resultado conserva `local.deviceId`. */
export function mergeProgress(local: Progress, incoming: Progress): Progress {
  // Si se borró el progreso en uno de los dos después que en el otro, gana entera esa versión.
  const resetCmp = cmpDate(local.resetAt, incoming.resetAt);
  // Pasa por la misma combinación de campos (consigo misma) para salir normalizada: así es idempotente.
  if (resetCmp !== 0) {
    const winner = resetCmp > 0 ? local : incoming;
    return { ...mergeProgress(winner, winner), deviceId: local.deviceId };
  }

  const lessons = mergeRecord(local.lessons, incoming.lessons, mergeLesson);
  const drafts = Object.fromEntries(
    Object.entries(mergeRecord(local.drafts, incoming.drafts, (a, b) => pick(a, b, a.stepIndex - b.stepIndex))).filter(
      ([id]) => !Object.prototype.hasOwnProperty.call(lessons, id)
    )
  );
  const puzzles = mergeRecord(local.puzzles, incoming.puzzles, (a, b) =>
    a.result === b.result ? { result: a.result, at: laterDate(a.at, b.at) } : pick(a, b, PUZZLE_RANK[a.result] - PUZZLE_RANK[b.result])
  );
  const coinLedger = refundOverspend(mergeRecord(local.coinLedger, incoming.coinLedger, (a, b) => ({
    earned: Math.max(a.earned, b.earned),
    spent: Math.max(a.spent, b.spent),
  })));

  const level = lastChanged(
    { value: local.profile.level, stamp: local.stamps.level },
    { value: incoming.profile.level, stamp: incoming.stamps.level }
  );
  const lastUnit = lastChanged(
    { value: local.lastUnit, stamp: local.stamps.lastUnit },
    { value: incoming.lastUnit, stamp: incoming.stamps.lastUnit }
  );
  const ongoingGame = lastChanged(
    { value: local.ongoingGame, stamp: local.stamps.ongoingGame },
    { value: incoming.ongoingGame, stamp: incoming.stamps.ongoingGame }
  );
  const onboarded =
    local.profile.onboarded || incoming.profile.onboarded
      ? true
      : local.profile.onboarded === false || incoming.profile.onboarded === false
        ? false
        : undefined;

  const merged: Omit<Progress, 'coins'> = {
    version: PROGRESS_VERSION,
    deviceId: local.deviceId,
    resetAt: laterDate(local.resetAt, incoming.resetAt),
    profile: {
      ...(onboarded !== undefined ? { onboarded } : {}),
      ...(level.value !== undefined ? { level: level.value } : {}),
    },
    stamps: {
      ...(level.stamp !== undefined ? { level: level.stamp } : {}),
      ...(lastUnit.stamp !== undefined ? { lastUnit: lastUnit.stamp } : {}),
      ...(ongoingGame.stamp !== undefined ? { ongoingGame: ongoingGame.stamp } : {}),
    },
    lessons,
    drafts,
    streak: mergeStreak(local.streak, incoming.streak),
    coinLedger,
    rewards: {
      goalDate: laterDate(local.rewards.goalDate, incoming.rewards.goalDate),
      botWins: mergeRecord(local.rewards.botWins, incoming.rewards.botWins, laterDate),
    },
    pieceSets: union(local.pieceSets, incoming.pieceSets),
    boardThemes: union(local.boardThemes, incoming.boardThemes),
    practice: mergePractice(local.practice, incoming.practice),
    mistakes: mergeMistakes(local.mistakes, incoming.mistakes),
    games: mergeGames(local.games, incoming.games),
    puzzles,
    turningPoints: union(local.turningPoints, incoming.turningPoints),
  };
  const opened = mergeOpened(local.puzzlesOpened ?? [], incoming.puzzlesOpened ?? []).filter((id) => !puzzles[id]).slice(0, MAX_OPENED);
  if (opened.length) merged.puzzlesOpened = opened;
  if (lastUnit.value !== undefined) merged.lastUnit = lastUnit.value;
  if (ongoingGame.value !== undefined) merged.ongoingGame = ongoingGame.value;
  const puzzleRating = mergePuzzleRating(local.puzzleRating, incoming.puzzleRating, puzzles);
  if (puzzleRating) merged.puzzleRating = puzzleRating;
  return withBalance(merged);
}

/**
 * Combina una copia cargada a mano desde un archivo. Restaurar es una decisión explícita del usuario, así que
 * la regla de `resetAt` (que sirve para llevar un borrado a los demás dispositivos sincronizados) no se aplica:
 * no se descarta ninguno de los dos lados y el `resetAt` del resultado es el local.
 */
export function mergeImport(local: Progress, incoming: Progress): Progress {
  return mergeProgress(local, { ...incoming, resetAt: local.resetAt });
}
