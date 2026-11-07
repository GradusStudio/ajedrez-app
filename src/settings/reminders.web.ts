import type { Bot } from '../data/bots';
import type { Streak } from '../progress/streak';

// En el navegador no hay notificaciones locales programadas: el recordatorio se oculta.
// Mismas funciones que reminders.ts, sin hacer nada.

export const REMINDERS_SUPPORTED = false;

export async function ensureReminderPermission(_channelName: string): Promise<boolean> {
  return false;
}

export async function syncReminders(_s: Streak, _hour: number, _bots: Bot[], _channelName: string): Promise<void> {}

export async function cancelDailyReminder(): Promise<void> {}
