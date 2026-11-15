import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Button3D } from '../components/Button3D';
import { CardSurface } from '../components/CardSurface';
import { ColumnScrollView } from '../components/ColumnScrollView';
import { MiniBoard } from '../components/MiniBoard';
import { ThemeDiagram } from '../components/ThemeDiagram';
import { statusBarTop } from '../components/statusBarTop';
import { useWideLayout } from '../components/useWideLayout';
import { useI18n } from '../i18n/I18nContext';
import { piecesFromFen } from '../progress/progressGame';
import { useProgress } from '../progress/ProgressContext';
import { isPuzzleSolved } from '../progress/progressStore';
import { currentRating, formatDelta } from '../progress/puzzleRating';
import { useSettings } from '../settings/SettingsContext';
import { useTodayKey } from '../settings/useTodayKey';
import { Level, levelRange, Puzzle, PRACTICE_THEMES, puzzleGoal, themeName, userColor } from '../puzzles/puzzles';
import { dailyWeek, puzzleFinalFen, quantity, themeCount, themeSolvedCount, weekRatingDelta, type WeekState } from '../puzzles/puzzleView';
import { PuzzlesStatus } from '../puzzles/PuzzlesStatus';
import { levelsWithPuzzles, PuzzleSource } from '../puzzles/source';
import { THEME_DIAGRAMS } from '../puzzles/themeDiagrams';
import { isOfflineError, usePuzzleSource } from '../puzzles/usePuzzles';
import { cardSkin, type, colors, fonts, radius, space } from '../theme';

type Props = {
  onOpenDaily: (id: string) => void;
  /** `auto`: dificultad automática según el nivel de puzzles. Un tema sin nivel usa la dificultad elegida. */
  onPractice: (level: Level | 'auto', theme: string | null) => void;
};

const WEEKDAYS = [
  { key: 'puzzles.weekday.mon' },
  { key: 'puzzles.weekday.tue' },
  { key: 'puzzles.weekday.wed' },
  { key: 'puzzles.weekday.thu' },
  { key: 'puzzles.weekday.fri' },
  { key: 'puzzles.weekday.sat' },
  { key: 'puzzles.weekday.sun' },
] as const;

const WEEK_STATE = { solved: 'puzzles.week.solved', seen: 'puzzles.week.seen', none: 'puzzles.week.none' } as const;

/** Pestaña Puzzles (spec de la pantalla de Puzzles, 14-11-2026): cabecera, puzzle del día con tablero y semana, práctica y temas. */
export function PuzzlesScreen(props: Props) {
  const state = usePuzzleSource();
  if (state.status !== 'ready') return <PuzzlesStatus state={state} />;
  return <PuzzlesLoaded {...props} source={state.source} />;
}

type Daily = { status: 'loading' } | { status: 'error'; offline: boolean } | { status: 'ready'; puzzle: Puzzle };

