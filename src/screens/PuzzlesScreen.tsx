import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ColumnScrollView } from '../components/ColumnScrollView';
import { Button3D } from '../components/Button3D';
import { useI18n } from '../i18n/I18nContext';
import { useProgress } from '../progress/ProgressContext';
import { isPuzzleSolved } from '../progress/progressStore';
import { Level, levelRange, Puzzle, PRACTICE_THEMES, puzzleGoal, themeName } from '../puzzles/puzzles';
import { PuzzlesStatus } from '../puzzles/PuzzlesStatus';
import { levelsWithPuzzles, PuzzleSource } from '../puzzles/source';
import { isOfflineError, usePuzzleSource } from '../puzzles/usePuzzles';
import { colors, fonts, radius, space } from '../theme';
import { statusBarTop } from '../components/statusBarTop';

type Props = {
  onOpenDaily: (id: string) => void;
  onPractice: (level: Level, theme: string | null) => void;
};

// Pestaña Puzzles: puzzle del día y práctica por nivel y tema (mapa-de-pantallas.md, 2.8).
export function PuzzlesScreen(props: Props) {
  const state = usePuzzleSource();
  if (state.status !== 'ready') return <PuzzlesStatus state={state} />;
  return <PuzzlesLoaded {...props} source={state.source} />;
}

type Daily = { status: 'loading' } | { status: 'error'; offline: boolean } | { status: 'ready'; puzzle: Puzzle };

function PuzzlesLoaded({ onOpenDaily, onPractice, source }: Props & { source: PuzzleSource }) {
  const { progress } = useProgress();
  const { t, number } = useI18n();
  // Dificultad inicial según el nivel elegido en la bienvenida.
  const [level, setLevel] = useState<Level>(progress.profile.level === 'casual' ? 'medio' : 'facil');
  const [theme, setTheme] = useState<string | null>(null);
  const [daily, setDaily] = useState<Daily>({ status: 'loading' });
  const [dailyAttempt, setDailyAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    source.daily().then(
      (puzzle) => !cancelled && setDaily({ status: 'ready', puzzle }),
      (e) => !cancelled && setDaily({ status: 'error', offline: isOfflineError(e) })
    );
    return () => {
      cancelled = true;
    };
  }, [source, dailyAttempt]);
  // En la web, baja en segundo plano lo necesario para jugar sin conexión.
  useEffect(() => source.prepareOffline(), [source]);

  const levels = levelsWithPuzzles(source);
  const dailyDone = daily.status === 'ready' ? progress.puzzles[daily.puzzle.id] : undefined;
  const solvedTotal = Object.keys(progress.puzzles).filter((id) => isPuzzleSolved(progress, id)).length;
  const available = source.count(level, theme);

  return (
    <ColumnScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: statusBarTop(space.md) }]}
    >
      <Text style={styles.title}>{t('puzzles.title')}</Text>
      <Text style={styles.subtitle}>{t('puzzles.subtitle', { solved: number(solvedTotal), total: number(source.total) })}</Text>

      {/* Puzzle del día */}
      <View style={[styles.card, styles.dailyCard]}>
        <Text style={styles.caption}>{t('puzzles.daily')}</Text>
        {daily.status === 'ready' ? (
          <>
            <Text style={styles.cardTitle}>{puzzleGoal(daily.puzzle, t)}</Text>
            <Text style={styles.cardText}>
              {dailyDone
                ? t(dailyDone.result === 'failed' ? 'puzzles.dailyFailed' : 'puzzles.dailySolved', { n: daily.puzzle.rating })
                : t('common.level', { n: daily.puzzle.rating })}
            </Text>
            <Button3D
              label={dailyDone ? t('puzzles.seeAgain') : t('puzzles.solve')}
              variant={dailyDone ? 'secondary' : 'primary'}
              onPress={() => onOpenDaily(daily.puzzle.id)}
              style={{ marginTop: space.md }}
            />
          </>
        ) : daily.status === 'loading' ? (
          <Text style={styles.cardText}>{t('puzzles.loading')}</Text>
        ) : (
          <>
            <Text accessibilityRole="alert" style={styles.cardText}>
              {daily.offline ? t('puzzles.offline') : t('puzzles.loadError')}
            </Text>
            <Button3D
              label={t('common.retry')}
              variant="secondary"
              onPress={() => {
                setDaily({ status: 'loading' });
                setDailyAttempt((n) => n + 1);
              }}
              style={{ marginTop: space.md }}
            />
          </>
        )}
      </View>

      {/* Práctica */}
      <Text style={styles.section}>{t('puzzles.practice')}</Text>
      <Text style={styles.label}>{t('puzzles.difficulty')}</Text>
      <View style={styles.segmented}>
        {levels.map((l) => {
          const selected = l === level;
          return (
            <Pressable
              key={l}
              onPress={() => setLevel(l)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={t('puzzles.levelLabel', { label: t(`puzzles.level.${l}`), range: levelRange(l) })}
              style={[styles.segment, selected && styles.segmentSelected]}
            >
              <Text style={[styles.segmentText, selected && { color: colors.text }]}>{t(`puzzles.level.${l}`)}</Text>
              <Text style={styles.segmentSub}>{levelRange(l)}</Text>
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

      {available > 0 && (
        <Button3D label={t('puzzles.practiceButton')} variant="primary" onPress={() => onPractice(level, theme)} style={{ marginTop: space.lg }} />
      )}
      <Text style={styles.count}>{t('puzzles.count', { n: number(available) })}</Text>
    </ColumnScrollView>
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
