import React, { useEffect, useRef, useState } from 'react';
import { useIsFocused } from 'expo-router';
import { showDialog } from '../components/dialog';
import { Animated, Easing, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ColumnScrollView, useColumnWidth } from '../components/ColumnScrollView';
import Svg, { Path } from 'react-native-svg';
import { Board } from '../components/Board';
import { BoardSizeContext } from '../components/BoardSizeContext';
import { Button3D } from '../components/Button3D';
import { LessonNode, NODE_BOX } from '../components/LessonNode';
import { LessonRail } from '../components/LessonRail';
import { MiniBoard } from '../components/MiniBoard';
import { RecoveryCard } from '../components/RecoveryCard';
import { StatIcon } from '../components/StatIcon';
import { StreakFlame, flameStateOf } from '../components/StreakFlame';
import { Tip } from '../components/Tip';
import { UnitWheel } from '../components/UnitWheel';
import { Lesson, Unit } from '../data/lessonTypes';
import progressGamesRaw from '../data/progressGames.json';
import { useContent } from '../data/useContent';
import { useI18n } from '../i18n/I18nContext';
import { lessonStates, suggestedLesson } from '../progress/path';
import { piecesFromFen, progressPosition, type ProgressGamesFile } from '../progress/progressGame';
import { useProgress } from '../progress/ProgressContext';
import { currentStreak, streakStatusNow } from '../progress/progressStore';
import { useTodayKey } from '../settings/useTodayKey';
import { TIP_MESSAGES } from '../settings/tips';
import { useTips } from '../settings/useTips';
import { type, colors, fonts, radius, space } from '../theme';
import { statusBarTop } from '../components/statusBarTop';
import { useReducedMotion } from '../components/useReducedMotion';
import { useWideLayout } from '../components/useWideLayout';

type Props = {
  onStartLesson: (lesson: Lesson) => void;
};

// Partidas de progreso de las unidades (progressGame.json, tareas 8 y 10 de agentes.md).
const progressGames = (progressGamesRaw as unknown as ProgressGamesFile).units;

/** Última fecha en que la barra hizo el rebote de la llama (una vez por día y por sesión). */
let flameShownDate = '';

