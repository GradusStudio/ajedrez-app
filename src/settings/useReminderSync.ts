import { useEffect } from 'react';
import { AppState } from 'react-native';
import { showDialog } from '../components/dialog';
import { localizedContent } from '../data/localized';
import { useI18n } from '../i18n/I18nContext';
import { useProgress } from '../progress/ProgressContext';
import { reminderIsUsable, syncReminders } from './reminders';
import { useSettings } from './SettingsContext';

/** Reprograma los avisos cuando cambian la racha o el ajuste, y al volver a abrir la app. */
export function useReminderSync(ready: boolean): void {
  const { progress } = useProgress();
  const { settings, update } = useSettings();
  const { language, t } = useI18n();
  const { enabled, hour } = settings.reminder;
  const streak = progress.streak;

  useEffect(() => {
    if (!ready || !enabled) return;
    const run = () => {
      reminderIsUsable()
        .then((usable) => {
          if (!usable) {
            update({ reminder: { enabled: false, hour } });
            // CA-13/CA-14: explicar por qué se apagó y cómo reactivarlo. Al quedar el ajuste en off, no se repite.
            showDialog(t('settings.reminderRevoked.title'), t('settings.reminderRevoked.message'));
            return;
          }
          return syncReminders(streak, hour, localizedContent(language).bots, t('settings.reminder'));
        })
        .catch(() => {});
    };
    run();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') run();
    });
    return () => sub.remove();
  }, [ready, enabled, hour, streak, language, t, update]);
}
