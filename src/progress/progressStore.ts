import AsyncStorage from '@react-native-async-storage/async-storage';
import { puzzleCountsForStreak, Streak, streakStatus, StreakStatus, StreakAction, todayKey, withStreakAction } from './streak';

export { todayKey } from './streak';

// Progreso del usuario, guardado en el teléfono con AsyncStorage (mapa-de-pantallas.md, sección 4).
// Si cambia la forma de los datos, subir `version` y migrar en `migrate`.
// Todas las funciones `with...` son puras: reciben el progreso y devuelven uno nuevo.

export type LessonProgress = {
  done: true;
  errors: number; // menor cantidad de errores en una pasada
  completedAt: string; // fecha ISO de la primera vez que se terminó
  completions: number; // veces que se terminó
};

/** Nivel elegido en la bienvenida: "Nunca jugué", "Sé mover las piezas", "Juego de vez en cuando". */
export type PlayerLevel = 'nuevo' | 'basico' | 'casual';

/** Avance de una lección a medio hacer, para retomarla donde quedó. */
export type LessonDraft = { stepIndex: number; errors: number; mistakes: string[] };

/** Paso fallado, para el repaso. */
export type Mistake = { stepId: string; lessonId: string; count: number; lastSeen: string };

/**
 * Resultado de un puzzle: clean = resuelto sin errores ni pistas; solved = resuelto con errores o pista;
 * failed = se miró la solución. Se guarda el mejor resultado obtenido.
 */
export type PuzzleResult = 'clean' | 'solved' | 'failed';
export type PuzzleRecord = { result: PuzzleResult; at: string };

/** Partida contra un bot, ya terminada. */
export type GameRecord = {
  botId: string;
  userColor: 'w' | 'b';
  result: 'win' | 'loss' | 'draw';
  reason: string; // "Jaque mate", "Te rendiste", ...
  moves: string[]; // jugadas UCI
  practiceCourseId?: string;
  playedAt: string;
};

/** Monedas de un dispositivo: contadores que solo crecen, para poder combinar sin perder nada (merge.ts). */
export type CoinCounters = { earned: number; spent: number };

export type Progress = {
  version: 4;
  /** Id al azar de esta instalación. Las monedas se cuentan por dispositivo en `coinLedger`. */
  deviceId: string;
  /** Fecha ISO del último «Borrar progreso» (null si nunca). Al combinar, gana entera la versión con el más reciente. */
  resetAt: string | null;
  /** Por dispositivo, monedas ganadas y gastadas. */
  coinLedger: Record<string, CoinCounters>;
  /** Fecha ISO del último cambio de los campos que se combinan por «el último que lo cambió». Si falta, cuenta como la más vieja. */
  stamps: { level?: string; lastUnit?: string };
  /** Se elige en la bienvenida. */
  profile: { level?: PlayerLevel; onboarded?: boolean };
  lessons: Record<string, LessonProgress>;
  drafts: Record<string, LessonDraft>;
  streak: Streak;
  /** Saldo para gastar en la tienda (las monedas reemplazaron a la XP en la versión 3). Siempre igual a `coinBalance(coinLedger)`. */
  coins: number;
  /** Para no pagar dos veces el mismo premio: día del premio diario (`goalDate`, nombre histórico) y, por bot, día de la última victoria premiada. */
  rewards: { goalDate: string | null; botWins: Record<string, string> };
  /** Sets de piezas comprados (los gratis no se guardan). */
  pieceSets: string[];
  /** Tableros con textura comprados (los gratis no se guardan). Se agregó sin subir la versión: si falta, vale []. */
  boardThemes: string[];
  practice: { seconds: number; date: string | null }; // tiempo de práctica del día `date`
  mistakes: Mistake[];
  games: GameRecord[]; // las últimas MAX_GAMES, la más reciente primero
  puzzles: Record<string, PuzzleRecord>; // por id de puzzle de Lichess
  /** Puntos de giro (quiz de la revisión de partidas) ya cobrados, por `turningPointKey`. Se agregó sin subir la versión: si falta, vale []. */
  turningPoints: string[];
  lastUnit?: number; // unidad de la última lección empezada en Aprender, la que se muestra al abrir la app
};

const KEY = 'ajedrez:progreso';
const BACKUP_KEY = 'ajedrez:progreso:respaldo'; // copia de datos que no se pudieron interpretar
const MAX_GAMES = 50;

