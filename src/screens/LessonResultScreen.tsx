import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { ColumnScrollView } from '../components/ColumnScrollView';
import { Button3D } from '../components/Button3D';
import { CountUp } from '../components/CountUp';
import { StreakIgniteCard } from '../components/StreakIgniteCard';
import { COIN_EDGE, StatIcon } from '../components/StatIcon';
import { Tip } from '../components/Tip';
import { useReducedMotion } from '../components/useReducedMotion';
import { Bot } from '../data/bots';
import { useI18n } from '../i18n/I18nContext';
import { BubbleRow } from '../lesson/TeacherBubble';
import { OFFER_REMINDER_HOUR } from '../settings/reminderPlan';
import { TIP_MESSAGES } from '../settings/tips';
import { useTips } from '../settings/useTips';
import { cardSkin, type, colors, fonts, radius, space } from '../theme';
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
  /** La lección encendió la racha hoy: la tarjeta hace la animación completa. */
  streakLit: boolean;
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

export function LessonResultScreen({ title, teacher, mode, errors, coinsEarned, dailyBonus, streak, streakRecovered, streakLit, onContinue, onReviewMistakes, reminderOffer, installOffer, extra }: Props) {
  const { t, tn } = useI18n();
  const reduced = useReducedMotion();
  const perfect = mode === 'lesson' && errors === 0;
  // La tarjeta de monedas late una vez en una lección perfecta y la llama hace el reencendido.
  const [celebrate] = useState(() => new Animated.Value(1));
  const [todayIndex] = useState(() => (new Date().getDay() + 6) % 7);
  const tips = useTips(coinsEarned > 0 || dailyBonus > 0 ? ['coins.first'] : []);
  const coinRef = useRef<React.ComponentRef<typeof View>>(null);
  const [showCoinTip, setShowCoinTip] = useState(false);
  const tipMessage = tips.current ? TIP_MESSAGES[tips.current] : null;
  const hasCoinTip = !!tips.current;

  useEffect(() => {
    if (!hasCoinTip) return;
    const id = setTimeout(() => setShowCoinTip(true), 1400);
    return () => clearTimeout(id);
  }, [hasCoinTip]);

  useEffect(() => {
    if (!perfect || reduced) return;
    const pulse = Animated.sequence([
      Animated.timing(celebrate, { toValue: 1.07, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(celebrate, { toValue: 1, duration: 300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]);
    pulse.start();
    return () => pulse.stop();
  }, [perfect, reduced, celebrate]);

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
        <Animated.View ref={coinRef} style={[styles.stat, styles.coinStat, { transform: [{ scale: celebrate }] }]}>
          <StatIcon name="coin" size={22} />
          <Text style={[styles.statValue, { color: colors.gold }]}>+<CountUp value={coinsEarned} /></Text>
          <Text style={styles.statLabel}>{tn('lessonResult.coin', coinsEarned)}</Text>
        </Animated.View>
        <View style={styles.stat}>
          <View style={{ height: 22 }} />
          <Text style={styles.statValue}>{errors}</Text>
          <Text style={styles.statLabel}>{tn('lessonResult.error', errors)}</Text>
        </View>
      </View>

      <StreakIgniteCard
        streak={streak}
        streakLit={streakLit}
        streakRecovered={streakRecovered}
        state="safe"
        todayIndex={todayIndex}
      />

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

      <Tip
        visible={showCoinTip && !!tips.current}
        title={tipMessage ? t(tipMessage.title) : ''}
        text={tipMessage ? t(tipMessage.text) : ''}
        target={coinRef}
        onNext={tips.next}
        onClose={tips.close}
      />
    </ColumnScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  content: { flexGrow: 1, paddingHorizontal: space.lg, paddingBottom: space.xxl },
  heading: { fontFamily: fonts.extrabold, fontSize: type.title, color: colors.text },
  lesson: { fontFamily: fonts.bold, fontSize: type.body, color: colors.textMuted, marginTop: 4 },
  teacher: { marginTop: space.xl },
  row: { flexDirection: 'row', gap: space.sm, marginTop: space.xxl },
  stat: {
    flex: 1,
    ...cardSkin,
    borderRadius: radius.control,
    borderWidth: 2,
    alignItems: 'center',
    paddingVertical: space.lg,
    paddingHorizontal: space.xs,
  },
  // Monedas como protagonista: borde dorado, con el canto 3D del color del canto de la moneda (StatIcon).
  coinStat: {
    borderColor: colors.gold,
    borderBottomColor: COIN_EDGE,
  },
  statValue: { fontFamily: fonts.extrabold, fontSize: 30, color: colors.text, marginTop: space.xs },
  statLabel: { fontFamily: fonts.semibold, fontSize: type.caption, color: colors.textMuted, marginTop: 2, textAlign: 'center' },
  offer: {
    marginTop: space.xl,
    ...cardSkin,
    borderRadius: radius.control,
    borderWidth: 2,
    padding: space.lg,
  },
  offerTitle: { fontFamily: fonts.bold, fontSize: type.body, color: colors.text, textAlign: 'center' },
  offerText: { fontFamily: fonts.bold, fontSize: type.body, color: colors.textMuted, textAlign: 'center', marginTop: space.xs, lineHeight: 20 },
  note: { fontFamily: fonts.bold, fontSize: type.body, color: colors.textMuted, marginTop: space.lg, textAlign: 'center' },
});
