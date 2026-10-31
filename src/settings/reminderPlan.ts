import { bots, type Bot } from '../data/bots';
import { streakStatus, todayKey, type Streak } from '../progress/streak';

// Plan de avisos según la racha: función pura, sin React Native (se prueba con npm test).

export type PlannedReminder = { date: Date; title: string; body: string };

const DAYS_AHEAD = 7;

/** Hora a la que se ofrece el recordatorio al terminar una lección. */
export const OFFER_REMINDER_HOUR = 19;

/** Bot que escribe el aviso de ese día: rota uno por día según la fecha local (no según `now`). */
export function reminderBot(date: Date): Bot {
  const days = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  return bots[days % bots.length];
}

/**
 * Avisos de hoy y los 6 días siguientes a `hour`:00. No supone práctica futura: cada día se evalúa
 * con la racha de hoy. Si ya practicó ese día (`safe`) no hay aviso; las fechas pasadas se saltean.
 */
export function planReminders(s: Streak, hour: number, now: Date): PlannedReminder[] {
  const plan: PlannedReminder[] = [];
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, hour, 0);
    if (date <= now) continue;
    const st = streakStatus(s, todayKey(date));
    if (st.kind === 'safe') continue;
    const bot = reminderBot(date);
    const { risk, recovery, general } = bot.teaching.reminder;
    const body =
      st.kind === 'recovering'
        ? recovery
        : st.kind === 'active' && st.days >= 2
          ? risk.replaceAll('{n}', String(st.days))
          : general;
    plan.push({ date, title: bot.name, body });
  }
  return plan;
}
