import React from 'react';
import { StatusBar as RNStatusBar, StyleSheet, Text, View } from 'react-native';
import { Button3D } from '../components/Button3D';
import { StatIcon } from '../components/StatIcon';
import { colors, fonts, radius, space } from '../theme';

type Props = {
  title: string;
  /** lesson: primera vez · replay: lección ya terminada antes · review: repaso de errores */
  mode: 'lesson' | 'replay' | 'review';
  errors: number;
  xpEarned: number;
  streak: number;
  onContinue: () => void;
  /** Solo si hubo errores: abre el repaso de los pasos fallados. */
  onReviewMistakes?: () => void;
};

const HEADINGS = { lesson: 'Lección completada', replay: 'Repaso completado', review: 'Errores repasados' } as const;

export function LessonResultScreen({ title, mode, errors, xpEarned, streak, onContinue, onReviewMistakes }: Props) {
  return (
    <View style={[styles.screen, { paddingTop: (RNStatusBar.currentHeight ?? 40) + space.xxl }]}>
      <Text style={styles.heading}>{HEADINGS[mode]}</Text>
      <Text style={styles.lesson}>{title}</Text>

      <View style={styles.row}>
        <View style={styles.stat}>
          <StatIcon name="xp" size={22} />
          <Text style={[styles.statValue, { color: colors.gold }]}>+{xpEarned}</Text>
          <Text style={styles.statLabel}>XP</Text>
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
        <Text style={styles.note}>La XP de cada lección se suma solo la primera vez que la terminas.</Text>
      )}
      {mode === 'review' && errors === 0 && (
        <Text style={styles.note}>Resolviste todos los pasos fallados. Salen de tu lista de errores.</Text>
      )}
      {mode === 'review' && errors > 0 && (
        <Text style={styles.note}>Los pasos que volviste a fallar siguen en tu lista de errores.</Text>
      )}

      <View style={{ flex: 1 }} />
      <Button3D label="Continuar" variant="primary" onPress={onContinue} />
      {onReviewMistakes && (
        <Button3D label="Repasar errores" onPress={onReviewMistakes} style={{ marginTop: space.md }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space.lg, paddingBottom: space.xxl },
  heading: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.text },
  lesson: { fontFamily: fonts.bold, fontSize: 16, color: colors.textMuted, marginTop: 4 },
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
  note: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted, marginTop: space.lg, textAlign: 'center' },
});
