import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  GestureResponderEvent,
  Modal,
  Pressable,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle, Line, Path, Polygon } from 'react-native-svg';
import { Chess, Square } from 'chess.js';
import { BotAvatar } from '../components/BotAvatar';
import { BotExpression } from '../components/botFace';
import { Board, BoardMove } from '../components/Board';
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
import { analyzeGame, evaluatePosition } from '../review/analyze';
import { bookPositions, positionKey } from '../review/book';
import { buildReview, ratePly } from '../review/build';
import { coachExplanation, coachLang, coachVoice } from '../review/coachText';
import { parseGame } from '../review/pgn';
import { clearPendingGame, peekPendingGame, sideOf } from '../review/session';
import type { GameMove, MoveQuality, PositionEval, Review, ReviewPly } from '../review/types';
import { boardHighlight, colors, fonts, radius, space } from '../theme';

type Props = { onBack: () => void };

type Filter = 'all' | 'highlights';

/** Jugadas propias del usuario sobre una posición de la partida (`from` = jugada desde la que se desvió). */
type Branch = { from: number; moves: { id: number; move: GameMove; rated: ReviewPly | null }[] };

const COACH_KEY = '@ajedrez/reviewCoach';
const DEFAULT_COACH = 'ramiro';
const AUTOPLAY_MS = 1400;
const BUBBLE_H = 118; // alto fijo del globo: así el tablero nunca se mueve (3 líneas de texto y el resto se desliza)
const FAST_MS = 220; // cámara rápida hasta la próxima jugada destacada

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

// Filas del resumen (como chess.com: Genial, Mejor, Excelente…). `great` pesa más que la calidad.
type Cat = 'great' | 'best' | 'excellent' | 'good' | 'book' | 'inaccuracy' | 'mistake' | 'blunder';
const CATS: { id: Cat; color: string; glyph: string }[] = [
  { id: 'great', color: '#4FA3E0', glyph: '!' },
  { id: 'best', color: '#81B64C', glyph: '★' },
  { id: 'excellent', color: '#96BC4B', glyph: '!' },
  { id: 'good', color: '#7A9E5A', glyph: '✓' },
  { id: 'book', color: '#A88865', glyph: '≡' },
  { id: 'inaccuracy', color: '#F7C631', glyph: '?!' },
  { id: 'mistake', color: '#E8912D', glyph: '?' },
  { id: 'blunder', color: '#FA412D', glyph: '??' },
];

