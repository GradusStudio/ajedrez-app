import React, { useState } from 'react';
import { Pressable, ScrollView, StatusBar as RNStatusBar, StyleSheet, Text, View } from 'react-native';
import { Chip } from '../components/Chip';
import { ProgressBar } from '../components/ProgressBar';
import { OpeningCourse } from '../data/lessonTypes';
import { openings } from '../data/openings';
import { useProgress } from '../progress/ProgressContext';
import { colors, fonts, radius, space } from '../theme';

type Props = { onOpenCourse: (course: OpeningCourse) => void };

const COLOR_LABEL = { w: 'Blancas', b: 'Negras' } as const;

// Pestaña Aperturas: selector Blancas / Negras y una tarjeta por curso (mapa-de-pantallas.md, 2.6).
export function OpeningsScreen({ onOpenCourse }: Props) {
  const { progress } = useProgress();
  const [color, setColor] = useState<'w' | 'b'>('w');
  const list = openings.filter((o) => o.color === color);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: (RNStatusBar.currentHeight ?? 40) + space.md }]}
    >
      <Text style={styles.title}>Aperturas</Text>
      <Text style={styles.subtitle}>Elige con qué color quieres estudiar</Text>

      <View style={styles.segmented}>
        {(['w', 'b'] as const).map((c) => {
          const selected = c === color;
          return (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={`Aperturas con ${COLOR_LABEL[c].toLowerCase()}`}
              style={[styles.segment, selected && styles.segmentSelected]}
            >
              <Text style={[styles.segmentText, selected && { color: colors.text }]}>
                {COLOR_LABEL[c]} · {openings.filter((o) => o.color === c).length}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {list.map((course) => {
        const done = course.lessons.filter((l) => progress.lessons[l.id]).length;
        return (
          <Pressable
            key={course.id}
            onPress={() => onOpenCourse(course)}
            accessibilityRole="button"
            accessibilityLabel={`${course.name}, ${done} de ${course.lessons.length} lecciones`}
            style={({ pressed }) => [styles.card, pressed && { transform: [{ translateY: 2 }], borderBottomWidth: 2 }]}
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
                <Chip key={s} label={`Bot ${s}`} />
              ))}
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  title: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.text },
  subtitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted, marginTop: 2 },
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
  segmentText: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.textMuted },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    borderBottomWidth: 4,
    borderBottomColor: colors.surfaceShadow,
    paddingVertical: space.md,
    paddingHorizontal: 14,
    marginBottom: space.sm,
  },
  cardTitle: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.text },
  cardSummary: { fontFamily: fonts.semibold, fontSize: 13, color: colors.textMuted, marginTop: 2, lineHeight: 18 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.md },
  count: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.textMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginTop: space.sm },
});
