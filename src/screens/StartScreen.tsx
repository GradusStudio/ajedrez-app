import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BotAvatar } from '../components/BotAvatar';
import { Button3D } from '../components/Button3D';
import { ColumnScrollView } from '../components/ColumnScrollView';
import { MiniBoard } from '../components/MiniBoard';
import { StatIcon } from '../components/StatIcon';
import { StreakFlame, flameStateOf } from '../components/StreakFlame';
import { Tip } from '../components/Tip';
import { statusBarTop } from '../components/statusBarTop';
import { useWideLayout } from '../components/useWideLayout';
import { Bot } from '../data/bots';
import { Lesson, OpeningCourse } from '../data/lessonTypes';
import progressGamesRaw from '../data/progressGames.json';
import { teacherForLesson } from '../data/teachers';
import { useContent } from '../data/useContent';
import { useI18n } from '../i18n/I18nContext';
import { lessonStates, suggestedLesson, unitOpen } from '../progress/path';
import { piecesFromFen, progressPosition, type ProgressGamesFile } from '../progress/progressGame';
import { useProgress } from '../progress/ProgressContext';
import { currentStreak, streakStatusNow } from '../progress/progressStore';
import { weekSteps } from '../progress/streak';
import { useTodayKey } from '../settings/useTodayKey';
import { useSettings } from '../settings/SettingsContext';
import { TIP_MESSAGES, type TipId } from '../settings/tips';
import { useTips } from '../settings/useTips';
import { Puzzle, puzzleGoal } from '../puzzles/puzzles';
import { isOfflineError, usePuzzleSource } from '../puzzles/usePuzzles';
import { type, colors, fonts, space } from '../theme';

const progressGames = (progressGamesRaw as unknown as ProgressGamesFile).units;

type Props = {
  onLesson: (lesson: Lesson) => void;
  onDaily: (id: string) => void;
  onContinueGame: () => void;
  onBot: (bot: Bot) => void;
  onCourse: (course: OpeningCourse) => void;
};

/**
 * Pestaña Inicio (feedback del primer tester, 14-11-2026): saludo con el profesor, seguir aprendiendo
 * con el tablero de progreso, puzzle del día, racha, bots y aperturas.
 */