// ---------- Monedas ----------
// Lecciones: el valor `xp` de cada lección (nombre histórico del campo en los JSON), solo la primera vez.
export const PUZZLE_COINS: Record<PuzzleResult, number> = { clean: 2, solved: 1, failed: 0 };
export const DAILY_BONUS_COINS = 10;
/** Victoria contra un bot (no en práctica): una vez por día y por bot, según su nivel (Pipo 500 → 5, Ada 2200 → 22). */
export const botWinCoins = (elo: number) => Math.round(elo / 100);

/** Progreso vacío. `deviceId` queda vacío: lo completan `loadProgress` y `migrate`. */
export const emptyProgress: Progress = {
  version: 4,
  deviceId: '',
  resetAt: null,
  coinLedger: {},
  stamps: {},
  profile: {},
  lessons: {},
  drafts: {},
  streak: { current: 0, best: 0, lastActiveDate: null },
  coins: 0,
  rewards: { goalDate: null, botWins: {} },
  pieceSets: [],
  boardThemes: [],
  practice: { seconds: 0, date: null },
  mistakes: [],
  games: [],
  puzzles: {},
  turningPoints: [],
};

// ---------- Lectura para mostrar ----------

/** Estado de la racha hoy (reglas en streak.ts). */
export function streakStatusNow(p: Progress, today = todayKey()): StreakStatus {
  return streakStatus(p.streak, today);
}

/** Racha vigente: 0 si ya se cortó. */
export function currentStreak(p: Progress, today = todayKey()): number {
  return streakStatus(p.streak, today).days;
}

// ---------- Cambios ----------

/** Saldo: todo lo ganado menos todo lo gastado, sumando los dispositivos. */
export function coinBalance(ledger: Progress['coinLedger']): number {
  let total = 0;
  for (const c of Object.values(ledger)) total += c.earned - c.spent;
  return total;
}

/** Suma a un contador del dispositivo actual y recalcula el saldo. */
function withLedger(p: Progress, field: keyof CoinCounters, amount: number): Progress {
  if (!amount) return p;
  const mine = p.coinLedger[p.deviceId] ?? { earned: 0, spent: 0 };
  const coinLedger = { ...p.coinLedger, [p.deviceId]: { ...mine, [field]: mine[field] + amount } };
  return { ...p, coinLedger, coins: coinBalance(coinLedger) };
}

function withCoins(p: Progress, amount: number): Progress {
  return withLedger(p, 'earned', amount);
}

/** Id al azar para esta instalación. Solo tiene que ser único, no secreto. */
export function randomId(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (typeof c?.randomUUID === 'function') return c.randomUUID();
  const part = () => Math.random().toString(36).slice(2, 10).padEnd(8, '0');
  return `${Date.now().toString(36)}-${part()}-${part()}`;
}

/** Suma tiempo de práctica (ya no se muestra, pero se sigue guardando). */
export function withPractice(p: Progress, seconds: number, today = todayKey()): Progress {
  const base = p.practice.date === today ? p.practice.seconds : 0;
  return { ...p, practice: { seconds: base + Math.max(0, Math.round(seconds)), date: today } };
}

/**
 * Registra una acción del día en la racha y paga el premio del día con la primera de cada día.
 * `streakRecovered` es true si con ella se completó una recuperación.
 */
function withStreak(
  p: Progress,
  action: StreakAction,
  today: string
): { progress: Progress; dailyBonus: number; streakRecovered: boolean } {
  const { streak, recovered } = withStreakAction(p.streak, action, today);
  const next: Progress = { ...p, streak };
  if (p.rewards.goalDate === today) return { progress: next, dailyBonus: 0, streakRecovered: recovered };
  return {
    progress: withCoins({ ...next, rewards: { ...next.rewards, goalDate: today } }, DAILY_BONUS_COINS),
    dailyBonus: DAILY_BONUS_COINS,
    streakRecovered: recovered,
  };
}

export function withDraft(p: Progress, lessonId: string, draft: LessonDraft | null): Progress {
  const drafts = { ...p.drafts };
  if (draft) drafts[lessonId] = draft;
  else delete drafts[lessonId];
  return { ...p, drafts };
}

export function withLastUnit(p: Progress, unit: number, now = new Date()): Progress {
  return p.lastUnit === unit ? p : { ...p, lastUnit: unit, stamps: { ...p.stamps, lastUnit: now.toISOString() } };
}

