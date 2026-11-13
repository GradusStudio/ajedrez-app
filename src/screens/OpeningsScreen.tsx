import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ColumnScrollView } from '../components/ColumnScrollView';
import { Chip } from '../components/Chip';
import { ProgressBar } from '../components/ProgressBar';
import { BotStyle } from '../data/bots';
import { OpeningCourse } from '../data/lessonTypes';
import { useContent } from '../data/useContent';
import { useI18n } from '../i18n/I18nContext';
import { useProgress } from '../progress/ProgressContext';
import { colors, fonts, radius, space } from '../theme';
import { statusBarTop } from '../components/statusBarTop';
import { useWideGrid } from '../components/useWideGrid';

type Props = { onOpenCourse: (course: OpeningCourse) => void };


// Pestaña Aperturas: selector Blancas / Negras y una tarjeta por curso (mapa-de-pantallas.md, 2.6).
export function OpeningsScreen({ onOpenCourse }: Props) {
  const { progress } = useProgress();
  const { openings } = useContent();
  const { t } = useI18n();
  const { gridStyle, cardStyle } = useWideGrid();
  const [color, setColor] = useState<'w' | 'b'>('w');
  const list = openings.filter((o) => o.color === color);

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
              onPress={() => setColor(c)}
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
  guide: {
    marginTop: space.lg,
    padding: space.md,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    backgroundColor: colors.surface,
  },
  guideTitle: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.text },
  guideText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.textMuted, marginTop: space.xs, lineHeight: 19 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginTop: space.sm },
});
