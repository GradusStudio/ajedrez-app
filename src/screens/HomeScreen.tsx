import React, { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StatusBar as RNStatusBar, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';
import { Button3D } from '../components/Button3D';
import { LessonNode, NODE_BOX } from '../components/LessonNode';
import { ProgressBar } from '../components/ProgressBar';
import { StatIcon } from '../components/StatIcon';
import { Lesson, Unit } from '../data/lessonTypes';
import { units } from '../data/units';
import { lessonStates, suggestedLesson } from '../progress/path';
import { useProgress } from '../progress/ProgressContext';
import { currentStreak, minutesToday, xpToday } from '../progress/progressStore';
import { colors, fonts, radius, space } from '../theme';

type Props = {
  onStartLesson: (lesson: Lesson) => void;
};

// Alto de cada fila de la ruta (nodo con su anillo + título) y desplazamiento en zigzag.
const ROW = 124;
const ZIGZAG = [0, 56, 0, -56];

// Pestaña Aprender: barra de racha y meta, y la ruta de cada unidad (mapa-de-pantallas.md, 2.3).
export function HomeScreen({ onStartLesson }: Props) {
  const { progress } = useProgress();
  // Unidad elegida en el menú. Sin elegir, se muestra la de la lección sugerida.
  const [chosen, setChosen] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const globalSuggested = suggestedLesson(units, progress);
  const unit =
    units.find((u) => u.unit === chosen) ??
    units.find((u) => u.lessons.some((l) => l.id === globalSuggested?.id)) ??
    units[0];
  // El botón flotante sigue a la unidad en pantalla; si ya está completa, sugiere otra.
  const suggested = unit.lessons.find((l) => !progress.lessons[l.id]) ?? globalSuggested;

  const streak = currentStreak(progress);
  const minutes = minutesToday(progress);
  const goal = progress.profile.dailyGoalMin;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: (RNStatusBar.currentHeight ?? 40) + space.md }]}>
        {/* Racha, XP del día y meta diaria */}
        <View style={styles.statsRow}>
          <View style={styles.stat} accessibilityLabel={`Racha de ${streak} días`}>
            <StatIcon name="streak" />
            <Text style={styles.statText}>{streak}</Text>
          </View>
          <View style={styles.stat} accessibilityLabel={`${xpToday(progress)} XP hoy`}>
            <StatIcon name="xp" />
            <Text style={styles.statText}>{xpToday(progress)} XP hoy</Text>
          </View>
        </View>
        <View style={styles.goalRow}>
          <Text style={styles.goalLabel}>Meta diaria</Text>
          <ProgressBar value={minutes / goal} />
          <Text style={styles.goalLabel}>
            {Math.min(minutes, goal)}/{goal} min
          </Text>
        </View>

        <UnitPath key={unit.unit} unit={unit} onStartLesson={onStartLesson} onOpenMenu={() => setMenuOpen(true)} />
      </ScrollView>

      <UnitMenu
        visible={menuOpen}
        selected={unit.unit}
        onSelect={(n) => {
          setChosen(n);
          setMenuOpen(false);
        }}
        onClose={() => setMenuOpen(false)}
      />

      {/* Botón flotante con la lección sugerida */}
      {suggested && (
        <View style={styles.floating}>
          <Text style={styles.floatingCaption} numberOfLines={1}>
            Lección {suggested.order} · {suggested.title}
          </Text>
          <Button3D
            label={progress.drafts[suggested.id] ? 'Continuar' : 'Empezar'}
            variant="primary"
            onPress={() => onStartLesson(suggested)}
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
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Cerrar menú">
        {/* Tocar dentro del menú (fuera de una unidad) no lo cierra */}
        <View style={[styles.menu, { marginTop: (RNStatusBar.currentHeight ?? 40) + 96 }]} onStartShouldSetResponder={() => true}>
          <Text style={styles.menuTitle}>Elige una unidad</Text>
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
                    <Text style={styles.menuCaption}>Unidad {u.unit}</Text>
                    <Text style={styles.menuLabel}>{u.title}</Text>
                  </View>
                  <Text style={[styles.menuCount, done === u.lessons.length && { color: colors.primary }]}>
                    {done} de {u.lessons.length}
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
  const [width, setWidth] = useState(0);
  const lessons = unit.lessons;
  const states = lessonStates(lessons, progress);
  const doneCount = states.filter((s) => s === 'done').length;
  const current = lessons[states.indexOf('current')];
  const centers = lessons.map((_, i) => ({ x: width / 2 + ZIGZAG[i % ZIGZAG.length], y: i * ROW + NODE_BOX / 2 }));

  const openLesson = (lesson: Lesson, i: number) => {
    if (states[i] === 'locked') {
      Alert.alert('Lección bloqueada', `Termina «${current?.title}» para seguir avanzando en esta unidad.`);
      return;
    }
    onStartLesson(lesson);
  };

  return (
    <>
      <Pressable
        onPress={onOpenMenu}
        accessibilityRole="button"
        accessibilityLabel={`Unidad ${unit.unit}, ${unit.title}. Cambiar de unidad`}
        style={({ pressed }) => [styles.unitCard, pressed && { opacity: 0.85 }]}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.unitCaption}>Unidad {unit.unit}</Text>
          <Text style={styles.unitTitle}>
            {unit.title} · {doneCount} de {lessons.length}
          </Text>
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
                  numberOfLines={2}
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
  content: { paddingHorizontal: space.lg, paddingBottom: 140 }, // deja lugar al botón flotante
  statsRow: { flexDirection: 'row', gap: space.lg },
  stat: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  statText: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.gold },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.md },
  goalLabel: { fontFamily: fonts.semibold, fontSize: 12, color: colors.textMuted },
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
  nodeLabel: { fontFamily: fonts.bold, fontSize: 13, color: colors.text, textAlign: 'center', marginTop: space.xs },
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
