import AsyncStorage from '@react-native-async-storage/async-storage';

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

export type Progress = {
  version: 3;
  /** Se elige en la bienvenida (y la meta, también en Ajustes). */
  profile: { dailyGoalMin: number; level?: PlayerLevel; onboarded?: boolean };
  lessons: Record<string, LessonProgress>;
  drafts: Record<string, LessonDraft>;
  streak: { current: number; best: number; lastActiveDate: string | null };
  /** Monedas para gastar en la tienda (reemplazaron a la XP en la versión 3). */
  coins: number;
  /** Para no pagar dos veces el mismo premio: día del premio de la meta y, por bot, día de la última victoria premiada. */
  rewards: { goalDate: string | null; botWins: Record<string, string> };
  /** Sets de piezas comprados (los gratis no se guardan). */
  pieceSets: string[];
  practice: { seconds: number; date: string | null }; // tiempo de práctica del día `date`
  mistakes: Mistake[];
  games: GameRecord[]; // las últimas MAX_GAMES, la más reciente primero
  puzzles: Record<string, PuzzleRecord>; // por id de puzzle de Lichess
  lastUnit?: number; // unidad de la última lección empezada en Aprender, la que se muestra al abrir la app
};

const KEY = 'ajedrez:progreso';
const MAX_GAMES = 50;

// ---------- Monedas ----------
// Lecciones: el valor `xp` de cada lección (nombre histórico del campo en los JSON), solo la primera vez.
export const PUZZLE_COINS: Record<PuzzleResult, number> = { clean: 2, solved: 1, failed: 0 };
export const GOAL_BONUS_COINS = 10;
/** Victoria contra un bot (no en práctica): una vez por día y por bot, según su nivel (Pipo 500 → 5, Ada 2200 → 22). */
export const botWinCoins = (elo: number) => Math.round(elo / 100);

export const emptyProgress: Progress = {
  version: 3,
  profile: { dailyGoalMin: 10 },
  lessons: {},
  drafts: {},
  streak: { current: 0, best: 0, lastActiveDate: null },
  coins: 0,
  rewards: { goalDate: null, botWins: {} },
  pieceSets: [],
  practice: { seconds: 0, date: null },
  mistakes: [],
  games: [],
  puzzles: {},
};

// ---------- Fechas (día local, formato 2026-10-27) ----------

