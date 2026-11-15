import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BotAvatar } from '../../components/BotAvatar';
import { Button3D } from '../../components/Button3D';
import { CardSurface } from '../../components/CardSurface';
import { ColumnScrollView, useColumnBarPadding } from '../../components/ColumnScrollView';
import { statusBarTop } from '../../components/statusBarTop';
import { useWideLayout } from '../../components/useWideLayout';
import type { Bot } from '../../data/bots';
import { useI18n } from '../../i18n/I18nContext';
import type { Review } from '../../review/types';
import { colors, fonts, radius, space, type } from '../../theme';
import { AccuracyRing } from './AccuracyRing';
import { Badge, CAT_KEY, CATS, countCats, QUALITY_STYLE } from './quality';

/** Una fila de «Momentos clave», armada por la pantalla con el comentario ya traducido. */
export type SummaryMoment = {
  /** Índice en `review.plies` (0 = primera jugada). */
  index: number;
  san: string;
  badge: Badge | null;
  color: string;
  quality: string;
  text: string;
  /** Diferencia de evaluación ya formateada («+0,8», «−2,3»). */
  diff: string;
  aria: string;
};

type Props = {
  top: React.ReactNode;
  review: Review;
  me: 'w' | 'b';
  /** false en un PGN sin usuario: las columnas son «Blancas» y «Negras», no «Tú» y «Rival». */
  meKnown: boolean;
  nameOf: (c: 'w' | 'b') => string;
  decimal: string;
  coach: Bot;
  moments: SummaryMoment[];
  /** Se viene de terminar la revisión: se avisa arriba. */
  finished: boolean;
  onChangeCoach: () => void;
  onStart: () => void;
  /** Abre el quiz de puntos de giro; sin errores del usuario no hay botón. */
  onPractice?: () => void;
  onJump: (index: number) => void;
};

/**
 * Resumen previo a la revisión (spec 2026-11-15, sección 2): dos tarjetas con la partida (anillos de precisión,
 * resultado y tabla de calidades) y los momentos clave; el comentarista se elige desde acá.
 */
