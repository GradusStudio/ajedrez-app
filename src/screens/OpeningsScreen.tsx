import React, { useEffect, useState } from 'react';
import { useIsFocused } from 'expo-router';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Board } from '../components/Board';
import { BoardSizeContext } from '../components/BoardSizeContext';
import { ColumnScrollView } from '../components/ColumnScrollView';
import { Chip } from '../components/Chip';
import { LessonRail } from '../components/LessonRail';
import { ProgressBar } from '../components/ProgressBar';
import { RecoveryCard } from '../components/RecoveryCard';
import { Segmented } from '../components/Segmented';
import { StatIcon } from '../components/StatIcon';
import { StreakFlame, flameStateOf } from '../components/StreakFlame';
import { UnitWheel, WHEEL_WIDTH } from '../components/UnitWheel';
import { BotStyle } from '../data/bots';
import { Lesson, OpeningCourse } from '../data/lessonTypes';
import { useContent } from '../data/useContent';
import { useI18n } from '../i18n/I18nContext';
import { lessonStates } from '../progress/path';
import { openingGame, progressPosition } from '../progress/progressGame';
import { useProgress } from '../progress/ProgressContext';
import { currentStreak, streakStatusNow } from '../progress/progressStore';
import { useTodayKey } from '../settings/useTodayKey';
import { cardSkin, type, colors, fonts, radius, space } from '../theme';
import { statusBarTop } from '../components/statusBarTop';
import { useReducedMotion } from '../components/useReducedMotion';
import { useWideGrid } from '../components/useWideGrid';
import { useWideLayout } from '../components/useWideLayout';

type Props = {
  onOpenCourse: (course: OpeningCourse) => void;
  onStartLesson: (lesson: Lesson) => void;
};

