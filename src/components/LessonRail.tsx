import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button3D } from './Button3D';
import { Circle3D } from './Circle3D';
import { Lesson } from '../data/lessonTypes';
import { useI18n } from '../i18n/I18nContext';
import { NodeState } from '../progress/path';
import { type, colors, fonts, space } from '../theme';

type Props = {
  caption: string;
  title: string;
  lessons: Lesson[];
  states: NodeState[];
  onStartLesson: (lesson: Lesson) => void;
  onBack: () => void;
  backLabel: string;
  actionLabel: string;
  onAction: () => void;
  /** Acción secundaria opcional (Aperturas: «Ver curso»). */
  secondaryLabel?: string;
  onSecondary?: () => void;
};

const FACE = 44;
const DEPTH = 4;

/** Riel de lecciones para la web ancha: nodos 3D de 44 px y botón grande fijo abajo. */
export function LessonRail({
  caption,
  title,
  lessons,
  states,
  onStartLesson,
  onBack,
  backLabel,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: Props) {
  return (
    <View style={styles.rail}>
      <View style={styles.head}>
        <Button3D label={backLabel} onPress={onBack} />
        <View style={styles.headText}>
          <Text style={styles.caption}>{caption}</Text>
          <Text style={styles.name} numberOfLines={2}>
            {title}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.track} showsVerticalScrollIndicator={false}>
        <View style={styles.line} pointerEvents="none" />
        {lessons.map((lesson, i) => (
          <RailRow key={lesson.id} lesson={lesson} state={states[i]} onPress={() => onStartLesson(lesson)} />
        ))}
      </ScrollView>

      {secondaryLabel && onSecondary && (
        <Button3D label={secondaryLabel} onPress={onSecondary} style={styles.action} />
      )}
      <Button3D label={actionLabel} onPress={onAction} variant="primary" style={styles.action} />
    </View>
  );
}

/** Fila del riel: círculo 3D con el número o el ✓, y el título de la lección. */
function RailRow({ lesson, state, onPress }: { lesson: Lesson; state: NodeState; onPress: () => void }) {
  const { t } = useI18n();
  const [down, setDown] = useState(false);
  const locked = state === 'locked';
  const done = state === 'done';
  const current = state === 'current';
  const status = t(`lessonNode.${state}`);
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setDown(true)}
      onPressOut={() => setDown(false)}
      disabled={locked}
      accessibilityRole="button"
      accessibilityLabel={t('lessonNode.label', { order: lesson.order, label: lesson.title, status })}
      accessibilityState={{ disabled: locked }}
      style={({ pressed }) => [styles.row, pressed && !locked && { opacity: 0.85 }]}
    >
      <View style={styles.dotWrap}>
        {current && <View style={styles.halo} pointerEvents="none" />}
        <Circle3D
          size={FACE}
          depth={DEPTH}
          color={done || current ? colors.primary : colors.surfaceRaised}
          edge={done || current ? colors.primaryShadow : colors.surfaceShadow}
          pressed={down && !locked}
        >
          <Text style={[styles.dotText, { color: locked ? colors.outline : done || current ? '#FFFFFF' : colors.text }]}>
            {done ? '✓' : lesson.order}
          </Text>
        </Circle3D>
      </View>
      <Text style={[styles.label, locked && styles.labelLocked]} numberOfLines={3} maxFontSizeMultiplier={1.3}>
        {lesson.title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  rail: {
    width: 400,
    height: '100%',
    paddingTop: 118,
    paddingHorizontal: space.xxl,
    paddingBottom: space.xxl,
    backgroundColor: colors.bg,
    borderLeftWidth: 2,
    borderLeftColor: colors.surfaceRaised,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.xl },
  headText: { flex: 1 },
  caption: {
    fontFamily: fonts.extrabold,
    fontSize: type.caption,
    color: colors.primary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  name: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.text, lineHeight: 23 },
  scroll: { flex: 1 },
  track: { position: 'relative', gap: space.md, paddingVertical: 4 },
  line: {
    position: 'absolute',
    left: 19,
    top: 20,
    bottom: 20,
    width: 6,
    borderRadius: 6,
    backgroundColor: colors.surfaceRaised,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.lg, minHeight: 48 },
  dotWrap: { width: FACE, height: FACE + DEPTH, alignItems: 'center', justifyContent: 'center' },
  halo: {
    position: 'absolute',
    left: -5,
    top: -5,
    width: FACE + 10,
    height: FACE + 10,
    borderRadius: (FACE + 10) / 2,
    backgroundColor: 'rgba(129, 182, 76, 0.25)',
  },
  dotText: { fontFamily: fonts.extrabold, fontSize: type.body },
  label: { flex: 1, fontFamily: fonts.extrabold, fontSize: type.body, color: colors.text },
  labelLocked: { color: colors.textMuted },
  action: { marginTop: space.lg },
});
