import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ColumnScrollView } from '../components/ColumnScrollView';
import { Button3D } from '../components/Button3D';
import { StatIcon } from '../components/StatIcon';
import { Bot } from '../data/bots';
import { useI18n } from '../i18n/I18nContext';
import { BubbleRow } from '../lesson/TeacherBubble';
import { OFFER_REMINDER_HOUR } from '../settings/reminderPlan';
import { colors, fonts, radius, space } from '../theme';
import { statusBarTop } from '../components/statusBarTop';

type Props = {
  title: string;
  /** Profesor de la lección y su frase de cierre. */
  teacher?: { bot: Bot; phrase: string };
  /** lesson: primera vez · replay: lección ya terminada antes · review: repaso de errores */
  mode: 'lesson' | 'replay' | 'review';
  errors: number;
  coinsEarned: number;
  /** Premio del día, si esta lección fue la primera acción de hoy. */
  dailyBonus: number;
  streak: number;
  /** Con esta lección se completó la recuperación de la racha. */
  streakRecovered: boolean;
  onContinue: () => void;
  /** Solo si hubo errores: abre el repaso de los pasos fallados. */
  onReviewMistakes?: () => void;
  /** Oferta única del recordatorio diario; no bloquea Continuar. */
  reminderOffer?: { onAccept: () => void; onDecline: () => void };
  /** Tarjeta única de instalar Gradus (solo web); no bloquea Continuar. `copyFirst`: en iPhone, avisa que guarde una copia antes. */
  installOffer?: { onInstall: () => void; copyFirst: boolean };
  /** Tarjeta extra debajo de las ofertas (el cartel de sincronizar). */
  extra?: React.ReactNode;
};

export function LessonResultScreen({ title, teacher, mode, errors, coinsEarned, dailyBonus, streak, streakRecovered, onContinue, onReviewMistakes, reminderOffer, installOffer, extra }: Props) {
  const { t, tn } = useI18n();
  return (
    // Con scroll: en un teléfono chico con letra grande, «Continuar» no puede quedar afuera.
    <ColumnScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: statusBarTop(space.xxl) }]}
    >
      <Text style={styles.heading}>{t(`lessonResult.heading.${mode}`)}</Text>
      <Text style={styles.lesson}>{title}</Text>

      {teacher && (
        <View style={styles.teacher} accessible accessibilityLabel={t('lesson.teacherSays', { name: teacher.bot.name, text: teacher.phrase })}>
          <BubbleRow bot={teacher.bot} expression="acierto" text={teacher.phrase} />
        </View>
      )}

      <View style={styles.row}>
        <View style={styles.stat}>
          <StatIcon name="coin" size={22} />
          <Text style={[styles.statValue, { color: colors.gold }]}>+{coinsEarned}</Text>
          <Text style={styles.statLabel}>{tn('lessonResult.coin', coinsEarned)}</Text>
        </View>
        <View style={styles.stat}>
          <StatIcon name="streak" size={22} />
          <Text style={[styles.statValue, { color: colors.gold }]}>{streak}</Text>
          <Text style={styles.statLabel}>{tn('lessonResult.streakDay', streak)}</Text>
        </View>
        <View style={styles.stat}>
          <View style={{ height: 22 }} />
          <Text style={styles.statValue}>{errors}</Text>
          <Text style={styles.statLabel}>{tn('lessonResult.error', errors)}</Text>
        </View>
      </View>

      {mode === 'replay' && (
        <Text style={styles.note}>{t('lessonResult.replayNote')}</Text>
      )}
      {dailyBonus > 0 && (
        <Text style={[styles.note, { color: colors.gold }]}>{t('common.dailyBonus', { n: dailyBonus })}</Text>
      )}
      {streakRecovered && <Text style={[styles.note, { color: colors.gold }]}>{t('common.streakRecovered')}</Text>}
      {mode === 'review' && errors === 0 && <Text style={styles.note}>{t('lessonResult.reviewAllSolved')}</Text>}
      {mode === 'review' && errors > 0 && <Text style={styles.note}>{t('lessonResult.reviewSomeFailed')}</Text>}

      {reminderOffer && (
        <View style={styles.offer}>
          <Text style={styles.offerTitle}>{t('lessonResult.reminderQuestion')}</Text>
          <Button3D label={t('lessonResult.reminderYes', { hour: OFFER_REMINDER_HOUR })} onPress={reminderOffer.onAccept} style={{ marginTop: space.md }} />
          <Button3D label={t('lessonResult.reminderNo')} onPress={reminderOffer.onDecline} style={{ marginTop: space.sm }} />
        </View>
      )}

      {installOffer && (
        <View style={styles.offer}>
          <Text accessibilityRole="header" style={styles.offerTitle}>{t('lessonResult.installTitle')}</Text>
          <Text style={styles.offerText}>{t('lessonResult.installText')}</Text>
          {installOffer.copyFirst && <Text style={styles.offerText}>{t('install.iosCopyFirst')}</Text>}
          <Button3D label={t('install.button.install')} onPress={installOffer.onInstall} style={{ marginTop: space.md, minHeight: 48 }} />
        </View>
      )}

      {extra}

      <View style={{ flex: 1, minHeight: space.lg }} />
      <Button3D label={t('common.continue')} variant="primary" onPress={onContinue} />
      {onReviewMistakes && (
        <Button3D label={t('common.reviewMistakes')} onPress={onReviewMistakes} style={{ marginTop: space.md }} />
      )}
    </ColumnScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, paddingHorizontal: space.lg, paddingBottom: space.xxl },
  heading: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.text },
  lesson: { fontFamily: fonts.bold, fontSize: 16, color: colors.textMuted, marginTop: 4 },
  teacher: { marginTop: space.xl },
  row: { flexDirection: 'row', gap: space.sm, marginTop: space.xxl },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    borderBottomWidth: 4,
    borderBottomColor: colors.surfaceShadow,
    alignItems: 'center',
    paddingVertical: space.lg,
    paddingHorizontal: space.xs,
  },
  statValue: { fontFamily: fonts.extrabold, fontSize: 30, color: colors.text, marginTop: space.xs },
  statLabel: { fontFamily: fonts.semibold, fontSize: 12, color: colors.textMuted, marginTop: 2, textAlign: 'center' },
  offer: {
    marginTop: space.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    borderBottomWidth: 4,
    borderBottomColor: colors.surfaceShadow,
    padding: space.lg,
  },
  offerTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text, textAlign: 'center' },
  offerText: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: space.xs, lineHeight: 20 },
  note: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted, marginTop: space.lg, textAlign: 'center' },
});
