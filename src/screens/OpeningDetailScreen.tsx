import React from 'react';
import { showDialog } from '../components/dialog';
import { Pressable, ScrollView, StatusBar as RNStatusBar, StyleSheet, Text, View } from 'react-native';
import { Button3D } from '../components/Button3D';
import { Chip } from '../components/Chip';
import { Circle3D } from '../components/Circle3D';
import { StatIcon } from '../components/StatIcon';
import { ProgressBar } from '../components/ProgressBar';
import { BotStyle } from '../data/bots';
import { Lesson, OpeningCourse } from '../data/lessonTypes';
import { useI18n } from '../i18n/I18nContext';
import { lessonStates, NodeState } from '../progress/path';
import { useProgress } from '../progress/ProgressContext';
import { colors, fonts, radius, space } from '../theme';

type Props = {
  course: OpeningCourse;
  onStartLesson: (lesson: Lesson) => void;
  onPractice: () => void;
  onBack: () => void;
};

// Detalle de apertura: introducción, línea principal, una guía por cada línea y el repaso, que se desbloquean de a una (mapa-de-pantallas.md, 2.7).
export function OpeningDetailScreen({ course, onStartLesson, onPractice, onBack }: Props) {
  const { progress } = useProgress();
  const { t } = useI18n();
  const states = lessonStates(course.lessons, progress);
  const done = states.filter((s) => s === 'done').length;
  const current = course.lessons[states.indexOf('current')];

  const caption = (lesson: Lesson, state: NodeState) => {
    if (state === 'done') return t('openings.completed');
    if (state === 'locked') return t('openings.locked');
    return progress.drafts[lesson.id] ? t('openings.inProgress') : t('openings.next');
  };

  const open = (lesson: Lesson, state: NodeState) => {
    if (state === 'locked') {
      showDialog(t('lesson.lockedTitle'), t('openings.lockedMessage', { title: current?.title ?? '' }));
      return;
    }
    onStartLesson(lesson);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: (RNStatusBar.currentHeight ?? 40) + space.sm }]}
    >
      <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel={t('openings.backLabel')} hitSlop={12}>
        <Text style={styles.back}>{t('openings.back')}</Text>
      </Pressable>

      <Text style={styles.title}>{course.name}</Text>
      <View style={styles.chips}>
        <Chip label={t(course.color === 'w' ? 'openings.youPlayWhite' : 'openings.youPlayBlack')} />
        {course.botStyles.map((s) => (
          <Chip key={s} label={t('openings.botChip', { style: t(`botStyle.${s as BotStyle}`) })} />
        ))}
      </View>
      <Text style={styles.summary}>{course.summary}</Text>
      <View style={styles.progressRow}>
        <ProgressBar value={done / course.lessons.length} />
        <Text style={styles.count}>
          {t('common.xOfY', { n: done, total: course.lessons.length })}
        </Text>
      </View>

      <View style={{ height: space.lg }} />
      {course.lessons.map((lesson, i) => {
        const state = states[i];
        const pending = state === 'locked';
        return (
          <Pressable
            key={lesson.id}
            onPress={() => open(lesson, state)}
            accessibilityRole="button"
            accessibilityLabel={t('lessonNode.label', { order: lesson.order, label: lesson.title, status: caption(lesson, state) })}
            style={({ pressed }) => [
              styles.card,
              state === 'current' && styles.cardCurrent,
              pressed && { transform: [{ translateY: 2 }], borderBottomWidth: 2 },
            ]}
          >
            <Circle3D
              size={40}
              depth={3}
              color={pending ? colors.surfaceRaised : colors.primary}
              edge={pending ? colors.surfaceShadow : colors.primaryShadow}
            >
              <Text style={[styles.badgeText, pending && { color: colors.outline }]}>
                {state === 'done' ? '✓' : lesson.order}
              </Text>
            </Circle3D>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, pending && { color: colors.textMuted }]}>{lesson.title}</Text>
              <Text style={styles.cardCaption}>{caption(lesson, state)}</Text>
            </View>
            {/* Monedas que da la lección la primera vez (campo `xp` del JSON) */}
            <View style={styles.coins} accessibilityLabel={t('common.coinsLabel', { n: lesson.xp })}>
              <StatIcon name="coin" size={14} color={state === 'done' ? colors.textMuted : colors.gold} />
              <Text style={[styles.xp, state === 'done' && { color: colors.textMuted }]}>{lesson.xp}</Text>
            </View>
          </Pressable>
        );
      })}

      <View style={{ height: space.lg }} />
      <Button3D label={t('openings.practice')} onPress={onPractice} />
      <Text style={styles.practiceNote}>{t(course.color === 'w' ? 'openings.practiceNoteWhite' : 'openings.practiceNoteBlack')}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  back: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted, marginBottom: space.sm },
  title: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginTop: space.sm },
  summary: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted, marginTop: space.md, lineHeight: 20 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.md },
  count: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.textMuted },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    borderBottomWidth: 4,
    borderBottomColor: colors.surfaceShadow,
    padding: 14,
    marginBottom: space.sm,
  },
  cardCurrent: { borderColor: colors.primary, borderBottomColor: colors.primaryShadow },
  badgeText: { fontFamily: fonts.extrabold, fontSize: 16, color: '#FFFFFF' },
  cardTitle: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.text },
  cardCaption: { fontFamily: fonts.semibold, fontSize: 13, color: colors.textMuted, marginTop: 2 },
  coins: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  xp: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.gold },
  practiceNote: { fontFamily: fonts.semibold, fontSize: 12, color: colors.textMuted, marginTop: space.sm, textAlign: 'center' },
});
