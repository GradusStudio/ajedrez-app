import React, { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { pickPhrase, teacherForLesson } from '../data/teachers';
import { useContent } from '../data/useContent';
import { useI18n } from '../i18n/I18nContext';
import { useProgress } from '../progress/ProgressContext';
import { currentStreak } from '../progress/progressStore';
import { LessonResultScreen } from '../screens/LessonResultScreen';
import { OFFER_REMINDER_HOUR } from '../settings/reminderPlan';
import { ensureReminderPermission, REMINDERS_SUPPORTED } from '../settings/reminders';
import { useSettings } from '../settings/SettingsContext';

export default function ResultRoute() {
  const params = useLocalSearchParams<{ id: string; errors: string; monedas: string; premio?: string; recuperada?: string; fallos?: string; modo?: string }>();
  const { progress } = useProgress();
  const { settings, update } = useSettings();
  const { findLesson, findBot } = useContent();
  const { t } = useI18n();
  const lesson = findLesson(params.id);
  const failed = params.fallos ?? '';
  // La frase se elige una vez: cambia solo al abrir otra vez.
  const [teacher] = useState(() => {
    const bot = findBot(teacherForLesson(params.id).id) ?? teacherForLesson(params.id);
    return { bot, phrase: pickPhrase(bot.teaching.close) };
  });

  // Se decide una vez al abrir la pantalla: la oferta sigue visible en esta visita aunque
  // `reminderOffered` pase a true al mostrarla.
  const [showOffer, setShowOffer] = useState(
    () => REMINDERS_SUPPORTED && params.modo !== 'repaso' && !settings.reminderOffered && !settings.reminder.enabled
  );
  const accepting = useRef(false);

  // Al mostrarla se marca como ofrecida: si se ignora, no vuelve a aparecer en otras lecciones.
  useEffect(() => {
    if (showOffer) update({ reminderOffered: true });
  }, [showOffer, update]);

  const accept = async () => {
    if (accepting.current) return; // evita que un doble toque corra dos veces
    accepting.current = true;
    setShowOffer(false);
    try {
      if (await ensureReminderPermission(t('settings.reminder'))) {
        update({ reminder: { enabled: true, hour: OFFER_REMINDER_HOUR } });
        return;
      }
    } catch {}
    Alert.alert(t('settings.noPermission.title'), t('settings.noPermission.message'));
  };
  const offer = showOffer ? { onAccept: accept, onDecline: () => setShowOffer(false) } : undefined;

  return (
    <LessonResultScreen
      title={lesson?.title ?? ''}
      teacher={teacher}
      mode={params.modo === 'repaso' ? 'review' : params.monedas === '0' ? 'replay' : 'lesson'}
      errors={Number(params.errors) || 0}
      coinsEarned={Number(params.monedas) || 0}
      dailyBonus={Number(params.premio) || 0}
      streak={currentStreak(progress)}
      streakRecovered={params.recuperada === '1'}
      onContinue={() => router.back()}
      reminderOffer={offer}
      onReviewMistakes={
        failed && params.modo !== 'repaso'
          ? () => router.replace({ pathname: '/leccion/[id]', params: { id: params.id, repaso: failed } })
          : undefined
      }
    />
  );
}