export function todayKey(now = new Date()): string {
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${m}-${d}`;
}

function dayBefore(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return todayKey(new Date(y, m - 1, d - 1));
}

// ---------- Lectura para mostrar ----------

/** Racha vigente: si el último día activo fue antes de ayer, la racha ya se cortó. */
export function currentStreak(p: Progress, today = todayKey()): number {
  const last = p.streak.lastActiveDate;
  return last === today || last === dayBefore(today) ? p.streak.current : 0;
}

export function minutesToday(p: Progress, today = todayKey()): number {
  return p.practice.date === today ? Math.floor(p.practice.seconds / 60) : 0;
}

// ---------- Cambios ----------

function withCoins(p: Progress, amount: number): Progress {
  return amount ? { ...p, coins: p.coins + amount } : p;
}

/** Suma tiempo de práctica. El día que se llega a la meta diaria, da el premio (una sola vez por día). */
export function withPractice(p: Progress, seconds: number, today = todayKey()): Progress {
  const base = p.practice.date === today ? p.practice.seconds : 0;
  const next: Progress = { ...p, practice: { seconds: base + Math.max(0, Math.round(seconds)), date: today } };
  const goalReached = next.practice.seconds >= p.profile.dailyGoalMin * 60;
  if (!goalReached || p.rewards.goalDate === today) return next;
  return withCoins({ ...next, rewards: { ...next.rewards, goalDate: today } }, GOAL_BONUS_COINS);
}

/** Marca el día como activo y actualiza la racha. */
function withActiveDay(p: Progress, today: string): Progress {
  const { lastActiveDate, current, best } = p.streak;
  if (lastActiveDate === today) return p;
  const next = lastActiveDate === dayBefore(today) ? current + 1 : 1;
  return { ...p, streak: { current: next, best: Math.max(best, next), lastActiveDate: today } };
}

export function withDraft(p: Progress, lessonId: string, draft: LessonDraft | null): Progress {
  const drafts = { ...p.drafts };
  if (draft) drafts[lessonId] = draft;
  else delete drafts[lessonId];
  return { ...p, drafts };
}

export function withLastUnit(p: Progress, unit: number): Progress {
  return p.lastUnit === unit ? p : { ...p, lastUnit: unit };
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
 * Devuelve las monedas de la lección y, aparte, el premio de la meta diaria si se cumplió con ella.
 */
export function withLessonFinished(
  p: Progress,
  f: LessonFinish,
  now = new Date()
): { progress: Progress; coinsEarned: number; goalBonus: number } {
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
  const beforeGoal = next.coins;
  next = withPractice(next, f.seconds, today);
  const goalBonus = next.coins - beforeGoal;
  next = withActiveDay(next, today);
  next = withMistakes(next, f.lessonId, f.mistakes, iso);
  return { progress: next, coinsEarned, goalBonus };
}

export type ReviewFinish = {
  lessonId: string;
  stepIds: string[]; // pasos que se repasaron
  failed: string[]; // los que se volvieron a fallar
  seconds: number;
};

/** Repaso de errores: los pasos acertados salen de la lista; los fallados de nuevo suman un fallo. */
export function withReviewFinished(p: Progress, r: ReviewFinish, now = new Date()): Progress {
  const today = todayKey(now);
  const solved = r.stepIds.filter((id) => !r.failed.includes(id));
  let next: Progress = { ...p, mistakes: p.mistakes.filter((m) => !solved.includes(m.stepId)) };
  next = withMistakes(next, r.lessonId, r.failed, now.toISOString());
  next = withPractice(next, r.seconds, today);
  next = withActiveDay(next, today);
  return next;
}

/**
 * Partida terminada: se guarda y cuenta para la racha y la meta diaria. Ganarle a un bot (fuera del modo
 * práctica) da monedas según su nivel, una vez por día y por bot, para que no convenga repetir contra el más fácil.
 */
export function withGameFinished(
  p: Progress,
  game: Omit<GameRecord, 'playedAt'>,
  seconds: number,
  botElo: number,
  now = new Date()
): { progress: Progress; coinsEarned: number } {
  const today = todayKey(now);
  let next: Progress = { ...p, games: [{ ...game, playedAt: now.toISOString() }, ...p.games].slice(0, MAX_GAMES) };
  let coinsEarned = 0;
  if (game.result === 'win' && !game.practiceCourseId && p.rewards.botWins[game.botId] !== today) {
    coinsEarned = botWinCoins(botElo);
    next = withCoins({ ...next, rewards: { ...next.rewards, botWins: { ...next.rewards.botWins, [game.botId]: today } } }, coinsEarned);
  }
  next = withPractice(next, seconds, today);
  next = withActiveDay(next, today);
  return { progress: next, coinsEarned };
}

/** Compra un set de piezas. Devuelve null si no alcanzan las monedas o si ya era suyo. */
export function withPieceSetBought(p: Progress, id: string, price: number): Progress | null {
  if (p.pieceSets.includes(id) || p.coins < price) return null;
  return { ...p, coins: p.coins - price, pieceSets: [...p.pieceSets, id] };
}

export function withProfile(p: Progress, patch: Partial<Progress['profile']>): Progress {
  return { ...p, profile: { ...p.profile, ...patch } };
}

const PUZZLE_RANK: Record<PuzzleResult, number> = { failed: 0, solved: 1, clean: 2 };

/**
 * Puzzle terminado: guarda el mejor resultado y cuenta para la racha y la meta diaria.
 * Da monedas solo la primera vez que se resuelve (si antes se había mirado la solución, todavía cuenta).
 */
export function withPuzzleFinished(
  p: Progress,
  id: string,
  result: PuzzleResult,
  seconds: number,
  now = new Date()
): { progress: Progress; coinsEarned: number } {
  const today = todayKey(now);
  const prev = p.puzzles[id];
  const best = prev && PUZZLE_RANK[prev.result] >= PUZZLE_RANK[result] ? prev.result : result;
  const coinsEarned = isPuzzleSolved(p, id) ? 0 : PUZZLE_COINS[result];
  let next: Progress = { ...p, puzzles: { ...p.puzzles, [id]: { result: best, at: now.toISOString() } } };
  next = withCoins(next, coinsEarned);
  next = withPractice(next, seconds, today);
  next = withActiveDay(next, today);
  return { progress: next, coinsEarned };
}

/** true si el puzzle ya se resolvió (con o sin errores). */
export function isPuzzleSolved(p: Progress, id: string): boolean {
  const r = p.puzzles[id]?.result;
  return r === 'clean' || r === 'solved';
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

/** Versión 2: igual que la 3, pero con XP en lugar de monedas. */
type ProgressV2 = Omit<Progress, 'version' | 'coins' | 'rewards' | 'pieceSets'> & {
  version: 2;
  xp: { total: number; today: number; date: string | null };
};

function migrate(data: Progress | ProgressV2 | ProgressV1): Progress {
  if (data.version === 3) return { ...emptyProgress, ...data };
  if (data.version === 2) {
    // La XP ganada pasa a monedas, 1 a 1.
    const { xp, ...rest } = data;
    return { ...emptyProgress, ...rest, version: 3, coins: xp?.total ?? 0 };
  }
  if (data.version === 1) {
    const lessons: Record<string, LessonProgress> = {};
    for (const [id, l] of Object.entries(data.lessons)) {
      lessons[id] = { done: true, errors: l.bestErrors, completedAt: l.completedAt, completions: l.completions };
    }
    return { ...emptyProgress, lessons, coins: data.xp };
  }
  return emptyProgress;
}

export async function loadProgress(): Promise<Progress> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return emptyProgress;
    return migrate(JSON.parse(raw));
  } catch {
    // Datos dañados o ilegibles: se empieza de cero en vez de romper la app.
    return emptyProgress;
  }
}

export async function saveProgress(progress: Progress): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(progress));
}

export async function clearProgress(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
