import React from 'react';
import { Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { findLesson } from '../data/units';
import { useProgress } from '../progress/ProgressContext';
import { currentStreak } from '../progress/progressStore';
import { LessonResultScreen } from '../screens/LessonResultScreen';
import { ensureReminderPermission } from '../settings/reminders';
import { useSettings } from '../settings/SettingsContext';

export default function ResultRoute() {
  const params = useLocalSearchParams<{ id: string; errors: string; monedas: string; meta?: string; recuperada?: string; fallos?: string; modo?: string }>();
  const { progress } = useProgress();
  const { settings, update } = useSettings();
  const lesson = findLesson(params.id);
  const failed = params.fallos ?? '';

  const accept = async () => {
    try {
      if (await ensureReminderPermission()) {
        update({ reminderOffered: true, reminder: { enabled: true, hour: 19 } });
        return;
      }
    } catch {}
    update({ reminderOffered: true });
    Alert.alert(
      'Sin permiso para avisarte',
      'Para recibir el recordatorio, permite las notificaciones de esta app en los ajustes del teléfono.'
    );
  };
  const offer =
    params.modo !== 'repaso' && !settings.reminderOffered && !settings.reminder.enabled
      ? { onAccept: accept, onDecline: () => update({ reminderOffered: true }) }
      : undefined;

  return (
    <LessonResultScreen
      title={lesson?.title ?? ''}
      mode={params.modo === 'repaso' ? 'review' : params.monedas === '0' ? 'replay' : 'lesson'}
      errors={Number(params.errors) || 0}
      coinsEarned={Number(params.monedas) || 0}
      goalBonus={Number(params.meta) || 0}
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