/** Suma un fallo a cada paso de `stepIds`. */
function withMistakes(p: Progress, lessonId: string, stepIds: string[], now: string): Progress {
  if (stepIds.length === 0) return p;
  const list = p.mistakes.map((m) => (stepIds.includes(m.stepId) ? { ...m, count: m.count + 1, lastSeen: now } : m));
  for (const stepId of stepIds) {
    if (!list.some((m) => m.stepId === stepId)) list.push({ stepId, lessonId, count: 1, lastSeen: now });
  }
  return { ...p, mistakes: list };
}

export type LessonFinish = {
  lessonId: string;
  lessonCoins: number; // monedas de la lección (campo `xp` del JSON)
  errors: number;
  mistakes: string[]; // ids de los pasos fallados en esta pasada
  seconds: number;
};

/**
 * Registra una lección terminada. Las monedas de la lección se suman solo la primera vez;
 * repetir una lección sirve de repaso, cuenta para la racha y mejora el récord de errores.
 * Devuelve las monedas de la lección y, aparte, el premio del día si fue la primera acción de hoy.
 */
export function withLessonFinished(
  p: Progress,
  f: LessonFinish,
  now = new Date()
): { progress: Progress; coinsEarned: number; dailyBonus: number; streakRecovered: boolean } {
  const today = todayKey(now);
  const iso = now.toISOString();
  const prev = p.lessons[f.lessonId];
  const coinsEarned = prev ? 0 : f.lessonCoins;
  const entry: LessonProgress = prev
    ? { ...prev, errors: Math.min(prev.errors, f.errors), completions: prev.completions + 1 }
    : { done: true, errors: f.errors, completedAt: iso, completions: 1 };

  let next: Progress = { ...p, lessons: { ...p.lessons, [f.lessonId]: entry } };
  next = withDraft(next, f.lessonId, null);
  next = withCoins(next, coinsEarned);
  next = withPractice(next, f.seconds, today);
  const streak = withStreak(next, 'lesson', today);
  next = withMistakes(streak.progress, f.lessonId, f.mistakes, iso);
  return { progress: next, coinsEarned, dailyBonus: streak.dailyBonus, streakRecovered: streak.streakRecovered };
}

export type ReviewFinish = {
  lessonId: string;
  stepIds: string[]; // pasos que se repasaron
  failed: string[]; // los que se volvieron a fallar
  seconds: number;
};

/** Repaso de errores: los pasos acertados salen de la lista; los fallados de nuevo suman un fallo. */
export function withReviewFinished(
  p: Progress,
  r: ReviewFinish,
  now = new Date()
): { progress: Progress; dailyBonus: number; streakRecovered: boolean } {
  const today = todayKey(now);
  const solved = r.stepIds.filter((id) => !r.failed.includes(id));
  let next: Progress = { ...p, mistakes: p.mistakes.filter((m) => !solved.includes(m.stepId)) };
  next = withMistakes(next, r.lessonId, r.failed, now.toISOString());
  next = withPractice(next, r.seconds, today);
  return withStreak(next, 'lesson', today);
}

/**
 * Partida terminada: se guarda y cuenta para la racha solo si `countsForStreak`
 * (una partida abandonada con menos de 10 jugadas no cuenta). Ganarle a un bot (fuera del modo
 * práctica) da monedas según su nivel, una vez por día y por bot, para que no convenga repetir contra el más fácil.
 */
export function withGameFinished(
  p: Progress,
  game: Omit<GameRecord, 'playedAt'>,
  seconds: number,
  botElo: number,
  countsForStreak: boolean,
  now = new Date()
): { progress: Progress; coinsEarned: number; streakRecovered: boolean } {
  const today = todayKey(now);
  let next: Progress = { ...p, games: [{ ...game, playedAt: now.toISOString() }, ...p.games].slice(0, MAX_GAMES) };
  let coinsEarned = 0;
  if (game.result === 'win' && !game.practiceCourseId && p.rewards.botWins[game.botId] !== today) {
    coinsEarned = botWinCoins(botElo);
    next = withCoins({ ...next, rewards: { ...next.rewards, botWins: { ...next.rewards.botWins, [game.botId]: today } } }, coinsEarned);
  }
  next = withPractice(next, seconds, today);
  if (!countsForStreak) return { progress: next, coinsEarned, streakRecovered: false };
  const streak = withStreak(next, 'bot', today);
  return { progress: streak.progress, coinsEarned, streakRecovered: streak.streakRecovered };
}

