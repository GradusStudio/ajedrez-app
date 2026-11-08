import React, { useEffect, useRef, useState } from 'react';
import { showDialog } from '../components/dialog';
import { router, useLocalSearchParams } from 'expo-router';
import { pickPhrase, teacherForLesson } from '../data/teachers';
import { useContent } from '../data/useContent';
import { useI18n } from '../i18n/I18nContext';
import { useProgress } from '../progress/ProgressContext';
import { currentStreak } from '../progress/progressStore';
import { needsCopyBeforeInstall } from '../pwa/installPlatform';
import { useInstallPlatform } from '../pwa/useInstallPlatform';
import { LessonResultScreen } from '../screens/LessonResultScreen';
import { installOfferApplies, reminderOfferApplies } from '../settings/offers';
import { OFFER_REMINDER_HOUR } from '../settings/reminderPlan';
import { ensureReminderPermission, REMINDERS_SUPPORTED } from '../settings/reminders';
import { useSettings } from '../settings/SettingsContext';

/** Un número de la URL: entero entre 0 y `max`; cualquier otra cosa vale 0 (un enlace manipulado no inventa cifras). */
const urlCount = (v: string | undefined, max: number) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 && n <= max ? n : 0;
};

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
  const review = params.modo === 'repaso';
  const [showOffer, setShowOffer] = useState(() =>
    reminderOfferApplies({
      remindersSupported: REMINDERS_SUPPORTED,
      review,
      reminderOffered: settings.reminderOffered,
      reminderEnabled: settings.reminder.enabled,
    })
  );
  // Lo que aplicaba al abrir: la tarjeta de instalar nunca aparece a mitad de visita porque se respondió el recordatorio.
  const [reminderAppliedOnOpen] = useState(showOffer);
  const accepting = useRef(false);

  // Al mostrarla se marca como ofrecida: si se ignora, no vuelve a aparecer en otras lecciones.
  useEffect(() => {
    if (showOffer) update({ reminderOffered: true });
  }, [showOffer, update]);

  // Tarjeta de instalar (solo web, una vez): igual que con el recordatorio, `installOffered` se toma al abrir para que la
  // tarjeta siga visible en esta visita aunque pase a true al mostrarla. En el celular la plataforma es null.
  const platform = useInstallPlatform();
  const [installOfferedBefore] = useState(settings.installOffered);
  const showInstall = installOfferApplies({
    platform,
    review,
    installOffered: installOfferedBefore,
    reminderApplies: reminderAppliedOnOpen,
  });
  useEffect(() => {
    if (showInstall) update({ installOffered: true });
  }, [showInstall, update]);

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
    showDialog(t('settings.noPermission.title'), t('settings.noPermission.message'));
  };
  const offer = showOffer ? { onAccept: accept, onDecline: () => setShowOffer(false) } : undefined;

  return (
    <LessonResultScreen
      title={lesson?.title ?? ''}
      teacher={teacher}
      mode={review ? 'review' : params.monedas === '0' ? 'replay' : 'lesson'}
      errors={urlCount(params.errors, 999)}
      coinsEarned={urlCount(params.monedas, 100)}
      dailyBonus={urlCount(params.premio, 100)}
      streak={currentStreak(progress)}
      streakRecovered={params.recuperada === '1'}
      onContinue={() => router.back()}
      reminderOffer={offer}
      installOffer={showInstall ? { onInstall: () => router.push('/instalar'), copyFirst: needsCopyBeforeInstall(platform) } : undefined}
      onReviewMistakes={
        failed && params.modo !== 'repaso'
          ? () => router.replace({ pathname: '/leccion/[id]', params: { id: params.id, repaso: failed } })
          : undefined
      }
    />
  );
}
