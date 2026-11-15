import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { botBodySource } from '../components/BotAvatar';
import { Button3D } from '../components/Button3D';
import { CardSurface } from '../components/CardSurface';
import { ColumnScrollView } from '../components/ColumnScrollView';
import Piece from '../components/Piece';
import { statusBarTop } from '../components/statusBarTop';
import { useWideLayout } from '../components/useWideLayout';
import { Bot, BotStyle } from '../data/bots';
import { useContent } from '../data/useContent';
import { useI18n } from '../i18n/I18nContext';
import { useProgress } from '../progress/ProgressContext';
import { botWinCoins, recordAgainst, type GameRecord } from '../progress/progressStore';
import { type, colors, fonts, radius, space } from '../theme';

export type ColorChoice = 'w' | 'b' | 'random';

const CHOICES: { value: ColorChoice; label: 'common.white' | 'bots.random' | 'common.black' }[] = [
  { value: 'w', label: 'common.white' },
  { value: 'random', label: 'bots.random' },
  { value: 'b', label: 'common.black' },
];

const STYLE_COLOR: Record<BotStyle, string> = {
  tranquilo: colors.primary,
  agresivo: colors.danger,
  equilibrado: colors.gold,
  posicional: '#4FA3E0',
};

const STYLE_LIGHT: Record<BotStyle, string> = {
  tranquilo: 'rgba(129, 182, 76, 0.28)',
  agresivo: 'rgba(250, 65, 45, 0.28)',
  equilibrado: 'rgba(247, 198, 49, 0.28)',
  posicional: 'rgba(79, 163, 224, 0.28)',
};

type Props = {
  bot: Bot;
  onPlay: (userColor: 'w' | 'b') => void;
  onBack: () => void;
  /** Retoma la partida sin terminar con este bot. */
  onContinue: () => void;
  onOpenCourse: (courseId: string) => void;
  /** Practica la apertura contra el bot que la conoce, con el color del curso. */
  onPractice: (courseId: string, color: 'w' | 'b') => void;
};

/**
 * Ficha del bot (spec de la ficha, 14-11-2026): cuerpo entero con luz del estilo y saludo, quién es,
 * tus partidas contra él, elección de color y acceso a sus aperturas y a la práctica.
 */
