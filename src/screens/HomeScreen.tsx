import React, { useState } from 'react';
import { showDialog } from '../components/dialog';
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View, ViewStyle } from 'react-native';
import { ColumnScrollView, useColumnWidth } from '../components/ColumnScrollView';
import Svg, { Line, Path } from 'react-native-svg';
import { Button3D } from '../components/Button3D';
import { LessonNode, NODE_BOX } from '../components/LessonNode';
import { RecoveryCard } from '../components/RecoveryCard';
import { StatIcon } from '../components/StatIcon';
import { Lesson, Unit } from '../data/lessonTypes';
import { useContent } from '../data/useContent';
import { useI18n } from '../i18n/I18nContext';
import { lessonStates, suggestedLesson } from '../progress/path';
import { useProgress } from '../progress/ProgressContext';
import { currentStreak, streakStatusNow } from '../progress/progressStore';
import { useTodayKey } from '../settings/useTodayKey';
import { colors, fonts, radius, space } from '../theme';
import { statusBarTop } from '../components/statusBarTop';
import { useWideLayout } from '../components/useWideLayout';
import { wideContentWidth } from '../components/wideLayout';
import { homeWideColumns } from '../components/wideHome';

type Props = {
  onStartLesson: (lesson: Lesson) => void;
};

// Alto de cada fila de la ruta (nodo con su anillo + título) y desplazamiento en zigzag.
const ROW = 150; // deja lugar a títulos de hasta 3 renglones
const ZIGZAG = [0, 56, 0, -56];

// La columna derecha de Aprender se queda arriba mientras la ruta se desplaza. `sticky` es de la
// web y no está en los tipos de React Native; esta rama solo se renderiza en la web ancha.
// `alignSelf: flex-start` evita que la columna se estire al alto de la fila (si no, no se pega).
const stickyTop = { position: 'sticky', top: 0, alignSelf: 'flex-start' } as unknown as ViewStyle;

