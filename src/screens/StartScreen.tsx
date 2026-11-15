import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Board } from '../components/Board';
import { BoardSizeContext } from '../components/BoardSizeContext';
import { BotAvatar } from '../components/BotAvatar';
import { Button3D } from '../components/Button3D';
import { CardSurface } from '../components/CardSurface';
import { ColumnScrollView } from '../components/ColumnScrollView';
import { MiniBoard } from '../components/MiniBoard';
import { StatIcon } from '../components/StatIcon';
import { StreakFlame, flameStateOf } from '../components/StreakFlame';
import { TabIcon } from '../components/TabIcon';
import { Tip } from '../components/Tip';
import { getTabBarTarget } from '../components/tabBarTarget';
import { statusBarTop } from '../components/statusBarTop';
import { useWideLayout } from '../components/useWideLayout';
import { Bot } from '../data/bots';
import { Lesson, OpeningCourse } from '../data/lessonTypes';
import progressGamesRaw from '../data/progressGames.json';
import { teacherForLesson } from '../data/teachers';
import { useContent } from '../data/useContent';
import { useI18n } from '../i18n/I18nContext';
import { lessonNumberInUnit, lessonStates, suggestedLesson, unitOpen } from '../progress/path';
import { piecesFromFen, progressPosition, type ProgressGamesFile } from '../progress/progressGame';
import { useProgress } from '../progress/ProgressContext';
import { currentStreak, streakStatusNow } from '../progress/progressStore';
import { weekSteps } from '../progress/streak';
import { useTodayKey } from '../settings/useTodayKey';
import { useSettings } from '../settings/SettingsContext';
import { TIP_MESSAGES, type TipId } from '../settings/tips';
import { useTips } from '../settings/useTips';
import { firstSteps, firstStepsDone, type FirstStepId } from '../start/firstSteps';
import { canAffordSomethingNew, type ShopContext } from '../pieces/shopView';
import { SAMPLE_FEN } from '../pieces/sampleFen';
import { useBoardTheme } from '../settings/useBoardTheme';
import { PieceSetOverride, usePieceSet } from '../settings/PieceSetContext';
import type { MessageKey } from '../i18n/es';
import { Puzzle, puzzleGoal } from '../puzzles/puzzles';
import { isOfflineError, usePuzzleSource } from '../puzzles/usePuzzles';
import { type, colors, fonts, space } from '../theme';

const progressGames = (progressGamesRaw as unknown as ProgressGamesFile).units;

/** Textos de cada paso de «Tus primeros pasos». */
const FS_TEXT: Record<FirstStepId, { title: MessageKey; text: MessageKey }> = {
  lesson: { title: 'start.firstSteps.lesson.title', text: 'start.firstSteps.lesson.text' },
  puzzle: { title: 'start.firstSteps.puzzle.title', text: 'start.firstSteps.puzzle.text' },
  game: { title: 'start.firstSteps.game.title', text: 'start.firstSteps.game.text' },
};

const FS_STATE: Record<'done' | 'next' | 'later', MessageKey> = {
  done: 'start.firstSteps.done',
  next: 'start.firstSteps.next',
  later: 'start.firstSteps.later',
};

type Props = {
  onLesson: (lesson: Lesson) => void;
  onDaily: (id: string) => void;
  /** Primer puzzle Fácil de los primeros pasos (no el del día, que puede ser difícil). */
  onFirstPuzzle: () => void;
  onContinueGame: () => void;
  onBot: (bot: Bot) => void;
  onCourse: (course: OpeningCourse) => void;
  /** Abre la tienda desde la tarjeta «Tu tablero». */
  onShop: () => void;
};

/**
 * Pestaña Inicio (feedback del primer tester, 14-11-2026): saludo con el profesor, seguir aprendiendo
 * con el tablero de progreso, puzzle del día, racha, bots y aperturas.
 */
