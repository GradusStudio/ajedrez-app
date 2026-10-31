import React from 'react';
import { ScrollView, StatusBar as RNStatusBar, StyleSheet, Text, View } from 'react-native';
import { Button3D } from '../components/Button3D';
import { StatIcon } from '../components/StatIcon';
import { Bot } from '../data/bots';
import { BubbleRow } from '../lesson/TeacherBubble';
import { OFFER_REMINDER_HOUR } from '../settings/reminderPlan';
import { colors, fonts, radius, space } from '../theme';

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
};

const HEADINGS = { lesson: 'Lección completada', replay: 'Repaso completado', review: 'Errores repasados' } as const;

export function LessonResultScreen({ title, teacher, mode, errors, coinsEarned, dailyBonus, streak, streakRecovered, onContinue, onReviewMistakes, reminderOffer }: Props) {
  return (
    // Con scroll: en un teléfono chico con letra grande, «Continuar» no puede quedar afuera.
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: (RNStatusBar.currentHeight ?? 40) + space.xxl }]}
    >
      <Text style={styles.heading}>{HEADINGS[mode]}</Text>
      <Text style={styles.lesson}>{title}</Text>

      {teacher && (
        <View style={styles.teacher} accessible accessibilityLabel={`${teacher.bot.name}: ${teacher.phrase}`}>
          <BubbleRow bot={teacher.bot} expression="acierto" text={teacher.phrase} />
        </View>
      )}

      <View style={styles.row}>
        <View style={styles.stat}>
          <StatIcon name="coin" size={22} />
          <Text style={[styles.statValue, { color: colors.gold }]}>+{coinsEarned}</Text>
          <Text style={styles.statLabel}>{coinsEarned === 1 ? 'moneda' : 'monedas'}</Text>
        </View>
        <View style={styles.stat}>
          <StatIcon name="streak" size={22} />
          <Text style={[styles.statValue, { color: colors.gold }]}>{streak}</Text>
          <Text style={styles.statLabel}>{streak === 1 ? 'día de racha' : 'días de racha'}</Text>
        </View>
        <View style={styles.stat}>
          <View style={{ height: 22 }} />
          <Text style={styles.statValue}>{errors}</Text>
          <Text style={styles.statLabel}>{errors === 1 ? 'error' : 'errores'}</Text>
        </View>
      </View>

      {mode === 'replay' && (
        <Text style={styles.note}>Las monedas de cada lección se ganan solo la primera vez que la terminas.</Text>
      )}
      {dailyBonus > 0 && (
        <Text style={[styles.note, { color: colors.gold }]}>Premio del día: +{dailyBonus} monedas.</Text>
      )}
      {streakRecovered && <Text style={[styles.note, { color: colors.gold }]}>Recuperaste tu racha.</Text>}
      {mode === 'review' && errors === 0 && (
        <Text style={styles.note}>Resolviste todos los pasos fallados. Salen de tu lista de errores.</Text>
      )}
      {mode === 'review' && errors > 0 && (
        <Text style={styles.note}>Los pasos que volviste a fallar siguen en tu lista de errores.</Text>
      )}

      {reminderOffer && (
        <View style={styles.offer}>
          <Text style={styles.offerTitle}>¿Quieres que te recuerde practicar?</Text>
          <Button3D label={`Sí, a las ${OFFER_REMINDER_HOUR}:00`} onPress={reminderOffer.onAccept} style={{ marginTop: space.md }} />
          <Button3D label="Ahora no" onPress={reminderOffer.onDecline} style={{ marginTop: space.sm }} />
        </View>
      )}

      <View style={{ flex: 1 }} />
      <Button3D label="Continuar" variant="primary" onPress={onContinue} />
      {onReviewMistakes && (
        <Button3D label="Repasar errores" onPress={onReviewMistakes} style={{ marginTop: space.md }} />
      )}
    </ScrollView>
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
  note: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted, marginTop: space.lg, textAlign: 'center' },
});