/** Compra un set de piezas. Devuelve null si no alcanzan las monedas o si ya era suyo. */
export function withPieceSetBought(p: Progress, id: string, price: number): Progress | null {
  if (p.pieceSets.includes(id) || p.coins < price) return null;
  return withLedger({ ...p, pieceSets: [...p.pieceSets, id] }, 'spent', price);
}

/** Compra un tablero. Devuelve null si no alcanzan las monedas o si ya era suyo. */
export function withBoardThemeBought(p: Progress, id: string, price: number): Progress | null {
  if (p.boardThemes.includes(id) || p.coins < price) return null;
  return withLedger({ ...p, boardThemes: [...p.boardThemes, id] }, 'spent', price);
}

/** Cambia el perfil. Si el cambio trae `level`, anota la fecha (al combinar gana el último que lo cambió). */
export function withProfile(p: Progress, patch: Partial<Progress['profile']>, now = new Date()): Progress {
  const stamps = 'level' in patch ? { ...p.stamps, level: now.toISOString() } : p.stamps;
  return { ...p, profile: { ...p.profile, ...patch }, stamps };
}

/**
 * «Borrar progreso»: conserva el perfil (bienvenida y nivel, con su fecha) y anota `resetAt` para que al combinar
 * con una copia anterior (Drive) no vuelva lo borrado. El dispositivo recibe un id nuevo: lo ganado antes queda
 * bajo el id viejo, así restaurar una copia suma sus monedas a las ganadas después en vez de taparlas
 * (merge.ts toma, por dispositivo, el mayor de cada contador).
 */
export function withReset(p: Progress, now = new Date()): Progress {
  return {
    ...emptyProgress,
    deviceId: randomId(),
    profile: p.profile,
    stamps: p.stamps.level ? { level: p.stamps.level } : {},
    resetAt: now.toISOString(),
  };
}

const PUZZLE_RANK: Record<PuzzleResult, number> = { failed: 0, solved: 1, clean: 2 };

/**
 * Puzzle terminado: guarda el mejor resultado y cuenta para la racha salvo
 * que se haya mirado la solución (`failed`).
 * Da monedas solo la primera vez que se resuelve (si antes se había mirado la solución, todavía cuenta).
 */
export function withPuzzleFinished(
  p: Progress,
  id: string,
  result: PuzzleResult,
  seconds: number,
  now = new Date()
): { progress: Progress; coinsEarned: number; streakRecovered: boolean } {
  const today = todayKey(now);
  const prev = p.puzzles[id];
  const best = prev && PUZZLE_RANK[prev.result] >= PUZZLE_RANK[result] ? prev.result : result;
  const coinsEarned = isPuzzleSolved(p, id) ? 0 : PUZZLE_COINS[result];
  let next: Progress = { ...p, puzzles: { ...p.puzzles, [id]: { result: best, at: now.toISOString() } } };
  next = withCoins(next, coinsEarned);
  next = withPractice(next, seconds, today);
  if (!puzzleCountsForStreak(result)) return { progress: next, coinsEarned, streakRecovered: false };
  const streak = withStreak(next, 'puzzle', today);
  return { progress: streak.progress, coinsEarned, streakRecovered: streak.streakRecovered };
}

/** true si el puzzle ya se resolvió (con o sin errores). */
export function isPuzzleSolved(p: Progress, id: string): boolean {
  const r = p.puzzles[id]?.result;
  return r === 'clean' || r === 'solved';
}

const MAX_TURNING_POINTS_SAVED = 500;

/**
 * Punto de giro encontrado en el quiz de la revisión. Paga como un puzzle (2 sin errores, 1 con errores),
 * una sola vez por posición. No cuenta para la racha.
 */
export function withTurningPointSolved(p: Progress, key: string, clean: boolean): { progress: Progress; coinsEarned: number } {
  if (p.turningPoints.includes(key)) return { progress: p, coinsEarned: 0 };
  const coinsEarned = PUZZLE_COINS[clean ? 'clean' : 'solved'];
  const turningPoints = [...p.turningPoints, key].slice(-MAX_TURNING_POINTS_SAVED);
  return { progress: withCoins({ ...p, turningPoints }, coinsEarned), coinsEarned };
}

/** Victorias, derrotas y tablas contra un bot (sin contar el modo práctica). */
export function recordAgainst(p: Progress, botId: string) {
  const games = p.games.filter((g) => g.botId === botId && !g.practiceCourseId);
  return {
    wins: games.filter((g) => g.result === 'win').length,
    losses: games.filter((g) => g.result === 'loss').length,
    draws: games.filter((g) => g.result === 'draw').length,
  };
}

