import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useProgress } from '../progress/ProgressContext';
import { syncReminders } from './reminders';
import { useSettings } from './SettingsContext';

/** Reprograma los avisos cuando cambian la racha o el ajuste, y al volver a abrir la app. */
export function useReminderSync(ready: boolean): void {
  const { progress } = useProgress();
  const { settings } = useSettings();
  const { enabled, hour } = settings.reminder;
  const streak = progress.streak;

  useEffect(() => {
    if (!ready || !enabled) return;
    const run = () => {
      syncReminders(streak, hour).catch(() => {});
    };
    run();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') run();
    });
    return () => sub.remove();
  }, [ready, enabled, hour, streak]);
}
