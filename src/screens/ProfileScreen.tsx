import React from 'react';
import { ScrollView, StatusBar as RNStatusBar, StyleSheet, Text, View } from 'react-native';
import { BotAvatar } from '../components/BotAvatar';
import { ProgressBar } from '../components/ProgressBar';
import { SettingRow } from '../components/SettingRow';
import { StatIcon } from '../components/StatIcon';
import { useContent } from '../data/useContent';
import { useI18n } from '../i18n/I18nContext';
import { useProgress } from '../progress/ProgressContext';
import { currentStreak, isPuzzleSolved, recordAgainst } from '../progress/progressStore';
import { puzzles } from '../puzzles/puzzles';
import { useTodayKey } from '../settings/useTodayKey';
import { colors, fonts, radius, space } from '../theme';

type Props = {
  onOpenSettings: () => void;
  onOpenCredits: () => void;
  onOpenPieces: () => void;
  /** Abre el repaso de los errores guardados de una lección. */
  onOpenReview: (lessonId: string, stepIds: string[]) => void;
};

// Perfil: racha, monedas, lecciones, aperturas, puzzles y bots; acceso a Ajustes y Créditos (mapa-de-pantallas.md, 2.11).
export function ProfileScreen({ onOpenSettings, onOpenCredits, onOpenPieces, onOpenReview }: Props) {
  const { progress } = useProgress();
  const { bots, openings, units, findLesson } = useContent();
  const { t, tn } = useI18n();
  const today = useTodayKey();
  // Errores que se pueden repasar (un paso pudo desaparecer si cambió el contenido de la lección).
  const reviewable = progress.mistakes.filter((m) => findLesson(m.lessonId)?.steps.some((s) => s.id === m.stepId));
  const openReview = () => {
    const { lessonId } = reviewable[0];
    onOpenReview(lessonId, reviewable.filter((m) => m.lessonId === lessonId).map((m) => m.stepId));
  };
  const unitLessons = units.flatMap((u) => u.lessons);
  const lessonsDone = unitLessons.filter((l) => progress.lessons[l.id]).length;
  const puzzlesSolved = puzzles.filter((p) => isPuzzleSolved(progress, p.id)).length;
  const startedOpenings = openings
    .map((o) => ({ course: o, done: o.lessons.filter((l) => progress.lessons[l.id]).length }))
    .filter((x) => x.done > 0);
  const playedBots = bots
    .map((b) => ({ bot: b, r: recordAgainst(progress, b.id) }))
    .filter((x) => x.r.wins + x.r.losses + x.r.draws > 0);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: (RNStatusBar.currentHeight ?? 40) + space.md }]}
    >
      <Text style={styles.title}>{t('profile.title')}</Text>

      <View style={styles.grid}>
        <Stat icon="streak" value={currentStreak(progress, today)} label={t('profile.streakDays', { best: progress.streak.best })} />
        <Stat icon="coin" value={progress.coins} label={t('profile.coins')} />
        <Stat value={`${lessonsDone}/${unitLessons.length}`} label={t('profile.lessons')} />
        <Stat value={puzzlesSolved} label={t('profile.puzzlesSolved')} />
      </View>

      <Text style={styles.section}>{t('profile.openings')}</Text>
      {startedOpenings.length === 0 ? (
        <Text style={styles.empty}>{t('profile.noOpenings')}</Text>
      ) : (
        startedOpenings.map(({ course, done }) => (
          <View key={course.id} style={styles.openingRow}>
            <Text style={styles.rowLabel} numberOfLines={1}>
              {course.name}
            </Text>
            <View style={styles.openingBar}>
              <ProgressBar value={done / course.lessons.length} />
              <Text style={styles.count}>
                {done}/{course.lessons.length}
              </Text>
            </View>
          </View>
        ))
      )}

      <Text style={styles.section}>{t('profile.botGames')}</Text>
      {playedBots.length === 0 ? (
        <Text style={styles.empty}>{t('profile.noBotGames')}</Text>
      ) : (
        playedBots.map(({ bot, r }) => (
          <View key={bot.id} style={styles.botRow}>
            <BotAvatar bot={bot} size={32} />
            <Text style={[styles.rowLabel, { flex: 1 }]}>{bot.name}</Text>
            <Text style={styles.record}>
              {r.draws
                ? t('profile.recordDraws', { wins: r.wins, losses: r.losses, draws: r.draws })
                : t('profile.record', { wins: r.wins, losses: r.losses })}
            </Text>
          </View>
        ))
      )}

      <View style={{ height: space.xl }} />
      {reviewable.length > 0 && (
        <SettingRow
          label={t('common.reviewMistakes')}
          description={tn('profile.pending', reviewable.length)}
          onPress={openReview}
        />
      )}
      <SettingRow label={t('profile.pieces')} description={t('profile.pieces.description')} onPress={onOpenPieces} />
      <SettingRow label={t('profile.settings')} description={t('profile.settings.description')} onPress={onOpenSettings} />
      <SettingRow label={t('credits.title')} onPress={onOpenCredits} />
    </ScrollView>
  );
}

function Stat({ icon, value, label }: { icon?: 'streak' | 'coin'; value: number | string; label: string }) {
  return (
    <View style={styles.stat}>
      <View style={styles.statTop}>
        {icon && <StatIcon name={icon} size={20} />}
        <Text style={[styles.statValue, icon && { color: colors.gold }]}>{value}</Text>
      </View>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const card = {
  backgroundColor: colors.surface,
  borderRadius: radius.control,
  borderWidth: 2,
  borderColor: colors.surfaceRaised,
  borderBottomWidth: 4,
  borderBottomColor: colors.surfaceShadow,
} as const;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  title: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.lg },
  stat: { ...card, flexBasis: '48%', flexGrow: 1, paddingVertical: space.md, paddingHorizontal: 14 },
  statTop: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  statValue: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.text },
  statLabel: { fontFamily: fonts.semibold, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  section: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.text, marginTop: space.xl, marginBottom: space.sm },
  empty: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted },
  openingRow: { ...card, paddingVertical: space.md, paddingHorizontal: 14, marginBottom: space.sm },
  openingBar: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.sm },
  rowLabel: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  count: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.textMuted },
  botRow: { ...card, flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm, paddingHorizontal: 14, marginBottom: space.sm },
  record: { fontFamily: fonts.semibold, fontSize: 12, color: colors.textMuted },
});
