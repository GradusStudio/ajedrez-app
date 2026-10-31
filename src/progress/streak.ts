// Reglas de la racha: funciones puras, con la fecha como parámetro (sin React Native).

export type StreakAction = 'lesson' | 'puzzle' | 'bot';

/** Acciones hechas en un día (sirve para la recuperación, que pide las tres). */
export type DayActions = { date: string; lesson: boolean; puzzle: boolean; bot: boolean };

export type Streak = {
  current: number;
  best: number;
  lastActiveDate: string | null;
  actions?: DayActions;
};

export type StreakStatus = {
  /** none: sin racha; active: falta practicar hoy; safe: ya practicó hoy; recovering: hay que hacer las tres acciones. */
  kind: 'none' | 'active' | 'safe' | 'recovering';
  days: number;
  done: Record<StreakAction, boolean>;
};

/** Día local en formato 2026-10-27. */
export function todayKey(now = new Date()): string {
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${m}-${d}`;
}

/** Días enteros de `from` a `to`. Con Date.UTC no influye el horario de verano. */
function gapDays(from: string, to: string): number {
  const [y1, m1, d1] = from.split('-').map(Number);
  const [y2, m2, d2] = to.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}

const NONE_DONE: Record<StreakAction, boolean> = { lesson: false, puzzle: false, bot: false };

function allDone(a: DayActions): boolean {
  return a.lesson && a.puzzle && a.bot;
}

/** Si una recuperación quedó a medias y ya pasó el día, la racha vuelve a empezar en 1 desde ese día. */
function resolveStreak(s: Streak, today: string): Streak {
  const a = s.actions;
  if (
    a && s.lastActiveDate && a.date < today && s.current >= 2 && !allDone(a) &&
    gapDays(s.lastActiveDate, a.date) === 2
  ) {
    return { current: 1, best: s.best, lastActiveDate: a.date };
  }
  return s;
}

function statusOf(s: Streak, today: string): StreakStatus {
  const done = s.actions && s.actions.date === today
    ? { lesson: s.actions.lesson, puzzle: s.actions.puzzle, bot: s.actions.bot }
    : { ...NONE_DONE };
  if (!s.lastActiveDate) return { kind: 'none', days: 0, done };
  const gap = gapDays(s.lastActiveDate, today);
  if (gap <= 0) return { kind: 'safe', days: s.current, done };
  if (gap === 1) return { kind: 'active', days: s.current, done };
  if (gap === 2 && s.current >= 2) return { kind: 'recovering', days: s.current, done };
  return { kind: 'none', days: 0, done };
}

export function streakStatus(s: Streak, today: string): StreakStatus {
  return statusOf(resolveStreak(s, today), today);
}

/** Registra una acción de hoy y devuelve la racha nueva; `recovered` es true al completar una recuperación. */
export function withStreakAction(
  s: Streak,
  action: StreakAction,
  today: string,
): { streak: Streak; recovered: boolean } {
  const base = resolveStreak(s, today);
  const { kind, done } = statusOf(base, today);
  const actions: DayActions = { date: today, ...done, [action]: true };
  const next = (current: number, lastActiveDate: string | null): Streak => ({
    current,
    best: Math.max(base.best, current),
    lastActiveDate,
    actions,
  });
  switch (kind) {
    case 'safe':
      return { streak: next(base.current, base.lastActiveDate), recovered: false };
    case 'active':
      return { streak: next(base.current + 1, today), recovered: false };
    case 'recovering':
      return allDone(actions)
        ? { streak: next(base.current, today), recovered: true }
        : { streak: next(base.current, base.lastActiveDate), recovered: false };
    default:
      return { streak: next(1, today), recovered: false };
  }
}

/** Un puzzle cuenta para la racha salvo que se haya mirado la solución. */
export function puzzleCountsForStreak(result: 'clean' | 'solved' | 'failed'): boolean {
  return result !== 'failed';
}

/** Una partida cuenta si se terminó, o si se abandonó con 10 jugadas o más. */
export function gameCountsForStreak(quit: boolean, plies: number): boolean {
  return !quit || plies >= 10;
}