// Pestaña Aprender: barra de racha y monedas, y la ruta de cada unidad (mapa-de-pantallas.md, 2.3).
export function HomeScreen({ onStartLesson }: Props) {
  const { progress, setLastUnit } = useProgress();
  const { units } = useContent();
  const { t } = useI18n();
  // Unidad elegida en el menú. Sin elegir, se muestra la de la última lección empezada
  // (guardada en el progreso) o, la primera vez, la de la lección sugerida.
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
  const { width, height } = useWindowDimensions();
  const columns = wide ? homeWideColumns(wideContentWidth(width)) : null;

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

  if (columns) {
    return (
      <View style={styles.screen}>
        <ScrollView style={styles.wideScroll} contentContainerStyle={styles.wideScrollContent}>
          <View style={[styles.wideContentRow, { width: columns.total, gap: columns.gap }]}>
            <View style={[styles.wideRouteContent, { width: columns.route, paddingTop: statusBarTop(space.md) }]}>
              {status.kind === 'recovering' && <RecoveryCard days={status.days} done={status.done} />}
              <UnitPath key={unit.unit} unit={unit} onStartLesson={startLesson} onOpenMenu={() => setMenuOpen(true)} />
            </View>
            {/* El panel es una columna más de la fila, pegada arriba: la rueda sobre él sigue
                desplazando la página (antes, una capa superpuesta se quedaba con el scroll). */}
            <ScrollView
              style={[stickyTop, { width: columns.panel, maxHeight: height }]}
              contentContainerStyle={[styles.widePanelContent, { paddingTop: statusBarTop(space.md) }]}
            >
              {suggested && (
                <View style={styles.panelCard}>
                  <Text style={styles.panelCaption} numberOfLines={2}>
                    {t('home.lessonCaption', { order: suggested.order, title: suggested.title })}
                  </Text>
                  <Button3D
                    label={progress.drafts[suggested.id] ? t('common.continue') : t('common.start')}
                    variant="primary"
                    onPress={() => startLesson(suggested)}
                    style={{ marginTop: space.sm }}
                  />
                </View>
              )}
              <View style={[styles.panelCard, styles.panelStats]}>
                <View style={styles.stat} accessibilityLabel={t('home.streakLabel', { n: streak })}>
                  <StatIcon name="streak" />
                  <Text style={styles.statText}>{streak}</Text>
                </View>
                <View style={styles.stat} accessibilityLabel={t('common.coinsLabel', { n: progress.coins })}>
                  <StatIcon name="coin" />
                  <Text style={styles.statText}>{progress.coins}</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </ScrollView>

        {unitMenu}
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
            <StatIcon name="streak" />
            <Text style={styles.statText}>{streak}</Text>
          </View>
          <View style={styles.stat} accessibilityLabel={t('common.coinsLabel', { n: progress.coins })}>
            <StatIcon name="coin" />
            <Text style={styles.statText}>{progress.coins}</Text>
          </View>
        </View>
        {status.kind === 'recovering' && <RecoveryCard days={status.days} done={status.done} />}

        <UnitPath key={unit.unit} unit={unit} onStartLesson={startLesson} onOpenMenu={() => setMenuOpen(true)} />
      </ColumnScrollView>

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

/** Encabezado de una unidad (abre el menú de unidades) y su ruta: línea que une los nodos y los nodos encima. */
function UnitPath({
  unit,
  onStartLesson,
  onOpenMenu,
}: {
  unit: Unit;
  onStartLesson: (lesson: Lesson) => void;
  onOpenMenu: () => void;
}) {
  const { progress } = useProgress();
  const { t } = useI18n();
  const [width, setWidth] = useState(0);
  const lessons = unit.lessons;
  const states = lessonStates(lessons, progress);
  const doneCount = states.filter((s) => s === 'done').length;
  const current = lessons[states.indexOf('current')];
  const centers = lessons.map((_, i) => ({ x: width / 2 + ZIGZAG[i % ZIGZAG.length], y: i * ROW + NODE_BOX / 2 }));

  const openLesson = (lesson: Lesson, i: number) => {
    if (states[i] === 'locked') {
      showDialog(t('lesson.lockedTitle'), t('home.lockedMessage', { title: current?.title ?? '' }));
      return;
    }
    onStartLesson(lesson);
  };

  return (
    <>
      <Pressable
        onPress={onOpenMenu}
        accessibilityRole="button"
        accessibilityLabel={t('home.unitCardLabel', { n: unit.unit, title: unit.title })}
        style={({ pressed }) => [styles.unitCard, pressed && { opacity: 0.85 }]}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.unitCaption}>{t('home.unit', { n: unit.unit })}</Text>
          <Text style={styles.unitTitle}>{t('home.unitTitle', { title: unit.title, done: doneCount, total: lessons.length })}</Text>
        </View>
        <Chevron />
      </Pressable>

      <View
        style={{ height: lessons.length * ROW, marginTop: space.xl }}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      >
        {width > 0 && (
          <>
            <Svg style={StyleSheet.absoluteFill} width={width} height={lessons.length * ROW}>
              {centers.slice(1).map((c, i) => (
                <Line
                  key={i}
                  x1={centers[i].x}
                  y1={centers[i].y}
                  x2={c.x}
                  y2={c.y}
                  stroke={states[i] === 'done' ? colors.primary : colors.surfaceRaised}
                  strokeWidth={6}
                  strokeLinecap="round"
                />
              ))}
            </Svg>
            {lessons.map((lesson, i) => (
              <View key={lesson.id} style={[styles.nodeWrap, { left: centers[i].x - 80, top: i * ROW }]}>
                <LessonNode
                  state={states[i]}
                  order={lesson.order}
                  label={lesson.title}
                  onPress={() => openLesson(lesson, i)}
                />
                <Text
                  style={[styles.nodeLabel, states[i] === 'locked' && { color: colors.textMuted }]}
                  numberOfLines={3}
                  maxFontSizeMultiplier={1.3}
                >
                  {lesson.title}
                </Text>
              </View>
            ))}
          </>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.lg },
  wideScroll: { flex: 1 },
  wideScrollContent: { width: '100%', alignItems: 'center' },
  wideContentRow: { flexDirection: 'row' },
  wideRouteContent: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  widePanelContent: { gap: space.md, paddingBottom: space.lg },
  panelCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    borderBottomWidth: 4,
    borderBottomColor: colors.surfaceShadow,
    padding: space.md,
  },
  panelCaption: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.text },
  panelStats: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  statsRow: { flexDirection: 'row', gap: space.lg },
  stat: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  statText: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.gold },
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
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.85,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  unitTitle: { fontFamily: fonts.extrabold, fontSize: 20, color: '#FFFFFF' },
  nodeWrap: { position: 'absolute', width: 160, alignItems: 'center' },
  // Fondo del color de la pantalla: la línea que une los nodos pasa por detrás del título sin cortarlo.
  nodeLabel: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.text,
    textAlign: 'center',
    marginTop: space.xs,
    backgroundColor: colors.bg,
    paddingHorizontal: 6,
    borderRadius: 6,
    overflow: 'hidden',
  },
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
  menuTitle: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.text, padding: space.sm },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    borderRadius: radius.bar,
  },
  menuItemActive: { backgroundColor: colors.surfaceRaised },
  menuCaption: { fontFamily: fonts.extrabold, fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  menuLabel: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  menuCount: { fontFamily: fonts.semibold, fontSize: 13, color: colors.textMuted },
  floatingCaption: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.text, marginBottom: space.sm },
});