export function StartScreen({ onLesson, onDaily, onContinueGame, onBot, onCourse }: Props) {
  const { progress } = useProgress();
  const { settings } = useSettings();
  const { units, bots, openings } = useContent();
  const { t, number, tn } = useI18n();
  const wide = useWideLayout();
  const today = useTodayKey();
  const heroRef = useRef<React.ComponentRef<typeof View>>(null);
  const statsRef = useRef<React.ComponentRef<typeof View>>(null);
  const tipIds: TipId[] = ['home.next', 'home.streak'];
  if (progress.coins > 0) tipIds.push('coins.first');
  const tips = useTips(tipIds);
  const tipMessage = tips.current ? TIP_MESSAGES[tips.current] : null;

  const streak = currentStreak(progress, today);
  const status = streakStatusNow(progress, today);
  const openUnits = unitOpen(units, progress, progress.profile.level, settings.openAllUnits);
  const lesson = suggestedLesson(units.filter((u) => openUnits.includes(u.unit)), progress);
  const unit = lesson ? units.find((u) => u.lessons.some((l) => l.id === lesson.id)) : undefined;
  const firstTime = Object.keys(progress.lessons).length === 0;
  const teacher = teacherForLesson(lesson?.id ?? units[0]?.lessons[0]?.id ?? '');
  const previous = lesson && unit ? unit.lessons[unit.lessons.findIndex((l) => l.id === lesson.id) - 1] : undefined;
  const phrase = lesson
    ? firstTime
      ? t('start.firstLesson', { title: lesson.title })
      : previous
        ? t('start.afterLesson', { last: previous.title, next: lesson.title })
        : t('start.nextLesson', { title: lesson.title })
    : t('start.allDone');

  // Tablero de progreso de la unidad de la lección sugerida (las mismas piezas que usa Aprender).
  const states = unit ? lessonStates(unit.lessons, progress) : [];
  const doneLessons = states.filter((s) => s === 'done').length;
  const game = unit ? progressGames[String(unit.unit)] ?? { moves: [], side: 'w' as const } : null;
  const position = unit && game ? progressPosition(game, doneLessons, unit.lessons.length) : null;
  const legend = position
    ? position.total === 0
      ? t('home.progressStart')
      : position.complete
        ? t('home.progressComplete')
        : t('home.progressMove', { n: position.played, total: position.total })
    : '';

  // Bot recomendado según el nivel elegido en la bienvenida (los bots vienen de menor a mayor Elo).
  const level = progress.profile.level ?? 'nuevo';
  const ongoingBot = progress.ongoingGame ? bots.find((b) => b.id === progress.ongoingGame?.botId) : undefined;
  const recommendedIndex = level === 'nuevo' ? 0 : level === 'basico' ? 2 : 4;
  const recommendedBot = bots[Math.min(recommendedIndex, Math.max(0, bots.length - 1))] ?? bots[0];

  // Curso empezado más recientemente; si no hay ninguno, uno recomendado según el nivel.
  const startedCourse = openings
    .map((course) => {
      let last = '';
      for (const l of course.lessons) {
        const p = progress.lessons[l.id];
        if (p && p.completedAt > last) last = p.completedAt;
      }
      return { course, last };
    })
    .filter((x) => x.last)
    .sort((a, b) => b.last.localeCompare(a.last))[0]?.course;
  const recommendedCourseId = level === 'nuevo' ? 'italian' : level === 'basico' ? 'london' : 'scotch';
  const recommendedCourse = openings.find((o) => o.id === recommendedCourseId) ?? openings[0];
  const course = startedCourse ?? recommendedCourse;
  const courseDone = course ? course.lessons.filter((l) => progress.lessons[l.id]).length : 0;
  const nextCourseLesson = course?.lessons.find((l) => !progress.lessons[l.id]);
  const courseLine = course
    ? nextCourseLesson
      ? t('start.courseProgress', { done: courseDone, total: course.lessons.length, next: nextCourseLesson.title })
      : t('start.courseComplete', { done: courseDone, total: course.lessons.length })
    : '';

  const todayIndex = (new Date(`${today}T12:00:00`).getDay() + 6) % 7;
  const steps = weekSteps(streak, todayIndex, status.kind === 'safe');
  const streakText =
    status.kind === 'safe'
      ? t('start.streakSafe')
      : status.kind === 'active'
        ? t('start.streakActive')
        : status.kind === 'recovering'
          ? t('start.streakRecovering')
          : t('start.streakNone');

  const stats = (
    <View ref={statsRef} style={[styles.stats, wide ? styles.statsWide : styles.statsNarrow]}>
      <View style={styles.pill} accessible accessibilityLabel={t('home.streakLabel', { n: streak })}>
        <StreakFlame state={flameStateOf(status.kind)} size={20} pulse={false} />
        <Text style={styles.pillText}>{number(streak)}</Text>
      </View>
      <View style={styles.pill} accessible accessibilityLabel={t('common.coinsLabel', { n: progress.coins })}>
        <StatIcon name="coin" size={20} />
        <Text style={styles.pillText}>{number(progress.coins)}</Text>
      </View>
    </View>
  );

  const heroCard = (
    <View ref={heroRef} style={styles.card}>
      <Text style={styles.k}>{t('start.continue')}</Text>
      {lesson && unit && position ? (
        <View style={[styles.heroRow, !wide && styles.heroColumn]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{lesson.title}</Text>
            <Text style={styles.sub}>
              {t('start.lessonLine', { unit: unit.unit, title: unit.title, n: lesson.order, total: unit.lessons.length })}
            </Text>
            <Button3D
              label={t('common.continue')}
              variant="primary"
              onPress={() => onLesson(lesson)}
              style={{ marginTop: space.md, alignSelf: 'flex-start' }}
            />
          </View>
          <View style={styles.boardWrap}>
            <MiniBoard
              size={wide ? 168 : 120}
              corner="a1"
              span={8}
              pieces={piecesFromFen(position.fen)}
              lastMove={position.lastMove}
            />
            <Text style={styles.boardLegend}>{legend}</Text>
          </View>
        </View>
      ) : (
        <Text style={styles.sub}>{t('start.allDone')}</Text>
      )}
    </View>
  );

  const streakCard = (
    <View style={styles.card}>
      <Text style={styles.k}>{t('start.streak')}</Text>
      <View style={styles.streakTop}>
        <StreakFlame state={flameStateOf(status.kind)} size={wide ? 36 : 28} />
        <Text style={styles.streakNumber}>{tn('start.streakDays', streak)}</Text>
      </View>
      <Text style={styles.sub}>{streakText}</Text>
      <View style={styles.week}>
        {steps.map((on, i) => (
          <View
            key={i}
            style={[
              styles.step,
              { height: 12 + i * 5, width: wide ? 22 : 16 },
              on && styles.stepOn,
              i === todayIndex && styles.stepToday,
            ]}
          />
        ))}
      </View>
    </View>
  );

  const botsCard = (
    <View style={styles.card}>
      <Text style={styles.k}>{t('tabs.bots')}</Text>
      <View style={styles.botRow}>
        <BotAvatar bot={ongoingBot ?? recommendedBot} size={wide ? 64 : 52} expression="acierto" />
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitleSmall}>
            {ongoingBot ? t('start.botResume', { name: ongoingBot.name }) : recommendedBot.name}
          </Text>
          <Text style={styles.sub}>
            {ongoingBot && progress.ongoingGame
              ? t('start.botMove', { n: progress.ongoingGame.moves.length })
              : recommendedBot.tagline}
          </Text>
          <Button3D
            label={ongoingBot ? t('common.continue') : t('common.play')}
            variant={ongoingBot ? 'primary' : 'secondary'}
            onPress={() => (ongoingBot ? onContinueGame() : onBot(recommendedBot))}
            style={{ marginTop: space.sm, alignSelf: 'flex-start' }}
          />
        </View>
      </View>
    </View>
  );

  const openingsCard = course ? (
    <View style={styles.card}>
      <Text style={styles.k}>{t('tabs.openings')}</Text>
      <Text style={styles.cardTitleSmall}>{course.name}</Text>
      <Text style={styles.sub}>{courseLine}</Text>
      <Button3D
        label={startedCourse ? t('start.courseButton') : t('start.courseStart')}
        variant="secondary"
        onPress={() => onCourse(course)}
        style={{ marginTop: space.md, alignSelf: 'flex-start' }}
      />
    </View>
  ) : null;

  return (
    <ColumnScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: statusBarTop(space.md) }]}
    >
      <View style={styles.hello}>
        <BotAvatar bot={teacher} size={wide ? 104 : 72} expression="acierto" />
        <View style={styles.helloTextWrap}>
          <Text style={[styles.helloTitle, wide && styles.helloTitleWide]}>
            {firstTime ? t('start.greetingNew') : t('start.greeting')}
          </Text>
          <Text style={styles.helloText}>{t('start.says', { name: teacher.name, text: phrase })}</Text>
        </View>
        {stats}
      </View>

      {wide ? (
        <View style={styles.grid}>
          <View style={styles.colLeft}>
            {heroCard}
            {botsCard}
          </View>
          <View style={styles.colRight}>
            <DailyPuzzleCard wide={wide} onOpen={onDaily} />
            {streakCard}
            {openingsCard}
          </View>
        </View>
      ) : (
        <>
          {heroCard}
          <DailyPuzzleCard wide={wide} onOpen={onDaily} />
          {streakCard}
          {botsCard}
          {openingsCard}
        </>
      )}

      <Tip
        visible={!!tips.current}
        title={tipMessage ? t(tipMessage.title) : ''}
        text={tipMessage ? t(tipMessage.text) : ''}
        step={tips.step}
        total={tips.total}
        target={tips.current === 'home.next' ? heroRef : statsRef}
        onNext={tips.next}
        onClose={tips.close}
      />
    </ColumnScrollView>
  );
}

