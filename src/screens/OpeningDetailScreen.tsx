import React, { useMemo } from 'react';
import { showDialog } from '../components/dialog';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { BackButton } from '../components/BackButton';
import { BotAvatar } from '../components/BotAvatar';
import { BotFaces } from '../components/BotFaces';
import { Button3D } from '../components/Button3D';
import { CardSurface } from '../components/CardSurface';
import { ColumnScrollView } from '../components/ColumnScrollView';
import { CourseBoard } from '../components/CourseBoard';
import { ProgressBar } from '../components/ProgressBar';
import { StatIcon } from '../components/StatIcon';
import { statusBarTop } from '../components/statusBarTop';
import { useWideLayout } from '../components/useWideLayout';
import { WideListColumn } from '../components/WideListColumn';
import { useContent } from '../data/useContent';
import { Lesson, OpeningCourse } from '../data/lessonTypes';
import { useI18n } from '../i18n/I18nContext';
import { botsForOpening, courseSummary, lessonGroups, mainLine, practiceBotForOpening } from '../openings/courseView';
import { lessonStates, NodeState } from '../progress/path';
import { useProgress } from '../progress/ProgressContext';
import { type, colors, fonts, radius, space } from '../theme';

type Props = {
  course: OpeningCourse;
  onStartLesson: (lesson: Lesson) => void;
  onPractice: () => void;
  onBack: () => void;
};

const BOARD = 440;
// Ancho de la columna de la ficha en la web ancha: tablero de 440, separación y datos.
const WIDE_COLUMN = 1040;

/**
 * Ficha del curso de apertura (tarea 32, spec «aperturas y volver», sección 2): tablero de la línea principal con
 * visor, quién la juega, «Continuar» y «Practicar contra un bot» arriba, y las lecciones agrupadas en lo esencial,
 * las variantes y el repaso. En la web ancha van dos columnas; en el celular, una.
 */
