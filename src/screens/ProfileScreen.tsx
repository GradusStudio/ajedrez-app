import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AchievementMedal } from '../components/AchievementMedal';
import { BotAvatar } from '../components/BotAvatar';
import { CardSurface } from '../components/CardSurface';
import { ColumnScrollView } from '../components/ColumnScrollView';
import { ProfileUnitCard } from '../components/ProfileUnitCard';
import { RatingChart } from '../components/RatingChart';
import { StatIcon } from '../components/StatIcon';
import { StreakFlame, flameStateOf } from '../components/StreakFlame';
import { TabIcon } from '../components/TabIcon';
import { statusBarTop } from '../components/statusBarTop';
import { useWideLayout } from '../components/useWideLayout';
import { useContent } from '../data/useContent';
import { useI18n } from '../i18n/I18nContext';
import progressGamesRaw from '../data/progressGames.json';
import { achievementCount, achievements, newAchievements, type AchievementId } from '../progress/achievements';
import { currentRating, formatDelta } from '../progress/puzzleRating';
import { weekRatingDelta } from '../puzzles/puzzleView';
import { currentStreak, isPuzzleSolved, streakStatusNow } from '../progress/progressStore';
import { piecesFromFen, progressPosition, type ProgressGamesFile } from '../progress/progressGame';
import { useProgress } from '../progress/ProgressContext';
import { useSettings } from '../settings/SettingsContext';
import { useTodayKey } from '../settings/useTodayKey';
import { botRecords, profileSummary, unitCards } from '../profile/profileView';
import { cardSkin, type, colors, fonts, radius, space } from '../theme';

const progressGames = (progressGamesRaw as unknown as ProgressGamesFile).units;

/** Símbolo de cada medalla (texto corto; la cinta y el color los pone AchievementMedal). */
const SYMBOL: Record<AchievementId, string> = {
  firstLesson: '1',
  unit1: 'I',
  unit2: 'II',
  unit3: 'III',
  fiveClean: '✓',
  streak3: '3',
  streak7: '7',
  streak30: '30',
  puzzles10: '10',
  puzzles100: '100',
  rating1500: '1500',
  botFirst: '♟',
  botFive: '♞',
  beatAda: '♛',
  course1: '1',
  course3: '3',
  turningPoint: '↺',
  collector: '★',
};

type Props = {
  onOpenSettings: () => void;
  onOpenBotGames: () => void;
  /** Abre el repaso de los errores guardados de una lección. */
  onOpenReview: (lessonId: string, stepIds: string[]) => void;
  /** Abre Aprender en esa unidad. */
  onOpenUnit: (unit: number) => void;
  /** Abre la ficha de un bot. */
  onOpenBot: (botId: string) => void;
  onOpenPuzzles: () => void;
};

/**
 * Perfil nuevo (spec del perfil, 14-11-2026): resumen, camino en Aprender, nivel de puzzles con gráfico,
 * récord contra los bots, logros y accesos. Sin avatar ni nombre: el perfil es el progreso.
 */