// ---------- Guardado ----------

type ProgressV1 = {
  version: 1;
  xp: number;
  lessons: Record<string, { completedAt: string; bestErrors: number; completions: number }>;
};

/** Versión 3: igual que la 4, pero con las monedas como un único saldo. */
type ProgressV3 = Omit<Progress, 'version' | 'deviceId' | 'resetAt' | 'coinLedger' | 'stamps'> & { version: 3 };

/** Versión 2: igual que la 3, pero con XP en lugar de monedas. */
type ProgressV2 = Omit<ProgressV3, 'version' | 'coins' | 'rewards' | 'pieceSets' | 'boardThemes'> & {
  version: 2;
  xp: { total: number; today: number; date: string | null };
};

/** Lo que puede venir guardado (o en un archivo importado). */
export type StoredProgress = ProgressV1 | ProgressV2 | ProgressV3 | Progress;

function toV3(data: ProgressV1 | ProgressV2 | ProgressV3): ProgressV3 {
  const { deviceId: _d, resetAt: _r, coinLedger: _l, stamps: _s, ...base } = emptyProgress;
  if (data.version === 3) return { ...base, ...data };
  if (data.version === 2) {
    // La XP ganada pasa a monedas, 1 a 1.
    const { xp, ...rest } = data;
    return { ...base, ...rest, version: 3, coins: xp?.total ?? 0 };
  }
  const lessons: Record<string, LessonProgress> = {};
  for (const [id, l] of Object.entries(data.lessons)) {
    lessons[id] = { done: true, errors: l.bestErrors, completedAt: l.completedAt, completions: l.completions };
  }
  return { ...base, version: 3, lessons, coins: data.xp };
}

/**
 * Lleva cualquier versión guardada a la 4. `newDeviceId` se usa si el progreso todavía no tiene dispositivo:
 * el saldo de las versiones 1 a 3 pasa a ser lo ganado por ese dispositivo. Un archivo viejo importado se migra
 * con el id fijo `'legacy'`, así importarlo dos veces no suma dos veces (merge.ts toma el mayor de cada contador).
 * En la versión 4, `coins` se recalcula desde el libro: el libro manda.
 */
export function migrate(data: StoredProgress, newDeviceId: string): Progress {
  if (data.version === 4) {
    const coinLedger = data.coinLedger ?? {};
    return {
      ...emptyProgress,
      ...data,
      deviceId: data.deviceId || newDeviceId,
      resetAt: data.resetAt ?? null,
      coinLedger,
      stamps: data.stamps ?? {},
      coins: coinBalance(coinLedger),
    };
  }
  const { version: _v, coins, ...rest } = toV3(data);
  const coinLedger = { [newDeviceId]: { earned: Number.isFinite(coins) ? coins : 0, spent: 0 } };
  return { ...emptyProgress, ...rest, deviceId: newDeviceId, coinLedger, coins: coinBalance(coinLedger) };
}

/**
 * Lee el progreso guardado. `canSave` es false si guardar podría pisar datos que no se pudieron leer:
 * un fallo de lectura puede ser pasajero y el progreso seguiría ahí la próxima vez.
 * Si hubo que migrar o darle un dispositivo, se guarda enseguida: así `deviceId` no cambia entre una apertura
 * y otra, y el saldo viejo no se cuenta dos veces bajo dos ids distintos.
 */
export async function loadProgress(newDeviceId = randomId()): Promise<{ progress: Progress; canSave: boolean }> {
  const fresh: Progress = { ...emptyProgress, deviceId: newDeviceId };
  let raw: string | null;
  try {
    raw = await AsyncStorage.getItem(KEY);
  } catch {
    return { progress: fresh, canSave: false };
  }
  if (!raw) return { progress: fresh, canSave: true };
  let data: StoredProgress;
  let progress: Progress;
  try {
    data = JSON.parse(raw);
    if (![1, 2, 3, 4].includes(data?.version)) throw new Error('versión desconocida');
    progress = migrate(data, newDeviceId);
  } catch {
    // Datos dañados: se empieza de cero en vez de romper la app, pero antes se guarda una copia.
    const canSave = await AsyncStorage.setItem(BACKUP_KEY, raw).then(
      () => true,
      () => false
    );
    return { progress: fresh, canSave };
  }
  if (data.version !== 4 || !data.deviceId) await saveProgress(progress).catch(() => {});
  return { progress, canSave: true };
}

export async function saveProgress(progress: Progress): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(progress));
}