// Pestaña Aperturas: selector Blancas / Negras y una tarjeta por curso (mapa-de-pantallas.md, 2.6).
export function OpeningsScreen({ onOpenCourse, onStartLesson }: Props) {
  const { progress } = useProgress();
  const { openings } = useContent();
  const { t } = useI18n();
  const { gridStyle, cardStyle } = useWideGrid();
  const [color, setColor] = useState<'w' | 'b'>('w');
  const list = openings.filter((o) => o.color === color);
  const [chosen, setChosen] = useState(0);
  const [railOpen, setRailOpen] = useState(false);
  const wide = useWideLayout();
  const focused = useIsFocused();
  const reduced = useReducedMotion();
  const [rail] = useState(() => new Animated.Value(0));
  const [boardFade] = useState(() => new Animated.Value(1));
  const [titleFade] = useState(() => new Animated.Value(1));
  const today = useTodayKey();
  const streak = currentStreak(progress, today);
  const status = streakStatusNow(progress, today);
  const active = list[Math.min(chosen, Math.max(0, list.length - 1))];

  useEffect(() => {
    if (!wide) return;
    Animated.timing(rail, {
      toValue: railOpen ? 1 : 0,
      duration: reduced ? 0 : 520,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start();
  }, [wide, railOpen, rail, reduced]);

  useEffect(() => {
    if (!wide || !active) return;
    boardFade.setValue(0);
    Animated.timing(boardFade, { toValue: 1, duration: reduced ? 0 : 160, useNativeDriver: true }).start();
    titleFade.setValue(0);
    Animated.timing(titleFade, { toValue: 1, duration: reduced ? 0 : 140, useNativeDriver: true }).start();
  }, [wide, active, boardFade, titleFade, reduced]);

  useEffect(() => {
    if (!wide || !focused || Platform.OS !== 'web' || !railOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setRailOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [wide, focused, railOpen]);

  if (wide && active) {
    const unitIndex = Math.min(chosen, list.length - 1);
    const states = lessonStates(active.lessons, progress);
    const doneCount = states.filter((s) => s === 'done').length;
    const game = openingGame(active);
    const position = progressPosition(game, doneCount, active.lessons.length);
    const legend =
      position.total === 0
        ? t('openings.progressSoon')
        : position.complete
          ? t('home.progressComplete')
          : t('home.progressMove', { n: position.played, total: position.total });
    const showHint = position.total > 0 && !position.complete;
    const suggestedForCourse = active.lessons.find((l) => !progress.lessons[l.id]) ?? active.lessons[0];
    const actionLabel =
      doneCount >= active.lessons.length
        ? t('home.review')
        : doneCount === 0
          ? t('common.start')
          : t('common.continue');
    const caption = t(color === 'w' ? 'openings.wheelWhite' : 'openings.wheelBlack');
    const wheelItems = list.map((course) => {
      const done = course.lessons.filter((l) => progress.lessons[l.id]).length;
      return {
        key: course.id,
        label: course.short,
        accessibilityLabel: t('openings.wheelLabel', {
          name: course.name,
          done,
          total: course.lessons.length,
        }),
      };
    });
    const leftStyle = {
      opacity: rail.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
      transform: [{ translateX: rail.interpolate({ inputRange: [0, 1], outputRange: [0, -140] }) }],
    };
    const boardStyle = {
      opacity: boardFade,
      transform: [{ translateX: rail.interpolate({ inputRange: [0, 1], outputRange: [0, -382] }) }],
    };
    const railStyle = {
      opacity: rail,
      transform: [{ translateX: rail.interpolate({ inputRange: [0, 1], outputRange: [400, 0] }) }],
    };

    return (
      <View style={styles.screen}>
        <View style={[styles.wideTop, { paddingTop: statusBarTop(space.md) }]}>
          <View style={styles.statsRow}>
            <View style={styles.stat} accessibilityLabel={t('home.streakLabel', { n: streak })}>
              <StreakFlame state={flameStateOf(status.kind)} size={18} />
              <Text style={[styles.statText, status.kind !== 'safe' && { color: colors.textMuted }]}>{streak}</Text>
            </View>
            <View style={styles.stat} accessibilityLabel={t('common.coinsLabel', { n: progress.coins })}>
              <StatIcon name="coin" />
              <Text style={styles.statText}>{progress.coins}</Text>
            </View>
          </View>
          {status.kind === 'recovering' && <RecoveryCard days={status.days} done={status.done} />}
        </View>

        <View style={styles.scene}>
          <View style={styles.sceneRow}>
            <Animated.View style={[styles.leftCol, leftStyle]} pointerEvents={railOpen ? 'none' : 'auto'}>
              <View style={styles.segWrap}>
                <Segmented
                  options={[
                    { value: 'w' as const, label: t('common.white') },
                    { value: 'b' as const, label: t('common.black') },
                  ]}
                  value={color}
                  onChange={(c) => {
                    setColor(c);
                    setChosen(0);
                    setRailOpen(false);
                  }}
                />
              </View>
              <View style={styles.head}>
                <Animated.View style={{ opacity: titleFade }}>
                  <Text style={styles.over}>{caption}</Text>
                  <Text style={styles.name} numberOfLines={2}>
                    {active.name}
                  </Text>
                </Animated.View>
              </View>
              <UnitWheel
                key={color}
                items={wheelItems}
                initialIndex={unitIndex}
                labels="short"
                previousLabel={t('openings.prevLabel')}
                nextLabel={t('openings.nextLabel')}
                enabled={focused && !railOpen}
                onActiveChange={(i) => setChosen(i)}
                onOpen={() => setRailOpen(true)}
              />
            </Animated.View>

            <View style={styles.boardArea}>
              <Animated.View style={[styles.boardCol, boardStyle]}>
                <View
                  accessible
                  accessibilityRole="image"
                  accessibilityLabel={t('home.progressBoardLabel', { legend })}
                >
                  <BoardSizeContext.Provider value={480}>
                    <Board
                      key={active.id}
                      fen={position.fen}
                      orientation={game.side}
                      lastMove={position.lastMove}
                      interactive={false}
                    />
                  </BoardSizeContext.Provider>
                </View>
                <View style={styles.legendRow}>
                  <Text style={styles.legendStrong}>{legend}</Text>
                  {showHint && <Text style={styles.legendHint}>{t('home.progressHint')}</Text>}
                </View>
              </Animated.View>
            </View>
          </View>

          <Animated.View style={[styles.railWrap, railStyle]} pointerEvents={railOpen ? 'auto' : 'none'}>
            <LessonRail
              caption={caption}
              title={active.name}
              lessons={active.lessons}
              states={states}
              onStartLesson={onStartLesson}
              onBack={() => setRailOpen(false)}
              backLabel={t('home.back')}
              actionLabel={actionLabel}
              onAction={() => onStartLesson(suggestedForCourse)}
              secondaryLabel={t('openings.viewCourse')}
              onSecondary={() => onOpenCourse(active)}
            />
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <ColumnScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: statusBarTop(space.md) }]}
    >
      <Text style={styles.title}>{t('openings.title')}</Text>
      <Text style={styles.subtitle}>{t('openings.subtitle')}</Text>

      <View style={styles.segmented}>
        {(['w', 'b'] as const).map((c) => {
          const selected = c === color;
          return (
            <Pressable
              key={c}
              onPress={() => {
                setColor(c);
                setChosen(0);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={t(c === 'w' ? 'openings.tabWhite' : 'openings.tabBlack')}
              style={[styles.segment, selected && styles.segmentSelected]}
            >
              <Text style={[styles.segmentText, selected && { color: colors.text }]}>
                {t(c === 'w' ? 'common.white' : 'common.black')} · {openings.filter((o) => o.color === c).length}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={gridStyle}>
        {list.map((course) => {
          const done = course.lessons.filter((l) => progress.lessons[l.id]).length;
          return (
            <Pressable
              key={course.id}
              onPress={() => onOpenCourse(course)}
              accessibilityRole="button"
              accessibilityLabel={t('openings.cardLabel', { name: course.name, done, total: course.lessons.length })}
              style={({ pressed }) => [
                styles.card,
                cardStyle,
                pressed && { transform: [{ translateY: 2 }], borderBottomWidth: 2 },
              ]}
            >
              <Text style={styles.cardTitle}>{course.name}</Text>
              <Text style={styles.cardSummary} numberOfLines={2}>
                {course.summary}
              </Text>
              <View style={styles.progressRow}>
                <ProgressBar value={done / course.lessons.length} />
                <Text style={styles.count}>
                  {done}/{course.lessons.length}
                </Text>
              </View>
              <View style={styles.chips}>
                {course.botStyles.map((s) => (
                  <Chip key={s} label={t('openings.botChip', { style: t(`botStyle.${s as BotStyle}`) })} />
                ))}
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.guide}>
        <Text style={styles.guideTitle}>{t('openings.guide.title')}</Text>
        <Text style={styles.guideText}>{t('openings.guide.text')}</Text>
      </View>
    </ColumnScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  title: { fontFamily: fonts.extrabold, fontSize: type.title, color: colors.text },
  subtitle: { fontFamily: fonts.bold, fontSize: type.secondary, color: colors.textMuted, marginTop: 2 },
  segmented: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: space.lg,
    marginBottom: space.lg,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    backgroundColor: colors.surface,
  },
  segmentSelected: { borderColor: colors.primary, backgroundColor: colors.surfaceRaised },
  segmentText: { fontFamily: fonts.extrabold, fontSize: type.secondary, color: colors.textMuted },
  card: {
    ...cardSkin,
    borderRadius: radius.control,
    borderWidth: 2,
    paddingVertical: space.md,
    paddingHorizontal: 14,
    marginBottom: space.sm,
  },
  cardTitle: { fontFamily: fonts.extrabold, fontSize: type.body, color: colors.text },
  cardSummary: { fontFamily: fonts.semibold, fontSize: type.secondary, color: colors.textMuted, marginTop: 2, lineHeight: 18 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.md },
  count: { fontFamily: fonts.extrabold, fontSize: type.secondary, color: colors.textMuted },
  guide: {
    marginTop: space.lg,
    padding: space.md,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    backgroundColor: colors.surface,
  },
  guideTitle: { fontFamily: fonts.extrabold, fontSize: type.body, color: colors.text },
  guideText: { fontFamily: fonts.semibold, fontSize: type.secondary, color: colors.textMuted, marginTop: space.xs, lineHeight: 19 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginTop: space.sm },
  wideTop: { paddingHorizontal: space.lg, gap: space.sm },
  statsRow: { flexDirection: 'row', gap: space.lg },
  stat: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  statText: { fontFamily: fonts.extrabold, fontSize: type.body, color: colors.gold },
  scene: { flex: 1, position: 'relative', overflow: 'hidden', justifyContent: 'center' },
  sceneRow: { flexDirection: 'row', alignItems: 'flex-start' },
  leftCol: { width: WHEEL_WIDTH },
  segWrap: { width: 300, height: 56, justifyContent: 'center', paddingLeft: space.xl },
  head: { width: 300, height: 104, justifyContent: 'flex-end', paddingLeft: space.xl, marginBottom: space.lg },
  over: {
    fontFamily: fonts.extrabold,
    fontSize: type.caption,
    color: colors.primary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  name: { fontFamily: fonts.extrabold, fontSize: type.title, color: colors.text, lineHeight: type.title + 4 },
  boardCol: { width: 480, marginTop: 174 },
  boardArea: { flex: 1, alignItems: 'center' },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: space.lg },
  legendStrong: { fontFamily: fonts.extrabold, fontSize: type.secondary, color: colors.gold },
  legendHint: { fontFamily: fonts.bold, fontSize: type.secondary, color: colors.textMuted },
  railWrap: { position: 'absolute', top: 0, right: 0, bottom: 0, width: 400, zIndex: 2 },
});