function PuzzlesLoaded({ onOpenDaily, onPractice, source }: Props & { source: PuzzleSource }) {
  const { progress } = useProgress();
  const { t, tn, number, language } = useI18n();
  const { settings, update } = useSettings();
  const wide = useWideLayout();
  const { width } = useWindowDimensions();
  const today = useTodayKey();
  const [daily, setDaily] = useState<Daily>({ status: 'loading' });
  const [dailyAttempt, setDailyAttempt] = useState(0);
  const [week, setWeek] = useState<{ key: string; state: WeekState }[] | null>(null);

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

  // La semana del puzzle del día: el id de cada día se resuelve con la misma regla que el del día de hoy.
  useEffect(() => {
    let cancelled = false;
    dailyWeek(progress, source, new Date(`${today}T12:00:00`))
      .then((days) => !cancelled && setWeek(days))
      .catch(() => !cancelled && setWeek(null));
    return () => {
      cancelled = true;
    };
  }, [progress, source, today]);

  const levels = levelsWithPuzzles(source);
  const rating = currentRating(progress);
  const auto = settings.puzzleMode === 'auto';
  const level: Level = settings.puzzleLevel && levels.includes(settings.puzzleLevel) ? settings.puzzleLevel : levels[0] ?? 'facil';
  const solvedTotal = Object.keys(progress.puzzles).filter((id) => isPuzzleSolved(progress, id)).length;
  const history = progress.puzzleRating?.history ?? [];
  const deltaWeek = weekRatingDelta(history, rating, new Date(`${today}T12:00:00`));
  const boardSize = wide ? 220 : Math.min(width - space.lg * 2 - space.md * 2, 360);
  const record = daily.status === 'ready' ? progress.puzzles[daily.puzzle.id] : undefined;
  const done = !!record;
  const seen = record?.result === 'failed';

  const choose = (value: 'auto' | Level) => {
    if (value === 'auto') update({ puzzleMode: 'auto' });
    else update({ puzzleMode: 'manual', puzzleLevel: value });
  };

  const weekLabel =
    week && week.length
      ? t('puzzles.weekLabel', {
          days: week.map((d, i) => t(WEEK_STATE[d.state], { day: t(WEEKDAYS[i].key) })).join(', '),
        })
      : '';

  const quantityText = (n: number) => {
    const q = quantity(n);
    if (q.unit === 'millions') return t('puzzles.quantity.millions', { n: number(q.value) });
    if (q.unit === 'thousands') return t('puzzles.quantity.thousands', { n: number(q.value) });
    return number(q.value);
  };

  return (
    <ColumnScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: statusBarTop(space.md) }]}
    >
      <View style={[styles.header, !wide && styles.headerNarrow]}>
        <View style={styles.headerText}>
          <Text accessibilityRole="header" aria-level={1} style={styles.title}>{t('puzzles.title')}</Text>
          <Text style={styles.subtitle}>{t('puzzles.subtitle', { solved: number(solvedTotal), total: number(source.total) })}</Text>
        </View>
        {settings.showPuzzleRating && (
          <View style={styles.ratingPill} accessible accessibilityLabel={`${t('puzzles.myRating')} ${rating}`}>
            <Text style={styles.ratingText}>
              {t('puzzles.myRating')} <Text style={styles.ratingNumber}>{number(rating)}</Text>
            </Text>
            {deltaWeek !== 0 && (
              <Text style={[styles.ratingDelta, deltaWeek < 0 && styles.ratingDeltaDown]}>
                {deltaWeek > 0 ? '▲' : '▼'} {t('puzzles.weekChange', { delta: formatDelta(deltaWeek).replace(/^[+−]/, '') })}
              </Text>
            )}
          </View>
        )}
      </View>

      <View style={[styles.topRow, !wide && styles.column]}>
        {/* Puzzle del día */}
        <CardSurface style={[styles.card, styles.dailyCard, wide && styles.dailyWide]} radius={20}>
          <View style={[styles.dailyInner, !wide && styles.column]}>
            {daily.status === 'ready' && (
              <View style={styles.boardWrap}>
                <MiniBoard
                  size={boardSize}
                  corner="a1"
                  span={8}
                  pieces={piecesFromFen(record ? puzzleFinalFen(daily.puzzle) : daily.puzzle.fen)}
                />
              </View>
            )}
            <View style={styles.dailyContent}>
              {daily.status === 'ready' ? (
                <>
                  <Text style={styles.caption}>
                    {t('puzzles.daily')} ·{' '}
                    {new Intl.DateTimeFormat(language, { day: 'numeric', month: 'long' }).format(new Date(`${today}T12:00:00`))}
                  </Text>
                  <Text style={styles.dailyTitle}>{puzzleGoal(daily.puzzle, t)}</Text>
                  <View style={styles.sideRow}>
                    <View style={[styles.sideDot, userColor(daily.puzzle) === 'w' ? styles.dotWhite : styles.dotBlack]} />
                    <Text style={styles.sideText}>
                      {t(userColor(daily.puzzle) === 'w' ? 'common.youPlayWhite' : 'common.youPlayBlack')} ·{' '}
                      {t('common.level', { n: number(daily.puzzle.rating) })}
                    </Text>
                  </View>
                  {done ? (
                    <>
                      <Text style={[styles.doneText, !seen && styles.doneSolved]}>
                        {seen ? t('puzzles.seenSolution') : t('puzzles.solved')} {seen ? '' : '✓'}
                      </Text>
                      <Text style={styles.cardText}>{t('puzzles.tomorrow')}</Text>
                      <Button3D
                        label={t('puzzles.seeAgain')}
                        variant="secondary"
                        onPress={() => onOpenDaily(daily.puzzle.id)}
                        style={{ marginTop: space.md, alignSelf: 'flex-start' }}
                      />
                    </>
                  ) : (
                    <Button3D
                      label={t('puzzles.solve')}
                      variant="primary"
                      onPress={() => onOpenDaily(daily.puzzle.id)}
                      style={{ marginTop: space.md, alignSelf: 'flex-start' }}
                    />
                  )}
                  <View style={styles.week} accessible accessibilityLabel={weekLabel}>
                    {(week ?? Array.from({ length: 7 }, (_, i) => ({ key: `d${i}`, state: 'none' as WeekState }))).map((d, i) => {
                      const isToday = d.key === today;
                      return (
                        <View key={d.key} style={styles.weekCell}>
                          <View
                            style={[
                              styles.weekBox,
                              d.state === 'solved' && styles.weekSolved,
                              isToday && styles.weekToday,
                            ]}
                          />
                          <Text style={styles.weekDay}>{t(WEEKDAYS[i].key).slice(0, 1).toUpperCase()}</Text>
                        </View>
                      );
                    })}
                  </View>
                </>
              ) : daily.status === 'loading' ? (
                <Text style={styles.cardText}>{t('puzzles.loading')}</Text>
              ) : (
                <>
                  <Text style={styles.cardText}>{daily.offline ? t('puzzles.offline') : t('puzzles.loadError')}</Text>
                  <Button3D
                    label={t('common.retry')}
                    variant="secondary"
                    onPress={() => {
                      setDaily({ status: 'loading' });
                      setDailyAttempt((n) => n + 1);
                    }}
                    style={{ marginTop: space.md, alignSelf: 'flex-start' }}
                  />
                </>
              )}
            </View>
          </View>
        </CardSurface>

        {/* Práctica */}
        <CardSurface style={[styles.card, wide && styles.practiceCard]} radius={20}>
          <Text accessibilityRole="header" aria-level={2} style={styles.cardTitle}>{t('puzzles.practice')}</Text>
          <Text style={styles.cardText}>{t('puzzles.practiceLead')}</Text>
          <View style={styles.levels}>
            <LevelButton
              label={t('puzzles.mode.auto')}
              sub={t('puzzles.near', { n: number(rating) })}
              selected={auto}
              onPress={() => choose('auto')}
              emphasis
            />
            {levels.map((l) => (
              <LevelButton
                key={l}
                label={t(`puzzles.level.${l}`)}
                sub={levelRange(l)}
                selected={!auto && level === l}
                onPress={() => choose(l)}
              />
            ))}
          </View>
          <Button3D
            label={t('puzzles.practiceButton')}
            variant="secondary"
            onPress={() => onPractice(auto ? 'auto' : level, null)}
            style={{ marginTop: space.md }}
          />
        </CardSurface>
      </View>

      {/* Practicar un tema */}
      <CardSurface style={styles.card} radius={20}>
        <View style={styles.topicHead}>
          <Text accessibilityRole="header" aria-level={2} style={styles.cardTitle}>{t('puzzles.topicTitle')}</Text>
          <Text style={styles.topicHint}>{t('puzzles.topicHint')}</Text>
        </View>
        <View style={styles.topics}>
          {[null, ...PRACTICE_THEMES].map((key) => {
            const solved = themeSolvedCount(progress, key);
            const available = themeCount(source, levels, key);
            const name = key ? themeName(key, t) : t('puzzles.themeAll');
            const diagram = THEME_DIAGRAMS[key ?? 'todos'] ?? THEME_DIAGRAMS.todos;
            const mate = key && /^mateIn[123]$/.test(key) ? Number(key.slice(-1)) : undefined;
            const solvedText = solved > 0 ? tn('puzzles.themeSolved', solved) : '';
            const label = t('puzzles.themeLabel', {
              theme: name,
              solved: solvedText || t('puzzles.themeNone'),
              available: quantityText(available),
            });
            return (
              <Pressable
                key={key ?? 'todos'}
                onPress={() => onPractice(auto ? 'auto' : level, key)}
                accessibilityRole="button"
                accessibilityLabel={label}
                style={[styles.topic, wide ? styles.topicWide : styles.topicNarrow]}
              >
                <ThemeDiagram diagram={diagram} mate={mate} />
                <Text style={styles.topicName} numberOfLines={2}>{name}</Text>
                <Text style={styles.topicCount} numberOfLines={1}>
                  {solved > 0 && <Text style={styles.topicSolved}>{tn('puzzles.themeSolved', solved)} · </Text>}
                  {quantityText(available)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </CardSurface>
    </ColumnScrollView>
  );
}

function LevelButton({
  label,
  sub,
  selected,
  onPress,
  emphasis,
}: {
  label: string;
  sub: string;
  selected: boolean;
  onPress: () => void;
  emphasis?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label}, ${sub}`}
      style={[styles.level, emphasis && styles.levelEmphasis, selected && styles.levelSelected]}
    >
      <Text style={[styles.levelText, selected && { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
        {label}
      </Text>
      <Text style={styles.levelSub} numberOfLines={1}>{sub}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: space.md },
  headerNarrow: { flexDirection: 'column', gap: space.sm },
  headerText: { flex: 1 },
  title: { fontFamily: fonts.extrabold, fontSize: 32, lineHeight: 36, color: colors.text },
  subtitle: { fontFamily: fonts.bold, fontSize: type.secondary, color: colors.textMuted, marginTop: 2 },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space.sm,
    ...cardSkin,
    borderRadius: 999,
    borderWidth: 2,
    paddingVertical: 6,
    paddingHorizontal: space.md,
  },
  ratingText: { fontFamily: fonts.bold, fontSize: type.secondary, color: colors.textMuted },
  ratingNumber: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.gold },
  ratingDelta: { fontFamily: fonts.extrabold, fontSize: type.secondary, color: colors.primary },
  ratingDeltaDown: { color: colors.textMuted },
  topRow: { flexDirection: 'row', gap: space.lg, alignItems: 'stretch', marginTop: space.lg },
  column: { flexDirection: 'column' },
  card: { ...cardSkin, borderRadius: 20, borderWidth: 2, padding: space.lg },
  dailyCard: { flex: 1.25, borderColor: colors.gold, borderBottomColor: '#B8901C' },
  practiceCard: { flex: 1 },
  dailyWide: { minWidth: 0 },
  dailyInner: { flexDirection: 'row', gap: space.lg, alignItems: 'center' },
  boardWrap: { flexShrink: 0 },
  dailyContent: { flex: 1, minWidth: 0 },
  caption: { fontFamily: fonts.extrabold, fontSize: type.caption, color: colors.gold, textTransform: 'uppercase', letterSpacing: 0.5 },
  dailyTitle: { fontFamily: fonts.extrabold, fontSize: 26, lineHeight: 30, color: colors.text, marginTop: 2 },
  sideRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.sm },
  sideDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: colors.outline },
  dotWhite: { backgroundColor: '#FFFFFF' },
  dotBlack: { backgroundColor: '#111111' },
  sideText: { fontFamily: fonts.bold, fontSize: type.secondary, color: colors.textMuted },
  doneText: { fontFamily: fonts.extrabold, fontSize: type.body, color: colors.textMuted, marginTop: space.sm },
  doneSolved: { color: colors.primary },
  cardText: { fontFamily: fonts.bold, fontSize: type.secondary, color: colors.textMuted, marginTop: 2, lineHeight: 20 },
  cardTitle: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.text },
  week: { flexDirection: 'row', gap: space.sm, marginTop: space.lg },
  weekCell: { alignItems: 'center', gap: 3 },
  weekBox: { width: 20, height: 20, borderRadius: 4, backgroundColor: colors.surfaceRaised },
  weekSolved: { backgroundColor: colors.gold },
  weekToday: { borderWidth: 2, borderColor: colors.gold },
  weekDay: { fontFamily: fonts.bold, fontSize: 10, color: colors.textMuted },
  levels: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
  level: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    backgroundColor: colors.surface,
  },
  levelEmphasis: { flex: 1.5 },
  levelSelected: { borderColor: colors.primary, backgroundColor: colors.surfaceRaised },
  levelText: { fontFamily: fonts.extrabold, fontSize: type.secondary, color: colors.textMuted },
  levelSub: { fontFamily: fonts.semibold, fontSize: 11, color: colors.textMuted },
  topicHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: space.md },
  topicHint: { fontFamily: fonts.bold, fontSize: type.secondary, color: colors.textMuted },
  topics: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md },
  topic: {
    ...cardSkin,
    borderRadius: radius.control,
    borderWidth: 2,
    padding: space.sm,
    alignItems: 'center',
    gap: 4,
  },
  topicWide: { flexBasis: '23.4%', flexGrow: 1 },
  topicNarrow: { flexBasis: '47.5%', flexGrow: 1 },
  topicName: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.text, textAlign: 'center' },
  topicCount: { fontFamily: fonts.semibold, fontSize: type.caption, color: colors.textMuted, textAlign: 'center' },
  topicSolved: { color: colors.primary, fontFamily: fonts.extrabold },
});