type Daily = { status: 'loading' } | { status: 'error'; offline: boolean } | { status: 'ready'; puzzle: Puzzle };

/** Puzzle del día en una tarjeta, con su tablero y el estado de resuelto. */
function DailyPuzzleCard({ wide, onOpen }: { wide: boolean; onOpen: (id: string) => void }) {
  const sourceState = usePuzzleSource();
  const source = sourceState.status === 'ready' ? sourceState.source : null;
  const { progress } = useProgress();
  const { t } = useI18n();
  const [daily, setDaily] = useState<Daily>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!source) return;
    let cancelled = false;
    source.daily().then(
      (puzzle) => !cancelled && setDaily({ status: 'ready', puzzle }),
      (e) => !cancelled && setDaily({ status: 'error', offline: isOfflineError(e) })
    );
    return () => {
      cancelled = true;
    };
  }, [source, attempt]);

  let body: React.ReactNode;
  if (!source) {
    body =
      sourceState.status === 'loading' ? (
        <Text style={styles.sub}>{t('puzzles.loading')}</Text>
      ) : sourceState.status === 'error' ? (
        <>
          <Text style={styles.sub}>{sourceState.offline ? t('puzzles.offline') : t('puzzles.loadError')}</Text>
          <Button3D
            label={t('common.retry')}
            variant="secondary"
            onPress={sourceState.retry}
            style={{ marginTop: space.md, alignSelf: 'flex-start' }}
          />
        </>
      ) : null;
  } else if (daily.status === 'loading') {
    body = <Text style={styles.sub}>{t('puzzles.loading')}</Text>;
  } else if (daily.status === 'error') {
    body = (
      <>
        <Text style={styles.sub}>{daily.offline ? t('puzzles.offline') : t('puzzles.loadError')}</Text>
        <Button3D
          label={t('common.retry')}
          variant="secondary"
          onPress={() => {
            setDaily({ status: 'loading' });
            setAttempt((n) => n + 1);
          }}
          style={{ marginTop: space.md, alignSelf: 'flex-start' }}
        />
      </>
    );
  } else {
    const done = progress.puzzles[daily.puzzle.id];
    body = (
      <View style={styles.puzzleRow}>
        <MiniBoard size={wide ? 150 : 120} corner="a1" span={8} pieces={piecesFromFen(daily.puzzle.fen)} />
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitleSmall}>{puzzleGoal(daily.puzzle, t)}</Text>
          <Text style={styles.sub}>
            {done
              ? t(done.result === 'failed' ? 'puzzles.dailyFailed' : 'puzzles.dailySolved', { n: daily.puzzle.rating })
              : t('common.level', { n: daily.puzzle.rating })}
          </Text>
          <Button3D
            label={done ? t('puzzles.seeAgain') : t('puzzles.solve')}
            variant={done ? 'secondary' : 'primary'}
            onPress={() => onOpen(daily.puzzle.id)}
            style={{ marginTop: space.md, alignSelf: 'flex-start' }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.k}>{t('puzzles.daily')}</Text>
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  hello: { flexDirection: 'row', alignItems: 'center', gap: space.lg, flexWrap: 'wrap', marginBottom: space.xl },
  helloTextWrap: { flex: 1, minWidth: 200 },
  helloTitle: { fontFamily: fonts.extrabold, fontSize: 26, lineHeight: 30, color: colors.text },
  helloTitleWide: { fontSize: 32, lineHeight: 36 },
  helloText: { fontFamily: fonts.bold, fontSize: type.body, color: colors.textMuted, marginTop: 4, maxWidth: 620 },
  stats: { flexDirection: 'row', gap: space.sm },
  statsWide: { marginLeft: 'auto', alignSelf: 'flex-start' },
  statsNarrow: { marginTop: space.xs },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  pillText: { fontFamily: fonts.extrabold, fontSize: type.body, color: colors.text },
  grid: { flexDirection: 'row', alignItems: 'flex-start', gap: space.lg },
  colLeft: { flex: 1.35, gap: space.lg },
  colRight: { flex: 1, gap: space.lg },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    borderRadius: 20,
    padding: space.lg,
  },
  k: {
    fontFamily: fonts.extrabold,
    fontSize: type.caption,
    color: colors.primary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  cardTitle: { fontFamily: fonts.extrabold, fontSize: 24, lineHeight: 30, color: colors.text, marginTop: 4 },
  cardTitleSmall: { fontFamily: fonts.extrabold, fontSize: 20, lineHeight: 26, color: colors.text, marginTop: 4 },
  sub: { fontFamily: fonts.bold, fontSize: type.secondary, color: colors.textMuted, marginTop: 2 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: space.lg, marginTop: space.md },
  heroColumn: { flexDirection: 'column', alignItems: 'flex-start' },
  boardWrap: { alignItems: 'center', gap: 6 },
  boardLegend: { fontFamily: fonts.semibold, fontSize: type.caption, color: colors.textMuted, textAlign: 'center' },
  puzzleRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.md },
  streakTop: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.xs },
  streakNumber: { fontFamily: fonts.extrabold, fontSize: 28, color: colors.text },
  week: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: space.lg },
  step: { borderRadius: 5, backgroundColor: colors.surfaceRaised },
  stepOn: { backgroundColor: colors.flame },
  stepToday: { borderWidth: 2, borderColor: colors.gold },
  botRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.md },
});
