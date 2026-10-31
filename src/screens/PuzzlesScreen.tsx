import React, { useState } from 'react';
import { Pressable, ScrollView, StatusBar as RNStatusBar, StyleSheet, Text, View } from 'react-native';
import { Button3D } from '../components/Button3D';
import { useI18n } from '../i18n/I18nContext';
import { useProgress } from '../progress/ProgressContext';
import { isPuzzleSolved } from '../progress/progressStore';
import {
  countPuzzles,
  dailyPuzzle,
  Level,
  LEVELS,
  PRACTICE_THEMES,
  puzzleGoal,
  puzzles,
  themeName,
} from '../puzzles/puzzles';
import { colors, fonts, radius, space } from '../theme';

type Props = {
  onOpenDaily: (id: string) => void;
  onPractice: (level: Level, theme: string | null) => void;
};

// Pestaña Puzzles: puzzle del día y práctica por nivel y tema (mapa-de-pantallas.md, 2.8).
export function PuzzlesScreen({ onOpenDaily, onPractice }: Props) {
  const { progress } = useProgress();
  const { t, number } = useI18n();
  // Dificultad inicial según el nivel elegido en la bienvenida.
  const [level, setLevel] = useState<Level>(progress.profile.level === 'casual' ? 'medio' : 'facil');
  const [theme, setTheme] = useState<string | null>(null);

  const daily = dailyPuzzle();
  const dailyDone = progress.puzzles[daily.id];
  const solvedTotal = puzzles.filter((p) => isPuzzleSolved(progress, p.id)).length;
  const available = countPuzzles(level, theme);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: (RNStatusBar.currentHeight ?? 40) + space.md }]}
    >
      <Text style={styles.title}>{t('puzzles.title')}</Text>
      <Text style={styles.subtitle}>{t('puzzles.subtitle', { solved: solvedTotal, total: number(puzzles.length) })}</Text>

      {/* Puzzle del día */}
      <View style={[styles.card, styles.dailyCard]}>
        <Text style={styles.caption}>{t('puzzles.daily')}</Text>
        <Text style={styles.cardTitle}>{puzzleGoal(daily, t)}</Text>
        <Text style={styles.cardText}>
          {dailyDone
            ? t(dailyDone.result === 'failed' ? 'puzzles.dailyFailed' : 'puzzles.dailySolved', { n: daily.rating })
            : t('common.level', { n: daily.rating })}
        </Text>
        <Button3D
          label={dailyDone ? t('puzzles.seeAgain') : t('puzzles.solve')}
          variant={dailyDone ? 'secondary' : 'primary'}
          onPress={() => onOpenDaily(daily.id)}
          style={{ marginTop: space.md }}
        />
      </View>

      {/* Práctica */}
      <Text style={styles.section}>{t('puzzles.practice')}</Text>
      <Text style={styles.label}>{t('puzzles.difficulty')}</Text>
      <View style={styles.segmented}>
        {(Object.keys(LEVELS) as Level[]).map((l) => {
          const selected = l === level;
          return (
            <Pressable
              key={l}
              onPress={() => setLevel(l)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={t('puzzles.levelLabel', { label: t(`puzzles.level.${l}`), min: LEVELS[l].min, max: LEVELS[l].max })}
              style={[styles.segment, selected && styles.segmentSelected]}
            >
              <Text style={[styles.segmentText, selected && { color: colors.text }]}>{t(`puzzles.level.${l}`)}</Text>
              <Text style={styles.segmentSub}>
                {LEVELS[l].min}–{LEVELS[l].max}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>{t('puzzles.theme')}</Text>
      <View style={styles.themes}>
        {[null, ...PRACTICE_THEMES].map((key) => {
          const selected = key === theme;
          return (
            <Pressable
              key={key ?? 'todos'}
              onPress={() => setTheme(key)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={[styles.theme, selected && styles.themeSelected]}
            >
              <Text style={[styles.themeText, selected && { color: colors.text }]}>{key ? themeName(key, t) : t('puzzles.themeAll')}</Text>
            </Pressable>
          );
        })}
      </View>

      <Button3D label={t('puzzles.practiceButton')} variant="primary" onPress={() => onPractice(level, theme)} style={{ marginTop: space.lg }} />
      <Text style={styles.count}>{t('puzzles.count', { n: available })}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  title: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.text },
  subtitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted, marginTop: 2 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    borderBottomWidth: 4,
    borderBottomColor: colors.surfaceShadow,
    paddingVertical: space.md,
    paddingHorizontal: 14,
  },
  dailyCard: { marginTop: space.lg, borderColor: colors.gold, borderBottomColor: '#B8901C' },
  caption: {
    fontFamily: fonts.extrabold,
    fontSize: 12,
    color: colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardTitle: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.text, marginTop: 2 },
  cardText: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted, marginTop: 2 },
  section: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.text, marginTop: space.xl },
  label: {
    fontFamily: fonts.extrabold,
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: space.md,
    marginBottom: space.sm,
  },
  segmented: { flexDirection: 'row', gap: space.sm },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    backgroundColor: colors.surface,
  },
  segmentSelected: { borderColor: colors.primary, backgroundColor: colors.surfaceRaised },
  segmentText: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.textMuted },
  segmentSub: { fontFamily: fonts.semibold, fontSize: 11, color: colors.textMuted },
  themes: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  theme: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    backgroundColor: colors.surface,
    paddingVertical: 6,
    paddingHorizontal: space.md,
  },
  themeSelected: { borderColor: colors.primary, backgroundColor: colors.surfaceRaised },
  themeText: { fontFamily: fonts.bold, fontSize: 13, color: colors.textMuted },
  count: { fontFamily: fonts.semibold, fontSize: 12, color: colors.textMuted, marginTop: space.sm, textAlign: 'center' },
});
