import React, { useEffect, useMemo, useState } from 'react';
import {
  GestureResponderEvent,
  Pressable,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { Square } from 'chess.js';
import { BotAvatar } from '../components/BotAvatar';
import { BotExpression } from '../components/botFace';
import { Board } from '../components/Board';
import { Button3D } from '../components/Button3D';
import { EvalBar } from '../components/EvalBar';
import { ProgressBar } from '../components/ProgressBar';
import { Segmented } from '../components/Segmented';
import { bots, findBot } from '../data/bots';
import { EngineView } from '../engine/EngineView';
import { whiteShare } from '../engine/evalFormat';
import { UciEngine } from '../engine/uci';
import { resolveNotation, sanFromEnglish } from '../chess/notation';
import { MessageKey, useI18n } from '../i18n/I18nContext';
import { useSettings } from '../settings/SettingsContext';
import { analyzeGame } from '../review/analyze';
import { bookPositions } from '../review/book';
import { buildReview } from '../review/build';
import { coachExplanation, coachLang, coachVoice } from '../review/coachText';
import { parseGame } from '../review/pgn';
import { clearPendingGame, peekPendingGame, sideOf } from '../review/session';
import type { MoveQuality, Review, ReviewPly } from '../review/types';
import { boardHighlight, colors, fonts, radius, space } from '../theme';

type Props = { onBack: () => void };

type Filter = 'all' | 'highlights';

const COACH_KEY = '@ajedrez/reviewCoach';
const DEFAULT_COACH = 'ramiro';
const AUTOPLAY_MS = 1400;

// Insignia de cada calidad (sobre la casilla y en la lista). `good` no lleva insignia en el tablero.
const BADGE: Record<MoveQuality | 'great' | 'mate', { label: string; color: string } | null> = {
  book: { label: '≡', color: '#A88865' },
  best: { label: '★', color: '#81B64C' },
  excellent: { label: '!', color: '#96BC4B' },
  good: null,
  inaccuracy: { label: '?!', color: '#F7C631' },
  mistake: { label: '?', color: '#E8912D' },
  blunder: { label: '??', color: '#FA412D' },
  great: { label: '!', color: '#4FA3E0' },
  mate: { label: '#', color: '#81B64C' },
};

const badgeOf = (p: ReviewPly) => BADGE[p.move.san.endsWith('#') ? 'mate' : p.great ? 'great' : p.quality];

const titleKey = (p: ReviewPly): MessageKey =>
  p.move.san.endsWith('#') ? 'review.q.mate' : p.great ? 'review.q.great' : (`review.q.${p.quality}` as MessageKey);

const faceFor = (p: ReviewPly | undefined, mine: boolean): BotExpression => {
  if (!p) return 'explica';
  if (p.quality === 'blunder' || p.quality === 'mistake') return mine ? 'pista' : 'acierto';
  if (p.quality === 'inaccuracy') return 'piensa';
  return mine ? 'acierto' : 'explica';
};

const REPLY_ARROW = 'rgba(250, 65, 45, 0.85)';
const BEST_ARROW = 'rgba(129, 182, 76, 0.95)';

export function GameReviewScreen({ onBack }: Props) {
  const { t, tn, language } = useI18n();
  const { settings } = useSettings();
  const notation = resolveNotation(settings.notation, language);
  const decimal = language === 'en' ? '.' : ',';
  const fmt = (san: string) => sanFromEnglish(san, notation);

  const pending = useMemo(() => peekPendingGame(), []);
  const game = useMemo(() => (pending ? parseGame(pending.pgn) : null), [pending]);
  useEffect(() => () => clearPendingGame(), []);

  // Motor y análisis
  const [engine, setEngine] = useState<UciEngine | null>(null);
  const [engineError, setEngineError] = useState<string | null>(null);
  const [engineKey, setEngineKey] = useState(0);
  const [progress, setProgress] = useState({ done: 0, total: 1 });
  const [review, setReview] = useState<Review | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!engine || !game || review) return;
    let cancelled = false;
    analyzeGame(engine, game, (done, total) => !cancelled && setProgress({ done, total }), () => cancelled)
      .then((evals) => {
        if (!evals || cancelled) return;
        setReview(buildReview(game, evals, bookPositions()));
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      engine.stop();
    };
  }, [engine, game, review]);

  const retry = () => {
    setFailed(false);
    setEngineError(null);
    setEngine(null);
    setEngineKey((k) => k + 1);
  };

  // Vista
  const [idx, setIdx] = useState(0);
  const [filter, setFilter] = useState<Filter>('highlights');
  const [me, setMe] = useState<'w' | 'b'>(() => (game ? sideOf(pending?.username, game.white, game.black) ?? 'w' : 'w'));
  const [coachId, setCoachId] = useState(DEFAULT_COACH);
  const [showExplain, setShowExplain] = useState(false);
  const [showBest, setShowBest] = useState(false);
  const [playing, setPlaying] = useState(false);
  const { width } = useWindowDimensions();
  const graphW = Math.floor(Math.min(width - 32, 480) / 8) * 8;

  useEffect(() => {
    AsyncStorage.getItem(COACH_KEY)
      .then((id) => id && findBot(id) && setCoachId(id))
      .catch(() => {});
  }, []);

  const n = review?.plies.length ?? 0;
  const goTo = (i: number) => {
    setIdx(Math.max(0, Math.min(n, i)));
    setShowExplain(false);
    setShowBest(false);
  };
  // La reproducción automática avanza sola hasta el final de la partida.
  const autoplaying = playing && idx < n;
  useEffect(() => {
    if (!autoplaying) return;
    const id = setInterval(() => {
      setIdx((i) => Math.min(n, i + 1));
      setShowExplain(false);
      setShowBest(false);
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [autoplaying, n]);
  const togglePlay = () => {
    if (autoplaying) return setPlaying(false);
    if (idx >= n) goTo(0);
    setPlaying(true);
  };

  const chooseCoach = (id: string) => {
    setCoachId(id);
    AsyncStorage.setItem(COACH_KEY, id).catch(() => {});
  };

  const nextKey = () => {
    if (!review) return;
    if (filter === 'all') return goTo(idx + 1);
    const next = review.highlights.find((h) => h + 1 > idx);
    goTo(next === undefined ? n : next + 1);
  };
  const jumpHighlight = (dir: 1 | -1) => {
    if (!review) return;
    const hs = review.highlights.map((h) => h + 1);
    const target = dir === 1 ? hs.find((h) => h > idx) : [...hs].reverse().find((h) => h < idx);
    if (target !== undefined) goTo(target);
  };

  const onGraphPress = (e: GestureResponderEvent) => {
    if (n === 0) return;
    goTo(Math.round((e.nativeEvent.locationX / graphW) * n));
  };

  if (!game) {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: RNStatusBar.currentHeight ?? 40 }]}>
        <Text style={styles.muted}>{t('review.invalid')}</Text>
        <View style={{ height: space.lg }} />
        <Button3D label={t('review.chooseOther')} onPress={onBack} />
      </View>
    );
  }

  const header = (
    <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel={t('review.chooseOther')} hitSlop={12}>
      <Text style={styles.back}>{t('analysisMenu.back')}</Text>
    </Pressable>
  );

  // Analizando
  if (!review) {
    const down = engineError || failed;
    return (
      <View style={[styles.screen, { paddingHorizontal: space.lg, paddingTop: (RNStatusBar.currentHeight ?? 40) + space.sm }]}>
        {!down && <EngineView key={engineKey} onReady={setEngine} onError={setEngineError} />}
        {header}
        <Text style={styles.title}>{t('review.title')}</Text>
        <View style={styles.center}>
          {down ? (
            <>
              <Text style={styles.muted}>{t('analysis.engineDown')}</Text>
              <View style={{ height: space.md }} />
              <Button3D label={t('common.retry')} variant="danger" onPress={retry} />
            </>
          ) : (
            <>
              <Text style={styles.analyzing}>{t('review.analyzing')}</Text>
              <View style={{ flexDirection: 'row', width: '100%', marginVertical: space.md }}>
                <ProgressBar value={engine ? progress.done / progress.total : 0} />
              </View>
              <Text style={styles.muted}>{t('review.analyzingProgress', { done: progress.done, total: progress.total })}</Text>
              <Text style={[styles.muted, { marginTop: space.sm, textAlign: 'center' }]}>{t('review.analyzingTip')}</Text>
            </>
          )}
        </View>
      </View>
    );
  }

  // Revisión lista
  const coach = findBot(coachId) ?? bots[0];
  const ply = idx > 0 ? review.plies[idx - 1] : undefined;
  const fen = idx === 0 ? game.startFen : review.plies[idx - 1].move.fenAfter;
  const lastMove = ply
    ? { from: ply.move.uci.slice(0, 2) as Square, to: ply.move.uci.slice(2, 4) as Square }
    : null;
  const mine = ply ? ply.move.color === me : true;
  const bad = !!ply && (ply.quality === 'mistake' || ply.quality === 'blunder' || ply.quality === 'inaccuracy');
  const badge = ply ? badgeOf(ply) : null;
  const colorArrows: { move: string; color: string }[] = [];
  if (ply && bad && ply.replyUci) colorArrows.push({ move: ply.replyUci.slice(0, 4), color: REPLY_ARROW });
  if (ply && showBest && ply.bestUci) colorArrows.push({ move: ply.bestUci.slice(0, 4), color: BEST_ARROW });

  const san = ply ? fmt(ply.move.san) : '';
  const voice = ply
    ? coachVoice({
        lang: coachLang(language),
        style: coach.style,
        quality: ply.quality,
        great: ply.great,
        mate: ply.move.san.endsWith('#'),
        subject: mine ? 'you' : 'opponent',
        move: san,
        seed: ply.ply + coach.elo,
      })
    : review.highlights.length > 0
      ? `${tn('review.keyMoments', review.highlights.length)} ${t('review.startHint')}`
      : `${t('review.noKeyMoments')} ${t('review.startHint')}`;
  const explanation = ply
    ? coachExplanation({
        lang: coachLang(language),
        subject: mine ? 'you' : 'opponent',
        quality: ply.quality,
        facts: ply.facts,
        move: san,
        bestSan: ply.bestSan,
        fmt,
      })
    : [];

  const scoreHere = review.scores[idx];
  const hlPos = review.highlights.findIndex((h) => h + 1 === idx);
  const nameOf = (c: 'w' | 'b') => (c === 'w' ? game.white : game.black) || t(c === 'w' ? 'common.white' : 'common.black');

  // Gráfico: área blanca = ventaja de las blancas
  const gH = 64;
  const x = (i: number) => (n === 0 ? 0 : (i / n) * graphW);
  const y = (score: number) => gH - whiteShare(score) * gH;
  const area =
    `M0 ${gH} ` + review.scores.map((s, i) => `L${x(i).toFixed(1)} ${y(s).toFixed(1)}`).join(' ') + ` L${graphW} ${gH} Z`;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: (RNStatusBar.currentHeight ?? 40) + space.sm }]}>
      {header}
      <Text style={styles.title}>{t('review.title')}</Text>
      <Text style={styles.sub} numberOfLines={1}>
        {nameOf('w')} · {nameOf('b')} · {game.result}
      </Text>
      <View style={styles.accRow}>
        {(['w', 'b'] as const).map((c) => (
          <View key={c} style={styles.accChip}>
            <Text style={styles.accText}>
              {t('review.accuracyOf', { who: t(c === 'w' ? 'common.white' : 'common.black'), pct: Math.round(review.accuracy[c]) })}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ height: space.md }} />
      <EvalBar score={scoreHere} decimal={decimal} />
      <Board
        fen={fen}
        orientation={me}
        interactive={false}
        lastMove={lastMove}
        colorArrows={colorArrows}
        badge={ply && badge && lastMove ? { square: lastMove.to, color: badge.color, label: badge.label } : undefined}
      />

      {/* Comentarista */}
      <View style={styles.coachRow}>
        <BotAvatar bot={coach} size={64} expression={faceFor(ply, mine)} />
        <View style={styles.bubble}>
          {ply ? (
            <View style={styles.bubbleHead}>
              {badge && (
                <View style={[styles.miniBadge, { backgroundColor: badge.color }]}>
                  <Text style={styles.miniBadgeText}>{badge.label}</Text>
                </View>
              )}
              <Text style={styles.bubbleTitle} numberOfLines={2}>
                {t(titleKey(ply), { move: san })}
              </Text>
              <View style={[styles.evalChip, review.scores[idx] < 0 && { backgroundColor: '#1B1A18' }]}>
                <Text style={[styles.evalChipText, review.scores[idx] < 0 && { color: '#FFFFFF' }]}>{evalLabel(review.scores[idx], decimal)}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.bubbleTitle}>{t('review.startPosition')}</Text>
          )}
          <Text style={styles.bubbleText}>{voice}</Text>
          {showExplain && explanation.map((l, i) => (
            <Text key={i} style={styles.bubbleExplain}>
              {l}
            </Text>
          ))}
          {showBest && ply && ply.bestSan ? (
            <Text style={styles.bubbleExplain}>{t('review.bestWas', { move: fmt(ply.bestSan) })}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.actions}>
        {explanation.length > 0 && (
          <Button3D label={showExplain ? t('review.hide') : t('review.explain')} onPress={() => setShowExplain((v) => !v)} style={styles.actionBtn} />
        )}
        {bad && ply?.bestSan ? (
          <Button3D label={showBest ? t('review.hide') : t('review.best')} onPress={() => setShowBest((v) => !v)} style={styles.actionBtn} />
        ) : null}
        <Button3D label={t('review.next')} variant="primary" onPress={nextKey} style={[styles.actionBtn, { flex: 1.3 }]} />
      </View>

      {/* Controles */}
      <View style={styles.controls}>
        <Ctrl glyph="⏮" label={t('review.ctrlStart')} onPress={() => goTo(0)} />
        <Ctrl glyph="◀" label={t('review.ctrlPrev')} onPress={() => goTo(idx - 1)} />
        <Ctrl glyph={autoplaying ? '⏸' : '▶'} label={t(autoplaying ? 'review.ctrlPause' : 'review.ctrlPlay')} onPress={togglePlay} accent />
        <Ctrl glyph="▶" label={t('review.ctrlNext')} onPress={() => goTo(idx + 1)} />
        <Ctrl glyph="⏭" label={t('review.ctrlEnd')} onPress={() => goTo(n)} />
      </View>

      {/* Filtro: Todas / Destacadas. Solo cambia a dónde salta «Siguiente»; todo lo demás sigue libre. */}
      <View style={{ height: space.md }} />
      <Segmented
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'highlights', label: t('review.filterHighlights') },
          { value: 'all', label: t('review.filterAll') },
        ]}
      />
      {filter === 'highlights' && (
        <View style={styles.hlRow}>
          <Pressable onPress={() => jumpHighlight(-1)} accessibilityRole="button" accessibilityLabel={t('review.prevHighlight')} hitSlop={10}>
            <Text style={styles.hlArrow}>‹</Text>
          </Pressable>
          <Text style={styles.hlText}>
            {review.highlights.length === 0
              ? t('review.noHighlights')
              : hlPos >= 0
                ? t('review.highlightPos', { n: hlPos + 1, total: review.highlights.length })
                : t('common.xOfY', { n: review.highlights.filter((h) => h + 1 < idx).length, total: review.highlights.length })}
          </Text>
          <Pressable onPress={() => jumpHighlight(1)} accessibilityRole="button" accessibilityLabel={t('review.nextHighlight')} hitSlop={10}>
            <Text style={styles.hlArrow}>›</Text>
          </Pressable>
        </View>
      )}

      {/* Gráfico de la partida */}
      <View style={{ height: space.lg }} />
      <Pressable onPress={onGraphPress} accessibilityRole="adjustable" accessibilityLabel={t('review.graph')} style={[styles.graph, { width: graphW, height: gH }]}>
        <Svg width={graphW} height={gH} pointerEvents="none">
          <Path d={area} fill="#E9E9E9" />
          <Line x1={0} y1={gH / 2} x2={graphW} y2={gH / 2} stroke="#7A7773" strokeWidth={1} />
          {review.plies.map((p, i) =>
            p.highlight ? <Circle key={i} cx={x(i + 1)} cy={y(p.scoreAfter)} r={3.5} fill={(badgeOf(p) ?? BADGE.best)!.color} stroke="#262421" strokeWidth={1} /> : null
          )}
          <Line x1={x(idx)} y1={0} x2={x(idx)} y2={gH} stroke={boardHighlight.markBorder} strokeWidth={2} />
        </Svg>
      </Pressable>

      {/* Lista de jugadas */}
      <Text style={[styles.sectionTitle, { marginTop: space.lg }]}>{t('review.moves')}</Text>
      <View style={styles.moves}>
        {review.plies.map((p, i) => {
          const b = badgeOf(p);
          const current = idx === i + 1;
          return (
            <Pressable
              key={p.ply}
              onPress={() => goTo(i + 1)}
              accessibilityRole="button"
              accessibilityLabel={`${p.move.color === 'w' ? Math.floor(i / 2) + 1 + '. ' : ''}${fmt(p.move.san)}`}
              style={[styles.moveChip, current && styles.moveChipCurrent, p.highlight && !current && styles.moveChipHighlight]}
            >
              {p.move.color === 'w' && <Text style={styles.moveNo}>{Math.floor(i / 2) + 1}.</Text>}
              {b && <Text style={[styles.moveBadge, { color: b.color }]}>{b.label}</Text>}
              <Text style={[styles.moveText, current && { color: colors.text }]}>{fmt(p.move.san)}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Quién comenta y de qué lado juegas */}
      <Text style={[styles.sectionTitle, { marginTop: space.xl }]}>{t('review.playingAs')}</Text>
      <Segmented
        value={me}
        onChange={(v) => setMe(v)}
        options={[
          { value: 'w', label: t('common.white') },
          { value: 'b', label: t('common.black') },
        ]}
      />
      <Text style={[styles.sectionTitle, { marginTop: space.lg }]}>{t('review.coach')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm, paddingVertical: 4 }}>
        {bots.map((b) => (
          <Pressable
            key={b.id}
            onPress={() => chooseCoach(b.id)}
            accessibilityRole="radio"
            accessibilityState={{ selected: b.id === coach.id }}
            accessibilityLabel={b.name}
            style={[styles.coachPick, b.id === coach.id && styles.coachPickOn]}
          >
            <BotAvatar bot={b} size={44} />
            <Text style={styles.coachName} numberOfLines={1}>
              {b.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={{ height: space.xl }} />
      <Button3D label={t('review.chooseOther')} onPress={onBack} />
    </ScrollView>
  );
}

/** "+0,9", "−2,3", "M3": igual que la barra. */
function evalLabel(score: number, decimal: string): string {
  if (Math.abs(score) >= 9000) return `${score > 0 ? '' : '−'}M${10000 - Math.abs(score)}`;
  const p = (Math.abs(score) / 100).toFixed(1).replace('.', decimal);
  return score > 0 ? `+${p}` : score < 0 ? `−${p}` : `0${decimal}0`;
}

function Ctrl({ glyph, label, onPress, accent }: { glyph: string; label: string; onPress: () => void; accent?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.ctrl, accent && { backgroundColor: colors.primaryShadow }, pressed && { opacity: 0.7 }]}
    >
      <Text style={styles.ctrlGlyph}>{glyph}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  back: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted, marginBottom: space.md },
  title: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.text },
  sub: { fontFamily: fonts.bold, fontSize: 13, color: colors.textMuted, marginTop: 2 },
  muted: { fontFamily: fonts.semibold, fontSize: 14, color: colors.textMuted },
  analyzing: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.text },
  accRow: { flexDirection: 'row', gap: space.sm, marginTop: space.sm },
  accChip: { backgroundColor: colors.surfaceRaised, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 12 },
  accText: { fontFamily: fonts.extrabold, fontSize: 12, color: colors.text },
  coachRow: { flexDirection: 'row', gap: space.md, marginTop: space.md, alignItems: 'flex-start' },
  bubble: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    padding: space.md,
  },
  bubbleHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: 4 },
  bubbleTitle: { flex: 1, fontFamily: fonts.extrabold, fontSize: 15, color: colors.text },
  bubbleText: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: colors.textMuted },
  bubbleExplain: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: colors.text, marginTop: 6 },
  miniBadge: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  miniBadgeText: { fontFamily: fonts.extrabold, fontSize: 11, color: '#FFFFFF' },
  evalChip: { backgroundColor: '#F2F2F2', borderRadius: 6, paddingVertical: 2, paddingHorizontal: 6 },
  evalChipText: { fontFamily: fonts.extrabold, fontSize: 12, color: colors.bg },
  actions: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
  actionBtn: { flex: 1 },
  controls: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
  ctrl: { flex: 1, height: 44, borderRadius: radius.control, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  ctrlGlyph: { fontSize: 18, color: colors.text },
  hlRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.sm },
  hlArrow: { fontFamily: fonts.extrabold, fontSize: 28, color: colors.text, paddingHorizontal: space.lg },
  hlText: { fontFamily: fonts.bold, fontSize: 13, color: colors.textMuted },
  graph: { alignSelf: 'center', backgroundColor: '#403D39', borderRadius: radius.bar, overflow: 'hidden' },
  sectionTitle: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.text, marginBottom: space.sm },
  moves: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  moveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  moveChipCurrent: { backgroundColor: colors.primaryShadow, borderColor: colors.primary },
  moveChipHighlight: { borderColor: colors.outline },
  moveNo: { fontFamily: fonts.bold, fontSize: 12, color: colors.textMuted },
  moveBadge: { fontFamily: fonts.extrabold, fontSize: 12 },
  moveText: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted },
  coachPick: { alignItems: 'center', width: 72, paddingVertical: 6, borderRadius: radius.control, borderWidth: 2, borderColor: 'transparent' },
  coachPickOn: { borderColor: colors.primary, backgroundColor: colors.surface },
  coachName: { fontFamily: fonts.bold, fontSize: 11, color: colors.textMuted, marginTop: 2 },
});