export function BotDetailScreen({ bot, onPlay, onBack, onContinue, onOpenCourse, onPractice }: Props) {
  const { findOpening, bots } = useContent();
  const { progress } = useProgress();
  const { t, number } = useI18n();
  const wide = useWideLayout();
  const [choice, setChoice] = useState<ColorChoice>('w');

  const sorted = [...bots].sort((a, b) => a.elo - b.elo);
  const position = sorted.findIndex((b) => b.id === bot.id) + 1;
  const styleColor = STYLE_COLOR[bot.style];
  const record = recordAgainst(progress, bot.id);
  const recent = progress.games.filter((g) => g.botId === bot.id && !g.practiceCourseId).slice(0, 5);
  const ongoing = progress.ongoingGame?.botId === bot.id ? progress.ongoingGame : undefined;
  const ongoingTurn = ongoing ? (ongoing.moves.length % 2 === 0 ? 'w' : 'b') : undefined;

  const openings = [
    ...bot.repertoire.white.map((id) => ({ id, color: 'w' as const })),
    ...bot.repertoire.black.map((id) => ({ id, color: 'b' as const })),
  ];
  const practice = openings.find((o) => findOpening(o.id));

  const play = () => onPlay(choice === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : choice);
  const body = botBodySource(bot.id);

  const resultWord = (g: GameRecord) =>
    t(g.result === 'win' ? 'bots.result.win' : g.result === 'loss' ? 'bots.result.loss' : 'bots.result.draw');

  return (
    <ColumnScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: statusBarTop(space.sm) }]}
    >
      <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel={t('bots.backLabel')} hitSlop={12}>
        <Text style={styles.back}>{t('bots.back')}</Text>
      </Pressable>

      <View style={[styles.cols, !wide && styles.colsNarrow]}>
        {/* Izquierda: el personaje */}
        <View style={[styles.left, !wide && styles.leftNarrow]}>
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>«{bot.lines.greeting}»</Text>
          </View>
          <Svg width={22} height={12} viewBox="0 0 22 12" style={styles.tail}>
            <Path d="M0 0h22L11 12Z" fill="#FFFFFF" />
          </Svg>
          <View style={styles.character}>
            <View style={[styles.light, { backgroundColor: STYLE_LIGHT[bot.style] }]} />
            {body ? (
              <Image
                source={body}
                style={{ width: wide ? 250 : 180, height: wide ? 400 : 260 }}
                resizeMode="contain"
                accessible
                accessibilityLabel={bot.name}
              />
            ) : null}
            <View style={styles.floor} />
          </View>
        </View>

        {/* Derecha: quién es y cómo te fue */}
        <View style={styles.right}>
          <Text style={[styles.kicker, { color: styleColor }]}>{t('bots.number', { n: position, total: sorted.length })}</Text>
          <Text style={styles.name}>{bot.name}</Text>
          <Text style={styles.tagline}>{bot.tagline}</Text>

          <View style={styles.chips}>
            <LevelChip elo={bot.elo} label={t('common.level', { n: number(bot.elo) })} />
            <View style={[styles.styleChip, { borderColor: styleColor }]}>
              <Text style={[styles.styleChipText, { color: styleColor }]}>{t(`botStyle.${bot.style}`)}</Text>
            </View>
          </View>

          <Text style={styles.trait}>{bot.trait}</Text>

          <View style={[styles.cards, !wide && styles.colsNarrow]}>
            <CardSurface style={styles.smallCard} radius={radius.control}>
              <Text style={styles.cardLabel}>{t('bots.teaches')}</Text>
              <Text style={styles.cardText}>{bot.teaches}</Text>
            </CardSurface>
            <CardSurface style={styles.smallCard} radius={radius.control}>
              <Text style={styles.cardLabel}>{t('bots.openings')}</Text>
              {openings.length === 0 ? (
                <Text style={styles.cardText}>{t('bots.noBook')}</Text>
              ) : (
                openings.map((o) => (
                  <Pressable
                    key={`${o.color}-${o.id}`}
                    onPress={() => onOpenCourse(o.id)}
                    accessibilityRole="link"
                    accessibilityLabel={`${t('bots.openings')}: ${findOpening(o.id)?.name ?? o.id}`}
                    style={styles.openingRow}
                  >
                    <View style={[styles.openingDot, o.color === 'w' ? styles.dotWhite : styles.dotBlack]} />
                    <Text style={styles.openingName} numberOfLines={1}>
                      {findOpening(o.id)?.name ?? o.id}
                    </Text>
                  </Pressable>
                ))
              )}
            </CardSurface>
          </View>

          <CardSurface style={styles.gamesCard} radius={radius.control}>
            <Text style={styles.cardLabel}>{t('bots.myGames', { name: bot.name })}</Text>
            <View style={styles.recordRow}>
              <RecordCell value={record.wins} label={t('bots.won')} gold />
              <RecordCell value={record.losses} label={t('bots.lost')} />
              <RecordCell value={record.draws} label={t('bots.drawn')} />
              <View
                style={styles.dots}
                accessible
                accessibilityLabel={t('bots.lastGames', { results: recent.map(resultWord).join(', ') || t('bots.noGamesShort') })}
              >
                {recent.map((g, i) => (
                  <View
                    key={i}
                    style={[styles.dot, g.result === 'win' ? styles.dotWin : g.result === 'draw' ? styles.dotDraw : styles.dotLoss]}
                  />
                ))}
              </View>
            </View>
            {recent.length === 0 && (
              <Text style={styles.cardText}>{t('bots.noGames', { name: bot.name, coins: number(botWinCoins(bot.elo)) })}</Text>
            )}
            {ongoing && (
              <View style={styles.ongoingRow}>
                <Text style={styles.ongoingText}>
                  {[
                    t('bots.ongoing', { n: number(Math.ceil(ongoing.moves.length / 2)) }),
                    ongoingTurn === ongoing.userColor ? t('bots.yourTurn') : t('bots.rivalTurn', { name: bot.name }),
                  ].join(' · ')}
                </Text>
                <Button3D label={t('common.continue')} variant="secondary" onPress={onContinue} style={styles.continueBtn} />
              </View>
            )}
          </CardSurface>

          <Text style={styles.playLabel}>{t('bots.youPlay')}</Text>
          <View style={[styles.playRow, !wide && styles.playColumn]}>
            <View style={styles.colors}>
              {CHOICES.map((c) => {
                const selected = c.value === choice;
                return (
                  <Pressable
                    key={c.value}
                    onPress={() => setChoice(c.value)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={t(c.label)}
                    style={[styles.colorBtn, selected && styles.colorBtnSelected]}
                  >
                    <View style={c.value === 'random' ? { opacity: 0.45 } : null}>
                      <Piece type="k" color={c.value === 'b' ? 'b' : 'w'} size={30} />
                    </View>
                    <Text style={[styles.colorText, selected && { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
                      {t(c.label)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Button3D label={t('common.play')} variant="primary" onPress={play} style={styles.playBtn} />
          </View>

          {practice && (
            <Pressable
              onPress={() => onPractice(practice.id, practice.color)}
              accessibilityRole="button"
              style={styles.practiceRow}
            >
              <Text style={styles.practiceText}>
                {t('bots.prepare')}{' '}
                <Text style={styles.practiceLink}>{t('bots.practiceLink', { opening: findOpening(practice.id)?.name ?? practice.id, bot: bot.name })}</Text>
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </ColumnScrollView>
  );
}

function LevelChip({ elo, label }: { elo: number; label: string }) {
  const filled = Math.min(10, Math.max(1, Math.ceil(elo / 220)));
  return (
    <View style={styles.levelChip}>
      <Text style={styles.levelText}>{label}</Text>
      <View style={styles.segments}>
        {Array.from({ length: 10 }, (_, i) => (
          <View key={i} style={[styles.segment, i < filled && styles.segmentOn]} />
        ))}
      </View>
    </View>
  );
}

function RecordCell({ value, label, gold }: { value: number; label: string; gold?: boolean }) {
  return (
    <View style={styles.recordCell}>
      <Text style={[styles.recordValue, gold && { color: colors.gold }]}>{value}</Text>
      <Text style={styles.recordLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  back: { fontFamily: fonts.bold, fontSize: type.secondary, color: colors.textMuted, marginBottom: space.sm },
  cols: { flexDirection: 'row', gap: space.xxl, alignItems: 'flex-start' },
  colsNarrow: { flexDirection: 'column', gap: space.lg },
  left: { width: 360, alignItems: 'center' },
  leftNarrow: { width: '100%' },
  bubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    maxWidth: 360,
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    zIndex: 2,
  },
  bubbleText: { fontFamily: fonts.bold, fontSize: type.body, color: '#262421', lineHeight: 22 },
  tail: { marginTop: -2, marginBottom: -2, zIndex: 1 },
  character: { alignItems: 'center', justifyContent: 'flex-end', position: 'relative', marginTop: -4 },
  light: { position: 'absolute', width: 300, height: 300, borderRadius: 150, top: 30 },
  floor: { width: 140, height: 14, borderRadius: 7, backgroundColor: 'rgba(0, 0, 0, 0.35)', marginTop: -10 },
  right: { flex: 1, minWidth: 0 },
  kicker: { fontFamily: fonts.extrabold, fontSize: type.caption, letterSpacing: 1, textTransform: 'uppercase' },
  name: { fontFamily: fonts.extrabold, fontSize: 40, lineHeight: 44, color: colors.text, marginTop: 2 },
  tagline: { fontFamily: fonts.bold, fontSize: 18, color: colors.textMuted, marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md },
  levelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: space.md,
  },
  levelText: { fontFamily: fonts.extrabold, fontSize: type.secondary, color: colors.text },
  segments: { flexDirection: 'row', gap: 2 },
  segment: { width: 4, height: 10, borderRadius: 1, backgroundColor: colors.surfaceRaised },
  segmentOn: { backgroundColor: colors.gold },
  styleChip: { borderWidth: 2, borderRadius: 999, paddingVertical: 6, paddingHorizontal: space.md },
  styleChipText: { fontFamily: fonts.extrabold, fontSize: type.secondary },
  trait: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 23, color: colors.text, marginTop: space.md },
  cards: { flexDirection: 'row', gap: space.md, marginTop: space.lg, alignItems: 'stretch' },
  smallCard: { flex: 1, padding: space.md },
  cardLabel: { fontFamily: fonts.extrabold, fontSize: type.caption, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  cardText: { fontFamily: fonts.bold, fontSize: type.secondary, color: colors.text, lineHeight: 20, marginTop: space.xs },
  openingRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 3 },
  openingDot: { width: 12, height: 12, borderRadius: 3, borderWidth: 1, borderColor: colors.outline },
  dotWhite: { backgroundColor: '#FFFFFF' },
  dotBlack: { backgroundColor: '#111111' },
  openingName: { flex: 1, fontFamily: fonts.bold, fontSize: type.secondary, color: colors.primary, textDecorationLine: 'underline' },
  gamesCard: { padding: space.md, marginTop: space.md },
  recordRow: { flexDirection: 'row', alignItems: 'center', marginTop: space.sm },
  recordCell: { alignItems: 'center', marginRight: space.xl },
  recordValue: { fontFamily: fonts.extrabold, fontSize: 28, color: colors.text },
  recordLabel: { fontFamily: fonts.semibold, fontSize: type.caption, color: colors.textMuted },
  dots: { flexDirection: 'row', gap: 6, marginLeft: 'auto' },
  dot: { width: 12, height: 12, borderRadius: 6 },
  dotWin: { backgroundColor: colors.gold },
  dotLoss: { backgroundColor: colors.outline },
  dotDraw: { backgroundColor: colors.textMuted },
  ongoingRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.md },
  ongoingText: { flex: 1, fontFamily: fonts.bold, fontSize: type.secondary, color: colors.text },
  continueBtn: { paddingVertical: 8 },
  playLabel: { fontFamily: fonts.extrabold, fontSize: type.caption, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: space.lg },
  playRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.sm },
  playColumn: { flexDirection: 'column', alignItems: 'stretch' },
  colors: { flexDirection: 'row', gap: space.sm, flex: 2 },
  colorBtn: {
    flex: 1,
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    backgroundColor: colors.surface,
  },
  colorBtnSelected: { borderColor: colors.primary, backgroundColor: colors.surfaceRaised },
  colorText: { fontFamily: fonts.extrabold, fontSize: type.secondary, color: colors.textMuted },
  playBtn: { flex: 1, minHeight: 64, justifyContent: 'center' },
  practiceRow: { marginTop: space.md, alignSelf: 'flex-end' },
  practiceText: { fontFamily: fonts.bold, fontSize: type.secondary, color: colors.textMuted },
  practiceLink: { fontFamily: fonts.extrabold, color: colors.text },
});