export function SummaryView({ top, review, me, meKnown, nameOf, decimal, coach, moments, finished, onChangeCoach, onStart, onPractice, onJump }: Props) {
  const { t, tn } = useI18n();
  const wide = useWideLayout();
  const barPadding = useColumnBarPadding();
  const counts = { w: countCats(review.plies, 'w'), b: countCats(review.plies, 'b') };
  // Sin bando conocido las columnas son las blancas y las negras, en ese orden.
  const left = meKnown ? me : 'w';
  const right = meKnown ? (me === 'w' ? 'b' : 'w') : 'b';
  const labels = meKnown ? { left: t('game.you'), right: t('review.rival') } : { left: t('common.white'), right: t('common.black') };
  const ringSize = wide ? 120 : 96;
  const pct = (v: number) => v.toFixed(1).replace('.', decimal);
  const last = review.plies[review.plies.length - 1];
  const result = review.game.result === '1/2-1/2' ? '½–½' : review.game.result.replace('-', '–');
  const side = (c: 'w' | 'b') => (
    <View style={styles.player}>
      <AccuracyRing
        value={review.accuracy[c]}
        size={ringSize}
        color={meKnown && c === me ? colors.primary : colors.textMuted}
        caption={t('review.accuracy')}
        decimal={decimal}
        ariaLabel={meKnown && c === me ? t('review.accuracyYou', { pct: pct(review.accuracy[c]) }) : t('review.accuracyRival', { name: nameOf(c), pct: pct(review.accuracy[c]) })}
      />
      <Text style={styles.playerName} numberOfLines={1}>
        {nameOf(c)}
      </Text>
      <Text style={styles.playerColor}>{t(c === 'w' ? 'common.white' : 'common.black')}</Text>
    </View>
  );

  return (
    <View style={styles.screen}>
      <ColumnScrollView contentContainerStyle={[styles.content, { paddingTop: statusBarTop(space.sm), paddingBottom: wide ? space.xxl : 96 }]}>
        {top}
        {finished && (
          <Text style={styles.finished} accessibilityLiveRegion="polite">
            {t('review.finishedReview')}
          </Text>
        )}
        <View style={[styles.columns, wide && styles.columnsWide]}>
          <CardSurface style={[styles.card, wide && styles.cardWide]} radius={22}>
            <Text style={styles.kicker}>{t('review.title').toUpperCase()}</Text>
            <View style={styles.players}>
              {side(left)}
              <View style={styles.resultMid}>
                <Text style={styles.result}>{result}</Text>
                {last?.move.san.endsWith('#') && <Text style={styles.resultSub}>{t('game.reason.checkmate')}</Text>}
                <Text style={styles.resultSub}>{tn('analysis.moves', review.plies.length)}</Text>
              </View>
              {side(right)}
            </View>

            <View style={styles.catTable}>
              <View style={styles.catHead}>
                <View style={{ flex: 1 }} />
                <Text style={[styles.catCount, styles.catHeadText]} numberOfLines={1}>
                  {labels.left}
                </Text>
                <View style={{ width: 30 }} />
                <Text style={[styles.catCount, styles.catHeadText]} numberOfLines={1}>
                  {labels.right}
                </Text>
              </View>
              {CATS.map((id) => {
                const { color, label } = QUALITY_STYLE[id];
                const mine = counts[left][id];
                const theirs = counts[right][id];
                return (
                  <View key={id} style={styles.catRow}>
                    <Text style={styles.catLabel} numberOfLines={1}>
                      {t(CAT_KEY[id])}
                    </Text>
                    <Text style={[styles.catCount, mine > 0 ? { color } : styles.zero]}>{mine}</Text>
                    <View style={[styles.catIcon, { backgroundColor: color }]}>
                      <Text style={styles.catGlyph}>{label}</Text>
                    </View>
                    <Text style={[styles.catCount, theirs > 0 ? { color } : styles.zero]}>{theirs}</Text>
                  </View>
                );
              })}
            </View>
          </CardSurface>

          <CardSurface style={[styles.card, wide && styles.cardWide]} radius={22}>
            <Text style={styles.kicker}>{t('review.moments.title').toUpperCase()}</Text>
            <Text style={styles.sub}>{t('review.moments.sub')}</Text>
            {moments.length > 0 ? (
              <View style={styles.moments}>
                {moments.map((m) => (
                  <Pressable key={m.index} onPress={() => onJump(m.index)} accessibilityRole="button" accessibilityLabel={m.aria} style={styles.moment}>
                    {m.badge ? (
                      <View style={[styles.momentBadge, { backgroundColor: m.color }]}>
                        <Text style={styles.momentGlyph}>{m.badge.label}</Text>
                      </View>
                    ) : (
                      <View style={{ width: 28 }} />
                    )}
                    <View style={styles.momentBody}>
                      <View style={styles.momentHead}>
                        <Text style={styles.momentMove} numberOfLines={1}>
                          {m.san}
                        </Text>
                        <Text style={[styles.momentQuality, { color: m.color }]} numberOfLines={1}>
                          {m.quality}
                        </Text>
                        <Text style={[styles.momentDiff, { color: m.color }]}>{m.diff}</Text>
                      </View>
                      <Text style={styles.momentText} numberOfLines={2}>
                        {m.text}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={styles.none}>{t('review.moments.none')}</Text>
            )}

            <View style={styles.coachRow}>
              <BotAvatar bot={coach} size={40} />
              <Text style={styles.coachText} numberOfLines={2}>
                {t('review.explains', { bot: coach.name })}
              </Text>
              <Pressable onPress={onChangeCoach} accessibilityRole="button" hitSlop={8}>
                <Text style={styles.change}>{t('review.change')}</Text>
              </Pressable>
            </View>

            <Button3D label={t('review.start')} variant="primary" onPress={onStart} style={{ marginTop: space.md }} />
            {onPractice && <Button3D label={t('quiz.title')} variant="secondary" onPress={onPractice} style={{ marginTop: space.sm }} />}
          </CardSurface>
        </View>
      </ColumnScrollView>

      {!wide && (
        <View style={[styles.bottomBar, barPadding]}>
          <Button3D label={t('review.start')} variant="primary" onPress={onStart} style={{ flex: 1 }} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  finished: { fontFamily: fonts.extrabold, fontSize: type.body, color: colors.gold, marginTop: space.sm },
  columns: { gap: space.lg, marginTop: space.sm },
  columnsWide: { flexDirection: 'row', alignItems: 'flex-start' },
  card: { padding: space.lg },
  cardWide: { flex: 1, minWidth: 0 },
  kicker: { fontFamily: fonts.extrabold, fontSize: type.caption, color: colors.textMuted, letterSpacing: 1 },
  players: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.md, gap: space.sm },
  player: { flex: 1, minWidth: 0, alignItems: 'center', gap: 2 },
  playerName: { fontFamily: fonts.extrabold, fontSize: type.body, color: colors.text, marginTop: space.xs },
  playerColor: { fontFamily: fonts.bold, fontSize: type.secondary, color: colors.textMuted },
  resultMid: { alignItems: 'center', minWidth: 78 },
  result: { fontFamily: fonts.extrabold, fontSize: 30, color: colors.gold },
  resultSub: { fontFamily: fonts.semibold, fontSize: type.caption, color: colors.textMuted, textAlign: 'center' },
  catTable: { marginTop: space.lg },
  catHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  catHeadText: { color: colors.textMuted, fontSize: type.caption },
  catRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3 },
  catLabel: { flex: 1, fontFamily: fonts.bold, fontSize: type.secondary, color: colors.text },
  catCount: { width: 34, textAlign: 'right', fontFamily: fonts.extrabold, fontSize: type.secondary },
  zero: { color: '#5a5753' },
  catIcon: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  catGlyph: { fontFamily: fonts.extrabold, fontSize: 12, color: '#FFFFFF' },
  sub: { fontFamily: fonts.semibold, fontSize: type.secondary, color: colors.textMuted, marginTop: 4, lineHeight: 18 },
  moments: { marginTop: space.md, gap: space.sm },
  moment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: radius.control,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  momentBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  momentGlyph: { fontFamily: fonts.extrabold, fontSize: 13, color: '#FFFFFF' },
  momentBody: { flex: 1, minWidth: 0 },
  momentHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  momentMove: { fontFamily: fonts.extrabold, fontSize: type.secondary, color: colors.text },
  momentQuality: { fontFamily: fonts.bold, fontSize: type.caption, flexShrink: 1 },
  momentDiff: { fontFamily: fonts.extrabold, fontSize: type.caption, marginLeft: 'auto' },
  momentText: { fontFamily: fonts.semibold, fontSize: type.caption, color: colors.textMuted, marginTop: 1 },
  none: { fontFamily: fonts.semibold, fontSize: type.secondary, color: colors.textMuted, marginTop: space.md, lineHeight: 18 },
  coachRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.md },
  coachText: { flex: 1, fontFamily: fonts.bold, fontSize: type.secondary, color: colors.text },
  change: { fontFamily: fonts.extrabold, fontSize: type.secondary, color: colors.primary },
  bottomBar: { paddingHorizontal: space.lg, paddingVertical: space.sm },
});