export function StartScreen({ onLesson, onDaily, onFirstPuzzle, onContinueGame, onBot, onCourse, onShop }: Props) {
  const { progress } = useProgress();
  const { settings, update } = useSettings();
  const { pieceSet } = usePieceSet();
  const boardTheme = useBoardTheme();
  const { units, bots, openings } = useContent();
  const { t, number, tn } = useI18n();
  const wide = useWideLayout();
  const today = useTodayKey();
  const heroRef = useRef<React.ComponentRef<typeof View>>(null);
  const statsRef = useRef<React.ComponentRef<typeof View>>(null);
  const tipIds: TipId[] = ['home.tabs', 'home.next', 'home.streak'];
  if (progress.coins > 0) tipIds.push('coins.first');
  const tips = useTips(tipIds);
  const tipMessage = tips.current ? TIP_MESSAGES[tips.current] : null;
  const firstTime = Object.keys(progress.lessons).length === 0;
  const newAccount = firstTime && Object.keys(progress.drafts).length === 0;
  // Una cuenta nueva no vio nada todavía: el consejo de Inicio habla del comienzo, no de «seguir».
  const tipText = tips.current === 'home.next' && newAccount ? 'tips.home.next.textNew' : tipMessage?.text;

  // Primeros pasos de la cuenta nueva (spec del feedback del tester, sección 2): se leen del progreso.
  const fsSteps = firstSteps(progress);
  const fsDone = firstStepsDone(fsSteps);
  const celebrateFirstSteps = fsDone && !settings.firstStepsCelebrated;
  const showFirstSteps = !fsDone || celebrateFirstSteps;
  const stepsRef = useRef<React.ComponentRef<typeof View>>(null);

  const streak = currentStreak(progress, today);
  const status = streakStatusNow(progress, today);
  const openUnits = unitOpen(units, progress, progress.profile.level, settings.openAllUnits);
  const lesson = suggestedLesson(units.filter((u) => openUnits.includes(u.unit)), progress);
  // El primer paso abre siempre la primera lección de la ruta.
  const firstLesson = units.flatMap((u) => u.lessons).find((l) => l.id === 'u1-l01') ?? lesson;
  const unit = lesson ? units.find((u) => u.lessons.some((l) => l.id === lesson.id)) : undefined;
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
  // Pipo guía los primeros pasos y es el rival de la primera partida.
  const pipo = bots.find((b) => b.id === 'pipo') ?? recommendedBot;
  const greeter = showFirstSteps ? pipo : teacher;

  const runFirstStep = (id: FirstStepId) => {
    if (id === 'lesson') {
      if (firstLesson) onLesson(firstLesson);
    } else if (id === 'puzzle') {
      onFirstPuzzle();
    } else {
      onBot(pipo);
    }
  };

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
    <CardSurface ref={heroRef} style={styles.card} radius={20}>
      <Text accessibilityRole="header" aria-level={2} style={styles.k}>{t('start.continue')}</Text>
      {lesson && unit && position ? (
        <View style={[styles.heroRow, !wide && styles.heroColumn]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{lesson.title}</Text>
            <Text style={styles.sub}>
              {t('start.lessonLine', { unit: unit.unit, title: unit.title, n: lessonNumberInUnit(unit.lessons, lesson.id), total: unit.lessons.length })}
            </Text>
            <Button3D
              label={progress.drafts[lesson.id] ? t('common.continue') : t('common.start')}
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
    </CardSurface>
  );

  const streakCard = (
    <CardSurface style={styles.card} radius={20}>
      <Text accessibilityRole="header" aria-level={2} style={styles.k}>{t('start.streak')}</Text>
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
    </CardSurface>
  );

  const botsCard = (
    <CardSurface style={styles.card} radius={20}>
      <Text accessibilityRole="header" aria-level={2} style={styles.k}>{t('tabs.bots')}</Text>
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
            variant="secondary"
            onPress={() => (ongoingBot ? onContinueGame() : onBot(recommendedBot))}
            style={{ marginTop: space.sm, alignSelf: 'flex-start' }}
          />
        </View>
      </View>
    </CardSurface>
  );

  const openingsCard = course ? (
    <CardSurface style={styles.card} radius={20}>
      <Text accessibilityRole="header" aria-level={2} style={styles.k}>{t('tabs.openings')}</Text>
      <Text style={styles.cardTitleSmall}>{course.name}</Text>
      <Text style={styles.sub}>{courseLine}</Text>
      <Button3D
        label={startedCourse ? t('start.courseButton') : t('start.courseStart')}
        variant="secondary"
        onPress={() => onCourse(course)}
        style={{ marginTop: space.md, alignSelf: 'flex-start' }}
      />
    </CardSurface>
  ) : null;

  // Tarjeta de los tres primeros pasos: uno solo tiene el botón verde, el que toca hacer.
  const firstStepsCard = (
    <CardSurface ref={stepsRef} style={styles.card} radius={20}>
      <Text accessibilityRole="header" aria-level={2} style={styles.k}>
        {celebrateFirstSteps ? t('start.firstSteps.celebrate.title') : t('start.firstSteps.title')}
      </Text>
      {celebrateFirstSteps ? (
        <>
          <Text style={[styles.sub, { marginTop: space.sm }]}>{t('start.firstSteps.celebrate.text')}</Text>
          <Button3D
            label={t('start.firstSteps.celebrate.ok')}
            variant="primary"
            onPress={() => update({ firstStepsCelebrated: true })}
            style={{ marginTop: space.md, alignSelf: 'flex-start' }}
          />
        </>
      ) : (
        <View style={[styles.fsRow, !wide && styles.fsColumn]}>
          {fsSteps.map((s) => (
            <View key={s.id} style={styles.fsStep}>
              <View style={styles.fsHead}>
                <View style={[styles.fsBadge, s.state === 'done' && styles.fsBadgeDone, s.state === 'next' && styles.fsBadgeNext]}>
                  {s.state === 'done' ? (
                    <Text style={[styles.fsCheck, { color: colors.bg }]}>✓</Text>
                  ) : (
                    <TabIcon
                      name={s.id === 'lesson' ? 'learn' : s.id === 'puzzle' ? 'puzzles' : 'bots'}
                      color={s.state === 'next' ? colors.bg : colors.textMuted}
                      size={16}
                    />
                  )}
                </View>
                <Text style={[styles.fsState, s.state === 'next' && styles.fsStateNext]}>{t(FS_STATE[s.state])}</Text>
              </View>
              <Text style={styles.fsTitle}>{t(FS_TEXT[s.id].title)}</Text>
              <Text style={styles.sub}>{t(FS_TEXT[s.id].text)}</Text>
              {s.state === 'next' && (
                <Button3D
                  label={t('common.start')}
                  variant="primary"
                  onPress={() => runFirstStep(s.id)}
                  style={{ marginTop: space.md, alignSelf: 'flex-start' }}
                />
              )}
            </View>
          ))}
        </View>
      )}
    </CardSurface>
  );

  const firstStepsStreak = (
    <CardSurface style={styles.card} radius={20}>
      <View style={styles.streakTop}>
        <StreakFlame state={flameStateOf(status.kind)} size={24} />
        <Text style={styles.streakNumber}>{tn('start.streakDays', streak)}</Text>
      </View>
      <Text style={styles.sub}>{streakText}</Text>
    </CardSurface>
  );

  const exploreCard = (
    <CardSurface style={styles.card} radius={20}>
      <Text accessibilityRole="header" aria-level={2} style={styles.k}>{t('start.explore.title')}</Text>
      {[
        { name: t('tabs.openings'), text: t('start.explore.openings') },
        { name: t('tabs.bots'), text: t('start.explore.bots') },
        { name: t('tabs.analysis'), text: t('start.explore.analysis') },
      ].map((row) => (
        <View key={row.name} style={styles.exploreRow}>
          <Text style={styles.exploreName}>{row.name}</Text>
          <Text style={styles.sub}>{row.text}</Text>
        </View>
      ))}
    </CardSurface>
  );

  // Tarjeta «Tu tablero» (spec de la tienda y la barra, sección 2): la combinación en uso y el acceso a la tienda.
  const comboName = `${t(`boardTheme.${boardTheme}` as MessageKey)} · ${t(`pieceSet.${pieceSet}.name` as MessageKey)}`;
  const shopCtx: ShopContext = {
    coins: progress.coins,
    boughtBoards: progress.boardThemes,
    boughtSets: progress.pieceSets,
    boardInUse: boardTheme,
    setInUse: pieceSet,
  };
  const affordable = canAffordSomethingNew(shopCtx);
  // En la cuenta nueva aparece recién después de completar los primeros pasos.
  const boardCard = !showFirstSteps ? (
    <CardSurface style={styles.card} radius={20}>
      <Text accessibilityRole="header" aria-level={2} style={styles.k}>{t('start.board.title')}</Text>
      <View style={[styles.boardRow, !wide && styles.boardRowNarrow]}>
        <BoardSizeContext.Provider value={150}>
          <PieceSetOverride id={pieceSet}>
            <Board fen={SAMPLE_FEN} orientation="w" interactive={false} themeOverride={boardTheme} />
          </PieceSetOverride>
        </BoardSizeContext.Provider>
        <View style={styles.boardInfo}>
          {affordable && <Text style={styles.afford}>{t('start.board.afford')}</Text>}
          <Text style={styles.cardTitleSmall}>{comboName}</Text>
          <Text style={styles.sub}>{t('start.board.text')}</Text>
          <Button3D
            label={t('start.board.cta')}
            variant="secondary"
            onPress={onShop}
            style={{ marginTop: space.md, alignSelf: 'flex-start' }}
          />
        </View>
      </View>
    </CardSurface>
  ) : null;

  return (
    <ColumnScrollView
      role="main"
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: statusBarTop(space.md) }]}
    >
      <View style={styles.hello}>
        <BotAvatar bot={greeter} size={wide ? 104 : 72} expression="acierto" />
        <View style={styles.helloTextWrap}>
          <Text accessibilityRole="header" aria-level={1} style={[styles.helloTitle, wide && styles.helloTitleWide]}>
            {firstTime ? t('start.greetingNew') : t('start.greeting')}
          </Text>
          <Text style={styles.helloText}>
            {showFirstSteps ? t('start.firstSteps.hello') : t('start.says', { name: teacher.name, text: phrase })}
          </Text>
        </View>
        {stats}
      </View>

      {showFirstSteps ? (
        <>
          {firstStepsCard}
          {firstStepsStreak}
          {exploreCard}
        </>
      ) : wide ? (
        <View style={styles.grid}>
          <View style={styles.colLeft}>
            {heroCard}
            {botsCard}
          </View>
          <View style={styles.colRight}>
            <DailyPuzzleCard wide={wide} onOpen={onDaily} />
            {streakCard}
            {openingsCard}
            {boardCard}
          </View>
        </View>
      ) : (
        <>
          {heroCard}
          <DailyPuzzleCard wide={wide} onOpen={onDaily} />
          {streakCard}
          {botsCard}
          {openingsCard}
          {boardCard}
        </>
      )}

      <Tip
        visible={!!tips.current}
        title={tipMessage ? t(tipMessage.title) : ''}
        text={tipText ? t(tipText) : ''}
        step={tips.step}
        total={tips.total}
        target={
          tips.current === 'home.tabs'
            ? getTabBarTarget()
            : tips.current === 'home.next'
              ? showFirstSteps
                ? stepsRef
                : heroRef
              : statsRef
        }
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
            variant="secondary"
            onPress={() => onOpen(daily.puzzle.id)}
            style={{ marginTop: space.md, alignSelf: 'flex-start' }}
          />
        </View>
      </View>
    );
  }

  return (
    <CardSurface style={styles.card} radius={20}>
      <Text accessibilityRole="header" aria-level={2} style={styles.k}>{t('puzzles.daily')}</Text>
      {body}
    </CardSurface>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
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

  // Primeros pasos de la cuenta nueva
  fsRow: { flexDirection: 'row', gap: space.lg, marginTop: space.md },
  fsColumn: { flexDirection: 'column' },
  fsStep: { flex: 1, minWidth: 0 },
  fsHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: 4 },
  fsBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceRaised },
  fsBadgeDone: { backgroundColor: colors.primary },
  fsBadgeNext: { backgroundColor: colors.gold },
  fsCheck: { fontFamily: fonts.extrabold, fontSize: 15 },
  fsState: { fontFamily: fonts.extrabold, fontSize: type.caption, color: colors.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' },
  fsStateNext: { color: colors.gold },
  fsTitle: { fontFamily: fonts.extrabold, fontSize: 20, lineHeight: 26, color: colors.text },
  exploreRow: { marginTop: space.md },
  exploreName: { fontFamily: fonts.extrabold, fontSize: type.body, color: colors.text },
  boardRow: { flexDirection: 'row', alignItems: 'center', gap: space.lg, marginTop: space.md },
  boardRowNarrow: { flexDirection: 'column', alignItems: 'flex-start' },
  boardInfo: { flex: 1, minWidth: 0 },
  afford: {
    fontFamily: fonts.extrabold,
    fontSize: type.caption,
    color: colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
});