// Pestaña Aprender: barra de racha y monedas, y la ruta de cada unidad (mapa-de-pantallas.md, 2.3).
export function HomeScreen({ onStartLesson }: Props) {
  const { progress, setLastUnit } = useProgress();
  const { units } = useContent();
  const { t } = useI18n();
  // Unidad elegida en el menú o en la corona. Sin elegir, se muestra la de la última lección
  // empezada (guardada en el progreso) o, la primera vez, la de la lección sugerida.
  const [chosen, setChosen] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const globalSuggested = suggestedLesson(units, progress);
  const unit =
    units.find((u) => u.unit === (chosen ?? progress.lastUnit)) ??
    units.find((u) => u.lessons.some((l) => l.id === globalSuggested?.id)) ??
    units[0];
  // El botón flotante sigue a la unidad en pantalla; si ya está completa, sugiere otra.
  const suggested = unit.lessons.find((l) => !progress.lessons[l.id]) ?? globalSuggested;

  /** Abre la lección y recuerda su unidad, para mostrarla al volver y al abrir la app. */
  const startLesson = (lesson: Lesson) => {
    const n = units.find((u) => u.lessons.some((l) => l.id === lesson.id))?.unit;
    if (n !== undefined) {
      setChosen(n);
      setLastUnit(n);
    }
    onStartLesson(lesson);
  };

  const today = useTodayKey();
  const streak = currentStreak(progress, today);
  const status = streakStatusNow(progress, today);
  // Alto del botón flotante: el final de la ruta se puede subir por encima de él.
  const [floatingHeight, setFloatingHeight] = useState(140);
  // Pantalla ancha: la tarjeta flotante va centrada en la columna, no de borde a borde de la ventana.
  const column = useColumnWidth();
  const floatingWide = column
    ? { left: '50%' as const, right: undefined, width: column - space.lg * 2, marginLeft: -(column - space.lg * 2) / 2 }
    : null;

  const wide = useWideLayout();
  const tipTarget = useRef<React.ComponentRef<typeof View>>(null);
  const tips = useTips([wide ? 'learn.wheel' : 'learn.rail']);
  const tipMessage = tips.current ? TIP_MESSAGES[tips.current] : null;
  const focused = useIsFocused();
  const reduced = useReducedMotion();
  const [railOpen, setRailOpen] = useState(false);
  const [rail] = useState(() => new Animated.Value(0));
  const [boardFade] = useState(() => new Animated.Value(1));
  const [titleFade] = useState(() => new Animated.Value(1));
  const [flameBounce] = useState(() => new Animated.Value(1));

  // Rebote corto de la llama la primera vez que la barra la muestra encendida en el día.
  useEffect(() => {
    if (status.kind !== 'safe' || reduced || flameShownDate === today) return;
    flameShownDate = today;
    const bounce = Animated.sequence([
      Animated.timing(flameBounce, { toValue: 1.25, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(flameBounce, { toValue: 1, duration: 260, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]);
    bounce.start();
    return () => bounce.stop();
  }, [status.kind, reduced, today, flameBounce]);

  // Entrada y salida del riel: la corona sale a la izquierda y el tablero se corre.
  useEffect(() => {
    if (!wide) return;
    Animated.timing(rail, {
      toValue: railOpen ? 1 : 0,
      duration: reduced ? 0 : 520,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start();
  }, [wide, railOpen, rail, reduced]);

  // Al cambiar de unidad, el tablero y el encabezado se funden.
  useEffect(() => {
    if (!wide) return;
    boardFade.setValue(0);
    Animated.timing(boardFade, { toValue: 1, duration: reduced ? 0 : 160, useNativeDriver: true }).start();
    titleFade.setValue(0);
    Animated.timing(titleFade, { toValue: 1, duration: reduced ? 0 : 140, useNativeDriver: true }).start();
  }, [wide, unit.unit, boardFade, titleFade, reduced]);

  // Escape cierra el riel, como el botón Volver.
  useEffect(() => {
    if (!wide || !focused || Platform.OS !== 'web' || !railOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setRailOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [wide, focused, railOpen]);

  const unitMenu = (
    <UnitMenu
      visible={menuOpen}
      selected={unit.unit}
      onSelect={(n) => {
        setChosen(n);
        setMenuOpen(false);
      }}
      onClose={() => setMenuOpen(false)}
    />
  );

  if (wide) {
    const unitIndex = Math.max(0, units.findIndex((u) => u.unit === unit.unit));
    const game = progressGames[String(unit.unit)] ?? { moves: [], side: 'w' as const };
    const states = lessonStates(unit.lessons, progress);
    const doneCount = states.filter((s) => s === 'done').length;
    const position = progressPosition(game, doneCount, unit.lessons.length);
    const legend =
      position.total === 0
        ? t('home.progressSoon')
        : position.complete
          ? t('home.progressComplete')
          : t('home.progressMove', { n: position.played, total: position.total });
    const showHint = position.total > 0 && !position.complete;
    const suggestedForUnit = unit.lessons.find((l) => !progress.lessons[l.id]) ?? unit.lessons[0];
    const actionLabel =
      doneCount >= unit.lessons.length ? t('home.review') : doneCount === 0 ? t('common.start') : t('common.continue');
    const wheelItems = units.map((u) => {
      const done = u.lessons.filter((l) => progress.lessons[l.id]).length;
      return {
        key: String(u.unit),
        label: String(u.unit),
        accessibilityLabel: t('home.unitWheelLabel', { n: u.unit, title: u.title, done, total: u.lessons.length }),
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
              <Animated.View style={{ transform: [{ scale: flameBounce }] }}>
                <StreakFlame state={flameStateOf(status.kind)} size={18} />
              </Animated.View>
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
              <View style={styles.head}>
                <Animated.View style={{ opacity: titleFade }}>
                  <Text style={styles.over}>{t('home.unit', { n: unit.unit })}</Text>
                  <Text style={styles.name} numberOfLines={2}>
                    {unit.title}
                  </Text>
                </Animated.View>
              </View>
              <View ref={tipTarget}>
                <UnitWheel
                  items={wheelItems}
                  initialIndex={unitIndex}
                  previousLabel={t('home.prevUnitLabel')}
                  nextLabel={t('home.nextUnitLabel')}
                  enabled={focused && !railOpen}
                  onActiveChange={(i) => setChosen(units[i].unit)}
                  onOpen={() => setRailOpen(true)}
                />
              </View>
            </Animated.View>

            <Animated.View style={[styles.boardCol, boardStyle]}>
              <View
                accessible
                accessibilityRole="image"
                accessibilityLabel={t('home.progressBoardLabel', { legend })}
              >
                <BoardSizeContext.Provider value={480}>
                  <Board
                    key={unit.unit}
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

          <Animated.View style={[styles.railWrap, railStyle]} pointerEvents={railOpen ? 'auto' : 'none'}>
            <LessonRail
              caption={t('home.unit', { n: unit.unit })}
              title={unit.title}
              lessons={unit.lessons}
              states={states}
              onStartLesson={startLesson}
              onBack={() => setRailOpen(false)}
              backLabel={t('home.back')}
              actionLabel={actionLabel}
              onAction={() => startLesson(suggestedForUnit)}
            />
          </Animated.View>
        </View>
        <Tip
          visible={!!tips.current}
          title={tipMessage ? t(tipMessage.title) : ''}
          text={tipMessage ? t(tipMessage.text) : ''}
          target={tipTarget}
          onNext={tips.next}
          onClose={tips.close}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ColumnScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: statusBarTop(space.md), paddingBottom: floatingHeight + space.xl * 2 },
        ]}
      >
        {/* Racha y monedas */}
        <View style={styles.statsRow}>
          <View style={styles.stat} accessibilityLabel={t('home.streakLabel', { n: streak })}>
            <Animated.View style={{ transform: [{ scale: flameBounce }] }}>
              <StreakFlame state={flameStateOf(status.kind)} size={18} />
            </Animated.View>
            <Text style={[styles.statText, status.kind !== 'safe' && { color: colors.textMuted }]}>{streak}</Text>
          </View>
          <View style={styles.stat} accessibilityLabel={t('common.coinsLabel', { n: progress.coins })}>
            <StatIcon name="coin" />
            <Text style={styles.statText}>{progress.coins}</Text>
          </View>
        </View>
        {status.kind === 'recovering' && <RecoveryCard days={status.days} done={status.done} />}

        <UnitRail key={unit.unit} unit={unit} onStartLesson={startLesson} onOpenMenu={() => setMenuOpen(true)} cardRef={tipTarget} />
      </ColumnScrollView>

      <Tip
        visible={!!tips.current}
        title={tipMessage ? t(tipMessage.title) : ''}
        text={tipMessage ? t(tipMessage.text) : ''}
        target={tipTarget}
        onNext={tips.next}
        onClose={tips.close}
      />

      {unitMenu}

      {/* Botón flotante con la lección sugerida */}
      {suggested && (
        <View style={[styles.floating, floatingWide]} onLayout={(e) => setFloatingHeight(e.nativeEvent.layout.height)}>
          <Text style={styles.floatingCaption} numberOfLines={2}>
            {t('home.lessonCaption', { order: suggested.order, title: suggested.title })}
          </Text>
          <Button3D
            label={progress.drafts[suggested.id] ? t('common.continue') : t('common.start')}
            variant="primary"
            onPress={() => startLesson(suggested)}
          />
        </View>
      )}
    </View>
  );
}

/** Flecha hacia abajo del encabezado de la unidad. */
function Chevron() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path d="M6 9l6 6 6-6" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

/** Menú para elegir qué unidad se muestra en la ruta. */
function UnitMenu({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: number;
  onSelect: (unit: number) => void;
  onClose: () => void;
}) {
  const { progress } = useProgress();
  const { units } = useContent();
  const { t } = useI18n();
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t('home.closeMenu')}>
        {/* Tocar dentro del menú (fuera de una unidad) no lo cierra */}
        <View style={[styles.menu, { marginTop: statusBarTop(96) }]} onStartShouldSetResponder={() => true}>
          <Text style={styles.menuTitle}>{t('home.chooseUnit')}</Text>
          <ScrollView>
            {units.map((u) => {
              const done = u.lessons.filter((l) => progress.lessons[l.id]).length;
              const active = u.unit === selected;
              return (
                <Pressable
                  key={u.unit}
                  onPress={() => onSelect(u.unit)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={({ pressed }) => [styles.menuItem, active && styles.menuItemActive, pressed && { opacity: 0.7 }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuCaption}>{t('home.unit', { n: u.unit })}</Text>
                    <Text style={styles.menuLabel}>{u.title}</Text>
                  </View>
                  <Text style={[styles.menuCount, done === u.lessons.length && { color: colors.primary }]}>
                    {t('common.xOfY', { n: done, total: u.lessons.length })}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
}

/** Riel recto para celular y web angosta: cabecera con el tablero de progreso y las lecciones. */
function UnitRail({
  unit,
  onStartLesson,
  onOpenMenu,
  cardRef,
}: {
  unit: Unit;
  onStartLesson: (lesson: Lesson) => void;
  onOpenMenu: () => void;
  /** Tarjeta de la unidad, para el consejo de Pipo. */
  cardRef?: React.RefObject<React.ComponentRef<typeof View> | null>;
}) {
  const { progress } = useProgress();
  const { t } = useI18n();
  const lessons = unit.lessons;
  const states = lessonStates(lessons, progress);
  const doneCount = states.filter((s) => s === 'done').length;
  const current = lessons[states.indexOf('current')];
  const game = progressGames[String(unit.unit)] ?? { moves: [], side: 'w' as const };
  const position = progressPosition(game, doneCount, lessons.length);
  const pieces = piecesFromFen(position.fen);
  const legend =
    position.total === 0
      ? t('home.progressStart')
      : position.complete
        ? t('home.progressComplete')
        : t('home.progressMove', { n: position.played, total: position.total });

  const openLesson = (lesson: Lesson, i: number) => {
    if (states[i] === 'locked') {
      showDialog(t('lesson.lockedTitle'), t('home.lockedMessage', { title: current?.title ?? '' }));
      return;
    }
    onStartLesson(lesson);
  };

  return (
    <>
      <View ref={cardRef} style={[styles.unitCard, styles.unitCardRail]}>
        <Pressable
          onPress={onOpenMenu}
          accessibilityRole="button"
          accessibilityLabel={t('home.unitCardLabel', { n: unit.unit, title: unit.title })}
          style={({ pressed }) => [styles.unitCardPress, pressed && { opacity: 0.85 }]}
        >
          <View style={styles.unitCaptionRow}>
            <Text style={styles.unitCaption}>{t('home.unit', { n: unit.unit })}</Text>
            <Chevron />
          </View>
          <Text style={styles.unitTitle}>{t('home.unitTitle', { title: unit.title, done: doneCount, total: lessons.length })}</Text>
        </Pressable>
        <View accessible accessibilityRole="image" accessibilityLabel={t('home.progressBoardLabel', { legend })}>
          <MiniBoard size={120} corner="a1" span={8} pieces={pieces} lastMove={position.lastMove} />
        </View>
      </View>

      <View style={styles.rail}>
        {lessons.length > 1 && <View style={styles.railLine} />}
        {lessons.map((lesson, i) => (
          <View key={lesson.id} style={styles.railRow}>
            <LessonNode
              state={states[i]}
              order={lesson.order}
              label={lesson.title}
              onPress={() => openLesson(lesson, i)}
            />
            <Text
              style={[styles.railLabel, states[i] === 'locked' && { color: colors.textMuted }]}
              numberOfLines={3}
              maxFontSizeMultiplier={1.3}
            >
              {lesson.title}
            </Text>
          </View>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.lg },
  statsRow: { flexDirection: 'row', gap: space.lg },
  stat: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  statText: { fontFamily: fonts.extrabold, fontSize: type.body, color: colors.gold },
  wideTop: { paddingHorizontal: space.lg, gap: space.sm },
  scene: { flex: 1, position: 'relative', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  sceneRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 64, width: 844 },
  leftCol: { width: 300 },
  head: { height: 104, justifyContent: 'flex-end', paddingLeft: space.lg, marginBottom: space.lg },
  over: {
    fontFamily: fonts.extrabold,
    fontSize: type.caption,
    color: colors.primary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  name: { fontFamily: fonts.extrabold, fontSize: type.title, color: colors.text, lineHeight: type.title + 4 },
  boardCol: { width: 480, marginTop: 118 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: space.lg },
  legendStrong: { fontFamily: fonts.extrabold, fontSize: type.secondary, color: colors.gold },
  legendHint: { fontFamily: fonts.bold, fontSize: type.secondary, color: colors.textMuted },
  railWrap: { position: 'absolute', top: 0, right: 0, bottom: 0, width: 400, zIndex: 2 },
  unitCard: {
    marginTop: space.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.control,
    borderBottomWidth: 4,
    borderBottomColor: colors.primaryShadow,
    paddingVertical: space.md,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  unitCaption: {
    fontFamily: fonts.extrabold,
    fontSize: type.caption,
    color: '#FFFFFF',
    opacity: 0.85,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  unitTitle: { fontFamily: fonts.extrabold, fontSize: 20, color: '#FFFFFF' },
  unitCardRail: { gap: space.md },
  unitCardPress: { flex: 1 },
  unitCaptionRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  rail: { marginTop: space.xl, position: 'relative', gap: space.md },
  railLine: {
    position: 'absolute',
    left: NODE_BOX / 2 - 3,
    top: NODE_BOX / 2,
    bottom: NODE_BOX / 2,
    width: 6,
    borderRadius: 6,
    backgroundColor: colors.surfaceRaised,
  },
  railRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  railLabel: { flex: 1, fontFamily: fonts.bold, fontSize: type.body, color: colors.text },
  floating: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
    bottom: space.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    borderBottomWidth: 4,
    borderBottomColor: colors.surfaceShadow,
    padding: space.md,
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', paddingHorizontal: space.lg },
  menu: {
    maxHeight: '70%',
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    padding: space.sm,
  },
  menuTitle: { fontFamily: fonts.extrabold, fontSize: type.body, color: colors.text, padding: space.sm },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    borderRadius: radius.bar,
  },
  menuItemActive: { backgroundColor: colors.surfaceRaised },
  menuCaption: { fontFamily: fonts.extrabold, fontSize: type.caption, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  menuLabel: { fontFamily: fonts.bold, fontSize: type.body, color: colors.text },
  menuCount: { fontFamily: fonts.semibold, fontSize: type.secondary, color: colors.textMuted },
  floatingCaption: { fontFamily: fonts.extrabold, fontSize: type.secondary, color: colors.text, marginBottom: space.sm },
});