export function OpeningDetailScreen({ course, onStartLesson, onPractice, onBack }: Props) {
  const { progress } = useProgress();
  const { t, tn, number } = useI18n();
  const { bots } = useContent();
  const wide = useWideLayout();
  const { width } = useWindowDimensions();

  const line = useMemo(() => mainLine(course), [course]);
  const summary = courseSummary(course, (id) => !!progress.lessons[id]);
  const groups = lessonGroups(course);
  const states = lessonStates(course.lessons, progress);
  const stateOf = (lessonId: string): NodeState => states[course.lessons.findIndex((l) => l.id === lessonId)] ?? 'locked';
  const players = botsForOpening(course.id, bots);
  const practiceBot = practiceBotForOpening(course.id, bots);
  const boardSize = wide ? BOARD : Math.min(width - space.lg * 2, BOARD);
  const current = states.includes('current') ? course.lessons[states.indexOf('current')] : null;
  const names = players.map((b) => b.name);
  const whoPlays = tn('openings.whoPlays', names.length, { bots: joinNames(names, t('openings.and')) });

  const open = (lesson: Lesson) => {
    const state = stateOf(lesson.id);
    if (state === 'locked') {
      showDialog(t('lesson.lockedTitle'), t('openings.lockedMessage', { title: current?.title ?? '' }));
      return;
    }
    onStartLesson(lesson);
  };

  const courseButton = summary.allDone ? (
    <Button3D label={t('openings.reviewCourse')} variant="primary" onPress={() => onStartLesson(course.lessons[0])} style={styles.mainButton} />
  ) : (
    <Button3D
      label={summary.done === 0 ? t('openings.startCourse') : t('openings.continue')}
      variant="primary"
      onPress={() => summary.next && onStartLesson(summary.next)}
      style={styles.mainButton}
    />
  );

  const board = line ? <CourseBoard line={line} orientation={course.color} size={boardSize} /> : null;

  const data = (
    <View style={styles.data}>
      <Text style={styles.kicker}>{t(course.color === 'w' ? 'openings.kickerWhite' : 'openings.kickerBlack')}</Text>
      <Text accessibilityRole="header" aria-level={1} style={styles.title}>{course.name}</Text>
      <Text style={styles.summary}>{course.summary}</Text>

      <View style={styles.who}>
        <BotFaces bots={players} size={36} />
        <Text style={styles.whoText}>{whoPlays}</Text>
      </View>

      <View style={styles.progress}>
        <ProgressBar value={summary.total ? summary.done / summary.total : 0} />
        <Text style={styles.progressText}>{t('openings.progressCount', { n: summary.done, total: summary.total })}</Text>
      </View>

      <View style={wide ? styles.actionsRow : styles.actionsColumn}>
        <View style={{ flex: 1 }}>
          {courseButton}
          {summary.next && (
            <Text style={styles.lessonLine}>{t('openings.lessonLine', { n: summary.next.order, title: summary.next.title })}</Text>
          )}
        </View>
        <View style={[styles.practiceWrap, wide && styles.practiceWrapWide]}>
          <BotAvatar bot={practiceBot} size={30} />
          <Button3D label={t('openings.practiceAgainst', { bot: practiceBot.name })} onPress={onPractice} style={styles.practiceButton} />
        </View>
      </View>

      {groups.filter((g) => g.lessons.length > 0).map((group) => {
        const doneInGroup = group.lessons.filter((l) => progress.lessons[l.id]).length;
        return (
          <View key={group.id} style={styles.group}>
            <View style={styles.groupHead}>
              <Text style={styles.groupTitle}>{t(`openings.group.${group.id}`)}</Text>
              <Text style={styles.groupCount}>{t('openings.progressCount', { n: doneInGroup, total: group.lessons.length })}</Text>
            </View>
            {group.lessons.map((lesson) => {
              const state = stateOf(lesson.id);
              const done = state === 'done';
              const locked = state === 'locked';
              return (
                <Pressable
                  key={lesson.id}
                  onPress={() => open(lesson)}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: locked }}
                  accessibilityLabel={`${t('openings.lessonLine', { n: lesson.order, title: lesson.title })}. ${done ? t('openings.completed') : locked ? t('openings.locked') : t('openings.next')}`}
                  style={({ pressed }) => [styles.lesson, state === 'current' && styles.lessonCurrent, pressed && styles.lessonPressed]}
                >
                  <View style={[styles.badgeWrap, state === 'current' && styles.badgeWrapCurrent]}>
                    <View style={[styles.badge, done && styles.badgeDone, locked && styles.badgeLocked]}>
                      {done ? (
                        <Text style={[styles.badgeText, { color: colors.bg }]}>✓</Text>
                      ) : (
                        <Text style={[styles.badgeText, locked && { color: colors.textMuted }]}>{lesson.order}</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.lessonText}>
                    <Text style={[styles.lessonTitle, locked && { color: colors.textMuted }]} numberOfLines={2}>{lesson.title}</Text>
                    {state === 'current' && <Text style={styles.lessonNext}>{t('openings.next')}</Text>}
                  </View>
                  {done ? (
                    <Text style={styles.lessonDone}>{t('openings.lessonDone')}</Text>
                  ) : (
                    <View style={styles.coins} accessibilityLabel={t('common.coinsLabel', { n: lesson.xp })}>
                      <StatIcon name="coin" size={14} />
                      <Text style={styles.coinsText}>{`+${number(lesson.xp)}`}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        );
      })}
    </View>
  );

  return (
    <WideListColumn width={WIDE_COLUMN}>
      <ColumnScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: statusBarTop(space.sm) }]}>
        <BackButton screen={t('tabs.openings')} onPress={onBack} />
        {wide ? (
          <View style={styles.cols}>
            <View style={styles.boardCol}>{board}</View>
            <CardSurface style={styles.dataCard} radius={20}>{data}</CardSurface>
          </View>
        ) : (
          <>
            {board}
            {data}
          </>
        )}
      </ColumnScrollView>
    </WideListColumn>
  );
}

/** «A», «A y B», «A, B y C» con la conjunción del idioma (openings.and). */
function joinNames(names: string[], and: string): string {
  if (names.length <= 1) return names[0] ?? '';
  return names.slice(0, -1).join(', ') + and + names[names.length - 1];
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  cols: { flexDirection: 'row', alignItems: 'flex-start', gap: space.xl, marginTop: space.md },
  boardCol: { width: BOARD, flexShrink: 0 },
  dataCard: { flex: 1, minWidth: 0, padding: space.xl },
  data: { width: '100%' },
  kicker: { fontFamily: fonts.extrabold, fontSize: type.caption, color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.6 },
  title: { fontFamily: fonts.extrabold, fontSize: type.title, color: colors.text, marginTop: 4 },
  summary: { fontFamily: fonts.bold, fontSize: type.body, color: colors.textMuted, lineHeight: 23, marginTop: space.sm },
  who: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.md, flexWrap: 'wrap' },
  whoText: { flexShrink: 1, fontFamily: fonts.bold, fontSize: type.secondary, color: colors.text },
  progress: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.md },
  progressText: { fontFamily: fonts.extrabold, fontSize: type.secondary, color: colors.textMuted },
  actionsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.lg, marginTop: space.lg },
  actionsColumn: { gap: space.md, marginTop: space.lg },
  mainButton: { width: '100%' },
  lessonLine: { fontFamily: fonts.semibold, fontSize: type.secondary, color: colors.textMuted, marginTop: 6, minHeight: 18 },
  practiceWrap: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  practiceWrapWide: { flexShrink: 0 },
  practiceButton: { flexShrink: 1 },
  group: { marginTop: space.xl },
  groupHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: space.sm, marginBottom: space.sm },
  groupTitle: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.text },
  groupCount: { fontFamily: fonts.bold, fontSize: type.secondary, color: colors.textMuted },
  lesson: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    borderBottomWidth: 4,
    borderBottomColor: colors.surfaceShadow,
    padding: 12,
    marginBottom: space.sm,
  },
  lessonCurrent: { borderColor: colors.primary, borderBottomColor: colors.primaryShadow },
  lessonPressed: { transform: [{ translateY: 2 }], borderBottomWidth: 2 },
  badgeWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  badgeWrapCurrent: { backgroundColor: 'rgba(129,182,76,0.22)' },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
  },
  badgeDone: { backgroundColor: colors.primary },
  badgeLocked: { backgroundColor: colors.surfaceRaised },
  badgeText: { fontFamily: fonts.extrabold, fontSize: type.secondary, color: colors.text },
  lessonText: { flex: 1, minWidth: 0 },
  lessonTitle: { fontFamily: fonts.extrabold, fontSize: type.body, color: colors.text },
  lessonNext: { fontFamily: fonts.bold, fontSize: type.caption, color: colors.primary, marginTop: 2 },
  lessonDone: { fontFamily: fonts.bold, fontSize: type.secondary, color: colors.textMuted },
  coins: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  coinsText: { fontFamily: fonts.extrabold, fontSize: type.secondary, color: colors.gold },
});