export function ProfileScreen({ onOpenSettings, onOpenBotGames, onOpenReview, onOpenUnit, onOpenBot, onOpenPuzzles }: Props) {
  const { progress } = useProgress();
  const { settings, update } = useSettings();
  const { openings, units, bots, findLesson } = useContent();
  const { t, tn, number } = useI18n();
  const wide = useWideLayout();
  const today = useTodayKey();

  const streak = currentStreak(progress, today);
  const summary = profileSummary(progress, units, openings);
  const cards = unitCards(units, progress, progress.profile.level, settings.openAllUnits);
  const { records, nextRival } = botRecords(bots, progress.games);
  const list = achievements(progress, { units, openings, bots });
  const count = achievementCount(list);
  // Los recién ganados se ven con «Nuevo» en esta visita y quedan marcados para la próxima.
  const [fresh] = useState(() => newAchievements(list, settings.seenAchievements));
  const marked = useRef(false);
  useEffect(() => {
    if (marked.current || fresh.length === 0) return;
    marked.current = true;
    update({ seenAchievements: [...settings.seenAchievements, ...fresh] });
  }, [fresh, settings.seenAchievements, update]);

  const rating = currentRating(progress);
  const history = progress.puzzleRating?.history ?? [];
  const chart = history.slice(-40);
  // La misma ventana de siete días que la pestaña Puzzles (antes eran ocho y la etiqueta decía siete).
  const deltaWeek = weekRatingDelta(history, rating, new Date(`${today}T12:00:00`));
  const bestRating = Math.max(rating, ...history.map((p) => p.rating));
  const cleanPuzzles = Object.values(progress.puzzles).filter((p) => p.result === 'clean').length;
  const puzzlesSolved = Object.keys(progress.puzzles).filter((id) => isPuzzleSolved(progress, id)).length;
  const beaten = records.filter((r) => r.beaten).length;

  const reviewable = progress.mistakes.filter((m) => findLesson(m.lessonId)?.steps.some((s) => s.id === m.stepId));
  const openReview = () => {
    const { lessonId } = reviewable[0];
    onOpenReview(lessonId, reviewable.filter((m) => m.lessonId === lessonId).map((m) => m.stepId));
  };

  const stateText = (state: 'complete' | 'current' | 'locked' | null) =>
    state === 'complete' ? t('profile.unit.complete') : state === 'current' ? t('profile.unit.current') : state === 'locked' ? t('profile.unit.locked') : '';

  return (
    <ColumnScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: statusBarTop(space.md) }]}
    >
      <Text accessibilityRole="header" aria-level={1} style={styles.title}>{t('profile.title')}</Text>

      {/* 1. Resumen */}
      <View style={styles.summary}>
        <Summary icon={<StreakFlame state={flameStateOf(streakStatusNow(progress, today).kind)} size={26} pulse={false} />} value={number(streak)} label={t('profile.streakDays', { best: progress.streak.best })} />
        <Summary icon={<StatIcon name="coin" size={24} />} value={number(progress.coins)} label={t('profile.coins')} gold />
        <Summary icon={<TabIcon name="learn" color={colors.textMuted} size={24} />} value={`${number(summary.lessonsDone)}/${number(summary.lessonsTotal)}`} label={t('profile.lessons')} />
        {settings.showPuzzleRating ? (
          <Summary icon={<TabIcon name="puzzles" color={colors.textMuted} size={24} />} value={number(rating)} label={t('profile.puzzleLevel')} gold />
        ) : (
          <Summary icon={<TabIcon name="puzzles" color={colors.textMuted} size={24} />} value={number(puzzlesSolved)} label={t('profile.puzzlesSolved')} />
        )}
      </View>

      {/* 2. Tu camino en Aprender */}
      <CardSurface style={styles.card} radius={20}>
        <View style={styles.cardHead}>
          <Text accessibilityRole="header" aria-level={2} style={styles.cardTitle}>{t('profile.path.title')}</Text>
          <Text style={styles.cardAside}>{t('profile.path.count', { done: number(summary.lessonsDone), total: number(summary.lessonsTotal) })}</Text>
        </View>
        <View style={[styles.unitGrid, !wide && styles.unitGridNarrow]}>
          {cards.map((card) => {
            const game = progressGames[String(card.unit.unit)] ?? { moves: [], side: 'w' as const };
            const position = progressPosition(game, card.done, card.total);
            const kicker = [t('profile.unit.kicker', { n: card.unit.unit }), stateText(card.state)].filter(Boolean).join(' · ');
            const lessonsCount = t('profile.unit.lessons', { done: card.done, total: card.total });
            const label = [t('profile.unit.kicker', { n: card.unit.unit }), card.unit.title, stateText(card.state), lessonsCount]
              .filter(Boolean)
              .join(', ');
            return (
              <View key={card.unit.unit} style={[styles.unitCell, !wide && styles.unitCellNarrow]}>
                <ProfileUnitCard
                  card={card}
                  pieces={piecesFromFen(position.fen)}
                  lastMove={position.lastMove}
                  kicker={kicker}
                  count={lessonsCount}
                  label={label}
                  onPress={() => onOpenUnit(card.unit.unit)}
                />
              </View>
            );
          })}
        </View>
      </CardSurface>

      <View style={styles.pair}>
        {/* 3. Nivel de puzzles */}
        <CardSurface style={styles.card} radius={20}>
          <Text accessibilityRole="header" aria-level={2} style={styles.cardTitle}>{t('profile.rating.title')}</Text>
          {settings.showPuzzleRating ? (
            <>
              <View style={styles.ratingTop}>
                <Text style={styles.ratingNumber}>{number(rating)}</Text>
                {deltaWeek !== 0 && (
                  <Text style={[styles.ratingDelta, deltaWeek < 0 && styles.ratingDeltaDown]}>
                    {deltaWeek > 0 ? '▲' : '▼'} {t('profile.rating.change', { delta: formatDelta(deltaWeek).replace(/^[+−]/, '') })}
                  </Text>
                )}
              </View>
              {chart.length >= 3 ? (
                <RatingChart
                  points={chart}
                  label={t('profile.rating.label', { from: number(chart[0].rating), to: number(chart[chart.length - 1].rating), n: chart.length })}
                />
              ) : (
                <>
                  <Text style={styles.muted}>{t('profile.rating.empty')}</Text>
                  <Pressable onPress={onOpenPuzzles} accessibilityRole="button" style={styles.linkBtn}>
                    <Text style={styles.link}>{t('profile.rating.goPuzzles')}</Text>
                  </Pressable>
                </>
              )}
              <Text style={styles.footer}>
                {[
                  t('profile.rating.solved', { n: number(puzzlesSolved) }),
                  t('profile.rating.clean', { n: number(cleanPuzzles) }),
                  t('profile.rating.best', { n: number(bestRating) }),
                ].join(' · ')}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.ratingNumber}>{number(puzzlesSolved)}</Text>
              <Text style={styles.muted}>{t('profile.puzzlesSolved')}</Text>
              <Pressable onPress={onOpenPuzzles} accessibilityRole="button" style={styles.linkBtn}>
                <Text style={styles.link}>{t('profile.rating.goPuzzles')}</Text>
              </Pressable>
            </>
          )}
        </CardSurface>

        {/* 4. Contra los bots */}
        <CardSurface style={styles.card} radius={20}>
          <View style={styles.cardHead}>
            <Text accessibilityRole="header" aria-level={2} style={styles.cardTitle}>{t('profile.bots.title')}</Text>
            <Text style={styles.cardAside}>{t('profile.bots.count', { beaten, total: records.length })}</Text>
          </View>
          <View style={styles.botGrid}>
            {records.map((r) => {
              const isNext = nextRival?.bot.id === r.bot.id;
              return (
                <Pressable
                  key={r.bot.id}
                  onPress={() => onOpenBot(r.bot.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`${r.bot.name}. ${t('profile.bots.recordLabel', { wins: r.wins, draws: r.draws, losses: r.losses })}`}
                  style={styles.botCell}
                >
                  <View style={[styles.avatarRing, r.beaten && styles.ringGold, isNext && styles.ringNext, !r.played && styles.avatarOff]}>
                    <BotAvatar bot={r.bot} size={wide ? 56 : 48} expression="acierto" />
                  </View>
                  <Text style={styles.botName} numberOfLines={1}>{r.bot.name}</Text>
                  <Text style={[styles.botRecord, r.beaten && styles.botRecordWin]}>
                    {r.played > 0 ? t('profile.bots.record', { wins: r.wins, losses: r.losses }) : t('profile.bots.none')}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {nextRival ? (
            <Pressable onPress={() => onOpenBot(nextRival.bot.id)} accessibilityRole="button" style={styles.nextRow}>
              <Text style={styles.nextText}>
                {t('profile.bots.next', {
                  name: nextRival.bot.name,
                  level: number(nextRival.bot.elo),
                  record: t('profile.bots.record', { wins: nextRival.wins, losses: nextRival.losses }),
                })}
              </Text>
            </Pressable>
          ) : (
            <Text style={styles.muted}>{t('profile.bots.allBeaten')}</Text>
          )}
        </CardSurface>
      </View>

      {/* 5. Logros */}
      <CardSurface style={styles.card} radius={20}>
        <View style={styles.cardHead}>
          <Text accessibilityRole="header" aria-level={2} style={styles.cardTitle}>{t('profile.achievements.title')}</Text>
          <Text style={styles.cardAside}>{t('profile.achievements.count', { earned: count.earned, total: count.total })}</Text>
        </View>
        <View style={[styles.achGrid, !wide && styles.achGridNarrow]}>
          {list.map((a) => {
            const name = t(`profile.achievement.${a.id}.name` as Parameters<typeof t>[0]);
            const description = t(`profile.achievement.${a.id}.description` as Parameters<typeof t>[0]);
            const progressText = a.progress && !a.earned ? `${a.progress.value}/${a.progress.goal}` : '';
            return (
              <View
                key={a.id}
                accessible
                accessibilityLabel={[t('profile.achievements.entry', { name }), a.earned ? t('profile.achievements.earned') : t('profile.achievements.locked'), progressText]
                  .filter(Boolean)
                  .join(', ')}
                style={[styles.ach, wide ? styles.achWide : styles.achNarrow]}
              >
                <View style={styles.medalWrap}>
                  <AchievementMedal color={a.color} earned={a.earned} symbol={SYMBOL[a.id]} />
                  {fresh.includes(a.id) && <Text style={styles.newTag}>{t('profile.achievements.new')}</Text>}
                </View>
                <Text style={[styles.achName, !a.earned && styles.achLocked]} numberOfLines={2}>{name}</Text>
                <Text style={[styles.achDesc, !a.earned && styles.achLocked]} numberOfLines={2}>{description}</Text>
                {!!progressText && <Text style={styles.achProgress}>{progressText}</Text>}
              </View>
            );
          })}
        </View>
      </CardSurface>

      {/* 6. Accesos */}
      <View style={[styles.accessRow, !wide && styles.accessColumn]}>
        <AccessCard title={t('profile.botGames')} text={t('profile.botGames.description')} onPress={onOpenBotGames} />
        {reviewable.length > 0 && (
          <AccessCard title={t('common.reviewMistakes')} text={tn('profile.pending', reviewable.length)} onPress={openReview} />
        )}
        <AccessCard title={t('profile.settings')} text={t('profile.settings.description')} onPress={onOpenSettings} />
      </View>
    </ColumnScrollView>
  );
}

function AccessCard({ title, text, onPress }: { title: string; text: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${title}. ${text}`} style={styles.accessCard}>
      <Text style={styles.accessTitle}>{title}</Text>
      <Text style={styles.accessText}>{text}</Text>
    </Pressable>
  );
}

function Summary({ icon, value, label, gold }: { icon: React.ReactNode; value: React.ReactNode; label: string; gold?: boolean }) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryTop}>
        {icon}
        <Text style={[styles.summaryValue, gold && { color: colors.gold }]}>{value}</Text>
      </View>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  title: { fontFamily: fonts.extrabold, fontSize: type.title, color: colors.text },
  summary: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.lg },
  summaryCard: { ...cardSkin, borderRadius: radius.control, borderWidth: 2, flexBasis: '47%', flexGrow: 1, paddingVertical: space.md, paddingHorizontal: 14 },
  summaryTop: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  summaryValue: { fontFamily: fonts.extrabold, fontSize: 26, color: colors.text },
  summaryLabel: { fontFamily: fonts.semibold, fontSize: 14, color: colors.textMuted, marginTop: 2 },
  card: { ...cardSkin, borderRadius: 20, borderWidth: 2, padding: space.lg, marginTop: space.lg },
  cardHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: space.md },
  cardTitle: { flex: 1, fontFamily: fonts.extrabold, fontSize: 20, color: colors.text },
  cardAside: { fontFamily: fonts.bold, fontSize: type.secondary, color: colors.textMuted },
  unitGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md },
  unitGridNarrow: { flexDirection: 'column' },
  unitCell: { width: '32%' },
  unitCellNarrow: { width: '100%' },
  pair: { flexDirection: 'row', gap: space.lg, alignItems: 'flex-start' },
  ratingTop: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm, marginTop: space.sm },
  ratingNumber: { fontFamily: fonts.extrabold, fontSize: 44, lineHeight: 50, color: colors.gold },
  ratingDelta: { fontFamily: fonts.extrabold, fontSize: type.secondary, color: colors.primary },
  ratingDeltaDown: { color: colors.textMuted },
  muted: { fontFamily: fonts.bold, fontSize: type.secondary, color: colors.textMuted, marginTop: space.sm, lineHeight: 20 },
  footer: { fontFamily: fonts.semibold, fontSize: type.caption, color: colors.textMuted, marginTop: space.sm },
  linkBtn: { alignSelf: 'flex-start', marginTop: space.md, paddingVertical: 4 },
  link: { fontFamily: fonts.extrabold, fontSize: type.secondary, color: colors.primary },
  botGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: space.sm },
  botCell: { width: '20%', alignItems: 'center', paddingVertical: space.sm, gap: 2 },
  avatarRing: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  ringGold: { borderColor: colors.gold },
  ringNext: { borderColor: colors.primary },
  avatarOff: { opacity: 0.4 },
  botName: { fontFamily: fonts.bold, fontSize: 12, color: colors.text, textAlign: 'center', maxWidth: '100%' },
  botRecord: { fontFamily: fonts.semibold, fontSize: 11, color: colors.textMuted, textAlign: 'center' },
  botRecordWin: { color: colors.gold, fontFamily: fonts.extrabold },
  nextRow: { marginTop: space.sm, paddingTop: space.sm, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  nextText: { fontFamily: fonts.bold, fontSize: type.secondary, color: colors.text },
  achGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: space.lg, marginTop: space.md },
  achGridNarrow: { justifyContent: 'space-between' },
  ach: { alignItems: 'center', paddingHorizontal: 2 },
  achWide: { width: '16.6%' },
  achNarrow: { width: '32%' },
  medalWrap: { alignItems: 'center' },
  newTag: { fontFamily: fonts.extrabold, fontSize: 10, color: colors.gold, letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 2 },
  achName: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.text, textAlign: 'center', marginTop: 2 },
  achDesc: { fontFamily: fonts.semibold, fontSize: 11, color: colors.textMuted, textAlign: 'center', lineHeight: 14 },
  achLocked: { opacity: 0.55 },
  achProgress: { fontFamily: fonts.extrabold, fontSize: 11, color: colors.primary, marginTop: 2 },
  accessRow: { flexDirection: 'row', gap: space.md, marginTop: space.xl },
  accessColumn: { flexDirection: 'column' },
  accessCard: { ...cardSkin, borderRadius: radius.control, borderWidth: 2, padding: space.md, flex: 1 },
  accessTitle: { fontFamily: fonts.extrabold, fontSize: type.body, color: colors.text },
  accessText: { fontFamily: fonts.semibold, fontSize: type.caption, color: colors.textMuted, marginTop: 2 },
});
