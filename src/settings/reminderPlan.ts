import { streakStatus, todayKey, type Streak } from '../progress/streak';

// Plan de avisos según la racha: función pura, sin React Native (se prueba con npm test).

export type PlannedReminder = { date: Date; title: string; body: string };

const DAYS_AHEAD = 7;

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
    if (st.kind === 'recovering') {
      plan.push({
        date,
        title: 'Todavía puedes recuperar tu racha',
        body: 'Resuelve un puzzle, haz una lección y juega contra un bot hoy.',
      });
    } else if (st.kind === 'active' && st.days >= 2) {
      plan.push({
        date,
        title: `Tu racha de ${st.days} días sigue en juego`,
        body: 'Una lección, un puzzle o una partida alcanza para mantenerla.',
      });
    } else {
      plan.push({
        date,
        title: 'Hora de practicar ajedrez',
        body: 'Una lección o un puzzle corto alcanza para empezar.',
      });
    }
  }
  return plan;
}