const countCats = (plies: ReviewPly[], color: 'w' | 'b'): Record<Cat, number> => {
  const r: Record<Cat, number> = { great: 0, best: 0, excellent: 0, good: 0, book: 0, inaccuracy: 0, mistake: 0, blunder: 0 };
  for (const p of plies) if (p.move.color === color) r[p.great ? 'great' : p.quality]++;
  return r;
};

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
  const [ffTarget, setFfTarget] = useState<number | null>(null);
  const [showBest, setShowBest] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [branch, setBranch] = useState<Branch | null>(null);
  const branchId = useRef(0);
  // Evaluaciones ya conocidas: las de la partida y las de las jugadas propias.
  const evalCache = useRef(new Map<string, PositionEval>());
  const reviewEvals = useMemo(() => {
    const m = new Map<string, PositionEval>();
    if (!review) return m;
    review.plies.forEach((p, i) => m.set(positionKey(p.move.fenBefore), { score: review.scores[i], best: p.bestUci }));
    const last = review.plies[review.plies.length - 1];
    if (last) m.set(positionKey(last.move.fenAfter), { score: review.scores[review.plies.length], best: last.replyUci });
    return m;
  }, [review]);
  const stripRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const chipPos = useRef<Record<number, { x: number; w: number }>>({});
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
    setShowBest(false);
    setFfTarget(null);
    setBranch(null);
  };
  // La reproducción automática avanza sola hasta el final de la partida.
  const autoplaying = playing && idx < n;
  useEffect(() => {
    if (!autoplaying) return;
    const id = setInterval(() => {
      setIdx((i) => Math.min(n, i + 1));
      setShowBest(false);
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [autoplaying, n]);
  // Cámara rápida: «Siguiente» recorre las jugadas intermedias hasta la destacada.
  const fast = ffTarget !== null && idx < ffTarget;
  useEffect(() => {
    if (!fast || ffTarget === null) return;
    const id = setInterval(() => setIdx((i) => Math.min(ffTarget, i + 1)), FAST_MS);
    return () => clearInterval(id);
  }, [fast, ffTarget]);
  const togglePlay = () => {
    setFfTarget(null);
    setBranch(null);
    if (autoplaying) return setPlaying(false);
    if (idx >= n) goTo(0);
    setPlaying(true);
  };

  // La tira de jugadas sigue a la jugada actual.
  useEffect(() => {
    if (!started) return;
    const p = chipPos.current[idx];
    stripRef.current?.scrollTo({ x: idx === 0 || !p ? 0 : Math.max(0, p.x - 90), animated: true });
  }, [idx, started]);

  const chooseCoach = (id: string) => {
    setCoachId(id);
    AsyncStorage.setItem(COACH_KEY, id).catch(() => {});
  };

  const nextKey = () => {
    if (!review) return;
    if (branch) {
      // Vuelve a la posición de la partida desde la que se probó otra jugada.
      setBranch(null);
      setShowBest(false);
      return;
    }
    if (fast && ffTarget !== null) return goTo(ffTarget); // tocar durante la cámara rápida salta al destino
    if (idx >= n) return onBack(); // «Finalizar»
    if (filter === 'all') return goTo(idx + 1);
    const next = review.highlights.find((h) => h + 1 > idx);
    const target = next === undefined ? n : next + 1;
    if (target - idx > 1) {
      setShowBest(false);
      setPlaying(false);
      setFfTarget(target);
    } else goTo(target);
  };
  const stepBack = () => {
    if (!branch) return goTo(idx - 1);
    setShowBest(false);
    setBranch((b) => (b && b.moves.length > 1 ? { ...b, moves: b.moves.slice(0, -1) } : null));
  };
  const stepForward = () => {
    if (!branch) goTo(idx + 1);
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
  const lastVar = branch ? branch.moves[branch.moves.length - 1] : null;
  const ply = lastVar ? (lastVar.rated ?? undefined) : idx > 0 ? review.plies[idx - 1] : undefined;
  const pendingOwn = !!lastVar && !lastVar.rated;
  const fen = lastVar ? lastVar.move.fenAfter : idx === 0 ? game.startFen : review.plies[idx - 1].move.fenAfter;
  const shownMove = lastVar ? lastVar.move : ply?.move;
  const lastMove = shownMove
    ? { from: shownMove.uci.slice(0, 2) as Square, to: shownMove.uci.slice(2, 4) as Square }
    : null;
  const mine = lastVar ? true : ply ? ply.move.color === me : true;
  const bad = !!ply && (ply.quality === 'mistake' || ply.quality === 'blunder' || ply.quality === 'inaccuracy');
  const badge = ply ? badgeOf(ply) : null;
  const colorArrows: { move: string; color: string }[] = [];
  if (ply && bad && ply.replyUci) colorArrows.push({ move: ply.replyUci.slice(0, 4), color: REPLY_ARROW });
  if (ply && showBest && ply.bestUci) colorArrows.push({ move: ply.bestUci.slice(0, 4), color: BEST_ARROW });

  const san = ply ? fmt(ply.move.san) : '';
  const voice = pendingOwn
    ? engineError
      ? t('analysis.engineDown')
      : t('review.analyzingMove')
    : ply
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
        seed: ply.ply + coach.elo,
        style: coach.style,
      })
    : [];

  const scoreHere = branch
    ? ply?.scoreAfter ?? branch.moves.slice(0, -1).reverse().find((m) => m.rated)?.rated?.scoreAfter ?? review.scores[branch.from]
    : review.scores[idx];
  const hlPos = review.highlights.findIndex((h) => h + 1 === idx);
  const nameOf = (c: 'w' | 'b') => (c === 'w' ? game.white : game.black) || t(c === 'w' ? 'common.white' : 'common.black');

  // Gráfico: área blanca = ventaja de las blancas
  const gH = 64;
  const x = (i: number) => (n === 0 ? 0 : (i / n) * graphW);
  const y = (score: number) => gH - whiteShare(score) * gH;
  const area =
    `M0 ${gH} ` + review.scores.map((s, i) => `L${x(i).toFixed(1)} ${y(s).toFixed(1)}`).join(' ') + ` L${graphW} ${gH} Z`;

  // El usuario mueve una pieza: si es la jugada de la partida se avanza; si no, se evalúa con el motor.
  const playOwn = (m: BoardMove) => {
    if (fast || autoplaying) return;
    const fenBefore = fen;
    let mv: GameMove;
    try {
      const c = new Chess(fenBefore);
      const r = c.move({ from: m.from, to: m.to, promotion: m.promotion });
      mv = { san: r.san, uci: `${m.from}${m.to}${r.promotion ?? ''}`, color: r.color, fenBefore, fenAfter: c.fen() };
    } catch {
      return;
    }
    setPlaying(false);
    setFfTarget(null);
    setShowBest(false);
    if (!branch && idx < n && review.plies[idx].move.uci === mv.uci) return goTo(idx + 1);
    const id = ++branchId.current;
    const prev = lastVar ? lastVar.rated ?? undefined : idx > 0 ? review.plies[idx - 1] : undefined;
    const number = (branch ? branch.from : idx) + (branch?.moves.length ?? 0) + 1;
    setBranch({ from: branch ? branch.from : idx, moves: [...(branch?.moves ?? []), { id, move: mv, rated: null }] });
    if (!engine) return;
    const evalOf = async (f: string) => {
      const key = positionKey(f);
      const known = evalCache.current.get(key) ?? reviewEvals.get(key);
      if (known) return known;
      const e = await evaluatePosition(engine, f);
      evalCache.current.set(key, e);
      return e;
    };
    (async () => {
      try {
        const before = await evalOf(mv.fenBefore);
        const after = await evalOf(mv.fenAfter);
        const rated = ratePly(number, mv, before, after, bookPositions(), prev);
        setBranch((b) => (b ? { ...b, moves: b.moves.map((x) => (x.id === id ? { ...x, rated } : x)) } : b));
      } catch {
        // sin respuesta del motor: la jugada queda «analizando»
      }
    })();
  };

  const topBar = (
    <View style={styles.topBar}>
      <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel={t('analysisMenu.back')} hitSlop={12} style={styles.topBtn}>
        <Icon name="back" color={colors.text} />
      </Pressable>
      <Text style={styles.topTitle} numberOfLines={1}>
        {t('review.title')}
      </Text>
      {started ? (
        <Pressable onPress={() => setSheet(true)} accessibilityRole="button" accessibilityLabel={t('review.settings')} hitSlop={12} style={styles.topBtn}>
          <Icon name="sliders" color={colors.text} />
        </Pressable>
      ) : (
        <View style={styles.topBtn} />
      )}
    </View>
  );

  const coachBubble = (
    <View style={styles.coachRow}>
      <BotAvatar bot={coach} size={64} expression={pendingOwn ? 'piensa' : faceFor(ply, mine)} />
      <View style={styles.bubble}>
        <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} contentContainerStyle={styles.bubbleContent}>
        {ply ? (
          <View style={styles.bubbleHead}>
            {badge && (
              <View style={[styles.miniBadge, { backgroundColor: badge.color }]}>
                <Text style={styles.miniBadgeText}>{badge.label}</Text>
              </View>
            )}
            <Text style={styles.bubbleTitle} numberOfLines={1} adjustsFontSizeToFit>
              {t(titleKey(ply), { move: san })}
            </Text>
            <View style={[styles.evalChip, scoreHere < 0 && { backgroundColor: '#1B1A18' }]}>
              <Text style={[styles.evalChipText, scoreHere < 0 && { color: '#FFFFFF' }]}>{evalLabel(scoreHere, decimal)}</Text>
            </View>
          </View>
        ) : pendingOwn ? null : started ? (
          <Text style={styles.bubbleTitle}>{t('review.startPosition')}</Text>
        ) : null}
        <Text style={styles.bubbleText}>{voice}</Text>
        {showBest && ply
          ? explanation.length > 0
            ? explanation.map((l, i) => (
                <Text key={i} style={styles.bubbleExplain}>
                  {l}
                </Text>
              ))
            : ply.bestSan
              ? <Text style={styles.bubbleExplain}>{t('review.bestWas', { move: fmt(ply.bestSan) })}</Text>
              : null
          : null}
              </ScrollView>
      </View>
    </View>
  );

  const graphView = (
    <Pressable
      onPress={(e) => {
        onGraphPress(e);
        setStarted(true);
        setSheet(false);
      }}
      accessibilityRole="adjustable"
      accessibilityLabel={t('review.graph')}
      style={[styles.graph, { width: graphW, height: gH }]}
    >
      <Svg width={graphW} height={gH} pointerEvents="none">
        <Path d={area} fill="#E9E9E9" />
        <Line x1={0} y1={gH / 2} x2={graphW} y2={gH / 2} stroke="#7A7773" strokeWidth={1} />
        {review.plies.map((p, i) =>
          p.highlight ? <Circle key={i} cx={x(i + 1)} cy={y(p.scoreAfter)} r={3.5} fill={(badgeOf(p) ?? BADGE.best)!.color} stroke="#262421" strokeWidth={1} /> : null
        )}
        {started && <Line x1={x(idx)} y1={0} x2={x(idx)} y2={gH} stroke={boardHighlight.markBorder} strokeWidth={2} />}
      </Svg>
    </Pressable>
  );

  // ── Resumen (antes de empezar) ──
  if (!started) {
    const counts = { w: countCats(review.plies, 'w'), b: countCats(review.plies, 'b') };
    return (
      <View style={styles.screen}>
        {!engineError && <EngineView key={engineKey} onReady={setEngine} onError={setEngineError} />}
        <ScrollView contentContainerStyle={[styles.content, { paddingTop: (RNStatusBar.currentHeight ?? 40) + space.sm }]}>
          {topBar}
          {coachBubble}
          <View style={{ height: space.lg }} />
          {graphView}

          <View style={styles.players}>
            {(['w', 'b'] as const).map((c) => (
              <View key={c} style={[styles.playerCard, c === me && styles.playerCardMe]}>
                <Text style={styles.playerName} numberOfLines={1}>
                  {nameOf(c)}
                </Text>
                <View style={[styles.accBox, c === 'b' && { backgroundColor: '#403D39' }]}>
                  <Text style={[styles.accNum, c === 'b' && { color: '#FFFFFF' }]}>{review.accuracy[c].toFixed(1).replace('.', decimal)}</Text>
                </View>
                <Text style={styles.accLabel}>{t('review.accuracy')}</Text>
              </View>
            ))}
          </View>

          <View style={styles.catTable}>
            {CATS.map((c) => (
              <View key={c.id} style={styles.catRow}>
                <Text style={styles.catLabel} numberOfLines={1}>
                  {t(`review.cat.${c.id}` as MessageKey)}
                </Text>
                <Text style={[styles.catCount, counts.w[c.id] > 0 && { color: c.color }]}>{counts.w[c.id]}</Text>
                <View style={[styles.catIcon, { backgroundColor: c.color }]}>
                  <Text style={styles.catGlyph}>{c.glyph}</Text>
                </View>
                <Text style={[styles.catCount, counts.b[c.id] > 0 && { color: c.color }]}>{counts.b[c.id]}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
        <View style={styles.bottomBar}>
          <Button3D
            label={t('review.start')}
            variant="primary"
            onPress={() => {
              goTo(0);
              setStarted(true);
            }}
            style={{ flex: 1 }}
          />
        </View>
      </View>
    );
  }

  // ── Revisión jugada a jugada ──
  const canBest = bad && !!ply?.bestSan;
  return (
    <View style={styles.screen}>
      {!engineError && <EngineView key={engineKey} onReady={setEngine} onError={setEngineError} />}
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: (RNStatusBar.currentHeight ?? 40) + space.sm }]}>
        {topBar}
        {coachBubble}
        <View style={{ height: space.md }} />
        <EvalBar score={scoreHere} decimal={decimal} />
        <Board
          fen={fen}
          orientation={me}
          interactive={!fast && !autoplaying}
          onMove={playOwn}
          lastMove={lastMove}
          colorArrows={colorArrows}
          badge={ply && badge && lastMove ? { square: lastMove.to, color: badge.color, label: badge.label } : undefined}
        />

        {/* Tira de jugadas: sigue a la jugada actual */}
        <View style={styles.strip}>
          <Pressable onPress={stepBack} accessibilityRole="button" accessibilityLabel={t('review.ctrlPrev')} hitSlop={10} style={styles.stripArrow}>
            <Icon name="back" color={colors.textMuted} />
          </Pressable>
          <ScrollView ref={stripRef} horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={styles.stripContent}>
            {review.plies.map((p, i) => {
              const b = badgeOf(p);
              const current = idx === i + 1 && !branch;
              return (
                <Pressable
                  key={p.ply}
                  onPress={() => goTo(i + 1)}
                  onLayout={(e) => {
                    chipPos.current[i + 1] = { x: e.nativeEvent.layout.x, w: e.nativeEvent.layout.width };
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${p.move.color === 'w' ? Math.floor(i / 2) + 1 + '. ' : ''}${fmt(p.move.san)}`}
                  style={[styles.moveChip, current && styles.moveChipCurrent]}
                >
                  {p.move.color === 'w' && <Text style={styles.moveNo}>{Math.floor(i / 2) + 1}.</Text>}
                  {b && <Text style={[styles.moveBadge, { color: b.color }]}>{b.label}</Text>}
                  <Text style={[styles.moveText, current && { color: colors.text }]}>{fmt(p.move.san)}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <Pressable onPress={stepForward} accessibilityRole="button" accessibilityLabel={t('review.ctrlNext')} hitSlop={10} style={styles.stripArrow}>
            <Icon name="next" color={colors.textMuted} />
          </Pressable>
        </View>
        <View style={styles.stripEnds}>
          <Pressable onPress={() => goTo(0)} accessibilityRole="button" accessibilityLabel={t('review.ctrlStart')} hitSlop={8} style={styles.endBtn}>
            <Icon name="first" color={colors.textMuted} size={20} />
          </Pressable>
          <Pressable onPress={() => goTo(n)} accessibilityRole="button" accessibilityLabel={t('review.ctrlEnd')} hitSlop={8} style={styles.endBtn}>
            <Icon name="last" color={colors.textMuted} size={20} />
          </Pressable>
        </View>
      </ScrollView>

      {/* Barra inferior: Mejor · Reproducir · Siguiente / Finalizar */}
      <View style={styles.bottomBar}>
        <ToolBtn icon="star" label={showBest ? t('review.hide') : t('review.best')} disabled={!canBest} onPress={() => setShowBest((v) => !v)} />
        <ToolBtn
          icon={autoplaying ? 'pause' : 'play'}
          label={t(autoplaying ? 'review.ctrlPause' : 'review.ctrlPlay')}
          onPress={togglePlay}
        />
        <Button3D label={t(idx >= n && !branch ? 'review.finish' : 'review.next')} variant="primary" onPress={nextKey} style={{ flex: 1.5 }} />
      </View>

      {/* Ajustes de la revisión */}
      <Modal visible={sheet} transparent animationType="slide" onRequestClose={() => setSheet(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSheet(false)} accessibilityRole="button" accessibilityLabel={t('review.close')} />
          <View style={styles.sheet}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>{t('review.settings')}</Text>
              <Pressable onPress={() => setSheet(false)} accessibilityRole="button" accessibilityLabel={t('review.close')} hitSlop={12}>
                <Icon name="close" color={colors.textMuted} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionTitle}>{t('review.playingAs')}</Text>
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

              {/* Solo cambia a dónde salta «Siguiente»; todo lo demás sigue libre. */}
              <Text style={[styles.sectionTitle, { marginTop: space.lg }]}>{t('review.jumpTo')}</Text>
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

              <View style={{ height: space.lg }} />
              {graphView}

              <View style={{ height: space.xl }} />
              <Button3D label={t('review.chooseOther')} onPress={onBack} />
              <View style={{ height: space.md }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/** "+0,9", "−2,3", "M3": igual que la barra. */
function evalLabel(score: number, decimal: string): string {
  if (Math.abs(score) >= 9000) return `${score > 0 ? '' : '−'}M${10000 - Math.abs(score)}`;
  const p = (Math.abs(score) / 100).toFixed(1).replace('.', decimal);
  return score > 0 ? `+${p}` : score < 0 ? `−${p}` : `0${decimal}0`;
}

type IconName = 'back' | 'next' | 'star' | 'sliders' | 'first' | 'last' | 'play' | 'pause' | 'close';

/** Iconos simples de la pantalla (24 × 24), dibujados con SVG para no depender de emojis. */
function Icon({ name, color, size = 24 }: { name: IconName; color: string; size?: number }) {
  const line = { stroke: color, strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } as const;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'back' && <Path d="M15 5l-7 7 7 7" {...line} />}
      {name === 'next' && <Path d="M9 5l7 7-7 7" {...line} />}
      {name === 'close' && <Path d="M6 6l12 12M18 6L6 18" {...line} />}
      {name === 'star' && <Polygon points="12,2.5 14.9,9 22,9.6 16.6,14.3 18.2,21.2 12,17.5 5.8,21.2 7.4,14.3 2,9.6 9.1,9" fill={color} />}
      {name === 'first' && (
        <>
          <Path d="M6 5v14" {...line} />
          <Polygon points="19,5 9,12 19,19" fill={color} />
        </>
      )}
      {name === 'last' && (
        <>
          <Path d="M18 5v14" {...line} />
          <Polygon points="5,5 15,12 5,19" fill={color} />
        </>
      )}
      {name === 'play' && <Polygon points="7,4 20,12 7,20" fill={color} />}
      {name === 'pause' && <Path d="M7 5h4v14H7zM13 5h4v14h-4z" fill={color} />}
      {name === 'sliders' && (
        <>
          <Path d="M4 7h16M4 17h16" {...line} />
          <Circle cx={9} cy={7} r={2.6} {...line} fill={colors.bg} />
          <Circle cx={15} cy={17} r={2.6} {...line} fill={colors.bg} />
        </>
      )}
    </Svg>
  );
}

/** Botón de la barra inferior: icono arriba, texto abajo (apagado si no hay nada que mostrar). */
function ToolBtn({ icon, label, onPress, disabled }: { icon: IconName; label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [styles.tool, disabled && { opacity: 0.35 }, pressed && { opacity: 0.6 }]}
    >
      <Icon name={icon} color={colors.textMuted} size={22} />
      <Text style={styles.toolLabel} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.lg, paddingBottom: space.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  back: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted, marginBottom: space.md },
  title: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.text },
  muted: { fontFamily: fonts.semibold, fontSize: 14, color: colors.textMuted },
  analyzing: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.text },

  // Barra superior: volver · título · ajustes
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.md },
  topBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  topTitle: { flex: 1, textAlign: 'center', fontFamily: fonts.extrabold, fontSize: 20, color: colors.text },

  // Comentarista
  coachRow: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  bubble: {
    flex: 1,
    height: BUBBLE_H,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
  },
  bubbleContent: { padding: space.md },
  bubbleHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: 4 },
  bubbleTitle: { flex: 1, fontFamily: fonts.extrabold, fontSize: 15, color: colors.text },
  bubbleText: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: colors.textMuted },
  bubbleExplain: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: colors.text, marginTop: 6 },
  miniBadge: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  miniBadgeText: { fontFamily: fonts.extrabold, fontSize: 11, color: '#FFFFFF' },
  evalChip: { backgroundColor: '#F2F2F2', borderRadius: 6, paddingVertical: 2, paddingHorizontal: 6 },
  evalChipText: { fontFamily: fonts.extrabold, fontSize: 12, color: colors.bg },

  // Resumen
  graph: { alignSelf: 'center', backgroundColor: '#403D39', borderRadius: radius.bar, overflow: 'hidden' },
  players: { flexDirection: 'row', gap: space.md, marginTop: space.lg },
  playerCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingVertical: space.md,
    paddingHorizontal: space.sm,
  },
  playerCardMe: { borderColor: colors.primary },
  playerName: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.text, maxWidth: '100%' },
  accBox: { marginTop: space.sm, backgroundColor: '#F2F2F2', borderRadius: radius.bar, paddingVertical: 4, paddingHorizontal: 14 },
  accNum: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.bg },
  accLabel: { fontFamily: fonts.bold, fontSize: 12, color: colors.textMuted, marginTop: 4 },
  catTable: { marginTop: space.lg, backgroundColor: colors.surface, borderRadius: radius.control, paddingVertical: space.sm, paddingHorizontal: space.md },
  catRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  catLabel: { flex: 1, fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  catCount: { width: 48, textAlign: 'center', fontFamily: fonts.extrabold, fontSize: 17, color: colors.outline },
  catIcon: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  catGlyph: { fontFamily: fonts.extrabold, fontSize: 12, color: '#FFFFFF' },

  // Tira de jugadas
  strip: { flexDirection: 'row', alignItems: 'center', marginTop: space.md },
  stripEnds: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  endBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  stripArrow: { width: 32, height: 40, alignItems: 'center', justifyContent: 'center' },
  stripContent: { gap: 6, paddingHorizontal: 4, alignItems: 'center' },
  moveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  moveChipCurrent: { backgroundColor: colors.primaryShadow, borderColor: colors.primary },
  moveNo: { fontFamily: fonts.bold, fontSize: 13, color: colors.textMuted },
  moveBadge: { fontFamily: fonts.extrabold, fontSize: 13 },
  moveText: { fontFamily: fonts.bold, fontSize: 15, color: colors.textMuted },

  // Barra inferior
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.lg,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceRaised,
  },
  tool: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: 4 },
  toolLabel: { fontFamily: fonts.bold, fontSize: 11, color: colors.textMuted },

  // Ajustes (hoja inferior)
  modalRoot: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    maxHeight: '85%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
  },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.md },
  sheetTitle: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.text },
  sectionTitle: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.text, marginBottom: space.sm },
  hlRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.sm },
  hlArrow: { fontFamily: fonts.extrabold, fontSize: 28, color: colors.text, paddingHorizontal: space.lg },
  hlText: { fontFamily: fonts.bold, fontSize: 13, color: colors.textMuted },
  coachPick: { alignItems: 'center', width: 72, paddingVertical: 6, borderRadius: radius.control, borderWidth: 2, borderColor: 'transparent' },
  coachPickOn: { borderColor: colors.primary, backgroundColor: colors.surfaceRaised },
  coachName: { fontFamily: fonts.bold, fontSize: 11, color: colors.textMuted, marginTop: 2 },
});
