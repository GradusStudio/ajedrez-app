import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { Square } from 'chess.js';
import { Board } from '../components/Board';
import { Button3D } from '../components/Button3D';
import { EvalBar } from '../components/EvalBar';
import { formatScore } from '../engine/evalFormat';
import { resolveNotation, sanFromEnglish } from '../chess/notation';
import { useI18n } from '../i18n/I18nContext';
import { useSettings } from '../settings/SettingsContext';
import { coachExplanation, coachLang, coachVoice } from '../review/coachText';
import { lineMoves, lineText } from '../review/bestLine';
import { parseGame } from '../review/pgn';
import { clearPendingGame, peekPendingGame, sideOf } from '../review/session';
import { saveReview } from '../review/reviewStore';
import { reviewId } from '../review/store';
import { setPendingQuiz, turningPoints } from '../review/turningPoints';
import { isBad } from '../review/types';
import { space } from '../theme';
import { AnalyzingView } from './review/AnalyzingView';
import { CoachBubble } from './review/CoachBubble';
import { EvalGraph } from './review/EvalGraph';
import { MoveStrip } from './review/MoveStrip';
import { badgeOf, BEST_ARROW, CAT_KEY, faceFor, QUALITY_STYLE, REPLY_ARROW, titleKey } from './review/quality';
import { ReviewTop, ToolBtn } from './review/ReviewParts';
import { styles } from './review/reviewStyles';
import { SettingsSheet } from './review/SettingsSheet';
import { SummaryView, type SummaryMoment } from './review/SummaryView';
import { useBranchPlay } from './review/useBranchPlay';
import { useReviewAnalysis } from './review/useReviewAnalysis';
import { useReviewCoach } from './review/useReviewCoach';
import { useReviewPlayback } from './review/useReviewPlayback';
import { statusBarTop } from '../components/statusBarTop';
import { BoardLayout, useBoardLayoutWidth } from '../components/BoardLayout';
import { WideListColumn } from '../components/WideListColumn';
import { useWideLayout } from '../components/useWideLayout';

/** Alto fuera del tablero en pantalla ancha: barra de arriba, barra de evaluación, barra de abajo y márgenes. */
const REVIEW_RESERVE = 240;

type Props = { onBack: () => void; onPractice: () => void; /** Origen: `game` cuando se entra desde el resultado de una partida. */ from?: string };

const topInset = () => statusBarTop(space.sm);

export function GameReviewScreen({ onBack, onPractice, from }: Props) {
  const { t, tn, language } = useI18n();
  const { settings } = useSettings();
  const notation = resolveNotation(settings.notation, language);
  const decimal = language === 'en' ? '.' : ',';
  const fmt = (san: string) => sanFromEnglish(san, notation);

  const [pending] = useState(() => peekPendingGame());
  const game = useMemo(() => (pending ? parseGame(pending.pgn) : null), [pending]);
  // Revisión ya guardada (tarea 34): se muestra tal cual, sin volver a analizar.
  const saved = pending?.review ?? null;
  const meKnown = game ? (sideOf(pending?.username, game.white, game.black) ?? pending?.me ?? null) : null;
  useEffect(() => () => clearPendingGame(), []);

  const { engine, engineError, engineView, review, progress, phase, failed, retry } = useReviewAnalysis(
    saved ? null : game,
    saved
  );
  const n = review?.plies.length ?? 0;
  const pb = useReviewPlayback(n, review?.highlights ?? []);
  const { coach, choose: chooseCoach } = useReviewCoach(pending?.coachId);
  const [me, setMe] = useState<'w' | 'b'>(() => meKnown ?? 'w');
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [sheetCoachOnly, setSheetCoachOnly] = useState(false);
  const backLabel = from === 'game' ? t('back.generic') : t('tabs.analysis');
  const top = (
    <ReviewTop
      onBack={onBack}
      backLabel={backLabel}
      onSettings={() => {
        setSheetCoachOnly(false);
        setSheet(true);
      }}
    />
  );

  // La revisión calculada en esta pantalla se guarda en el dispositivo (las últimas 10). Si después se cambia el
  // bando o el comentarista, se vuelve a guardar con el mismo id: el registro guardado no se queda con los viejos.
  useEffect(() => {
    if (!review || saved || !pending || !game) return;
    void saveReview({
      id: pending.id ?? reviewId(pending.pgn),
      savedAt: new Date().toISOString(),
      me,
      coachId: coach.id,
      review,
    });
  }, [review, saved, pending, game, me, coach.id]);

  // Flechas del teclado en la web (spec de la revisión): retroceder, avanzar, inicio y fin.
  const pbRef = useRef(pb);
  useEffect(() => {
    pbRef.current = pb;
  });
  useEffect(() => {
    if (Platform.OS !== 'web' || !started) return;
    const onKey = (e: KeyboardEvent) => {
      if (sheet) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        pbRef.current.stepBack();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        pbRef.current.stepForward();
      } else if (e.key === 'Home') {
        e.preventDefault();
        pbRef.current.goTo(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        pbRef.current.goTo(n);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [started, sheet, n]);

  const { idx, lastVar, branch } = pb;
  const fen =
    !game || !review ? '' : lastVar ? lastVar.move.fenAfter : idx === 0 ? game.startFen : review.plies[idx - 1].move.fenAfter;
  const playOwn = useBranchPlay(review, engine, pb, fen);
  // Pantalla ancha (web): tablero a la izquierda; comentarista y jugadas en el panel; barras alineadas con ellos.
  const wide = useWideLayout();
  const contentWidth = useBoardLayoutWidth(REVIEW_RESERVE);
  const { width: windowWidth } = useWindowDimensions();

  if (!game) {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: statusBarTop() }]}>
        <Text style={styles.muted}>{t('review.invalid')}</Text>
        <View style={{ height: space.lg }} />
        <Button3D label={t('review.chooseOther')} onPress={onBack} />
      </View>
    );
  }

  // El motor se dibuja una sola vez, en el mismo lugar del árbol para todas las vistas.
  const shell = (body: React.ReactNode) => (
    <View style={styles.screen}>
      {engineView}
      {body}
    </View>
  );

  if (!review) {
    return shell(
      <AnalyzingView
        down={!!engineError || failed}
        engineReady={!!engine}
        progress={progress}
        phase={phase}
        backLabel={from === 'game' ? t('back.generic') : t('tabs.analysis')}
        onBack={onBack}
        onRetry={retry}
      />
    );
  }

  // ── Lo que se ve ahora: jugada de la partida o jugada propia ──
  const ply = lastVar ? (lastVar.rated ?? undefined) : idx > 0 ? review.plies[idx - 1] : undefined;
  const pendingOwn = !!lastVar && !lastVar.rated;
  // La línea del motor de una jugada mala se puede reproducir sobre el tablero desde la posición anterior a esa jugada.
  const lineList = ply && isBad(ply.quality) ? lineMoves(ply.move.fenBefore, ply.bestPv) : [];
  const pv = pb.preview;
  const previewMove = pv && pv.step > 0 ? pv.moves[pv.step - 1] : null;
  const shownFen = pv ? (previewMove ? previewMove.fenAfter : pv.baseFen) : fen;
  const shownMove = pv ? previewMove : lastVar ? lastVar.move : ply?.move;
  const lastMove = shownMove ? { from: shownMove.uci.slice(0, 2) as Square, to: shownMove.uci.slice(2, 4) as Square } : null;
  const mine = lastVar ? lastVar.move.color === me : ply ? ply.move.color === me : true;
  const bad = !!ply && isBad(ply.quality);
  const badge = ply ? badgeOf(ply) : null;
  const colorArrows: { move: string; color: string }[] = [];
  if (!pv && ply && bad && ply.replyUci) colorArrows.push({ move: ply.replyUci.slice(0, 4), color: REPLY_ARROW });
  if (!pv && ply && pb.showBest && ply.bestUci) colorArrows.push({ move: ply.bestUci.slice(0, 4), color: BEST_ARROW });

  const san = ply ? fmt(ply.move.san) : '';
  const voice = pendingOwn
    ? engineError
      ? t('analysis.engineDown')
      : t(mine ? 'review.analyzingMove' : 'review.analyzingOpponent')
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

  // Los hechos (qué buscaba la jugada, por qué falla, cuál era la mejor y por qué) van primero y siempre a la vista.
  // La frase con la voz del bot solo aparece cuando no hay ningún hecho que decir.
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
  const details = [...explanation];
  if (pb.showBest && ply?.bestSan && !explanation.join(' ').includes(fmt(ply.bestSan))) {
    details.push(t('review.bestWas', { move: fmt(ply.bestSan) }));
  }

  // Filas de «Momentos clave» del resumen: hasta 5, con el comentario ya traducido y la diferencia de evaluación.
  const moments: SummaryMoment[] = review.highlights.slice(0, 5).map((index) => {
    const p = review.plies[index];
    const mSan = fmt(p.move.san);
    const subject = p.move.color === me ? 'you' : 'opponent';
    const facts = coachExplanation({
      lang: coachLang(language),
      subject,
      quality: p.quality,
      facts: p.facts,
      move: mSan,
      bestSan: p.bestSan,
      fmt,
      seed: p.ply + coach.elo,
      style: coach.style,
    });
    const voice = coachVoice({
      lang: coachLang(language),
      style: coach.style,
      quality: p.quality,
      great: p.great,
      mate: p.move.san.endsWith('#'),
      subject,
      move: mSan,
      seed: p.ply + coach.elo,
    });
    const badge = badgeOf(p);
    const quality = t(CAT_KEY[p.great ? 'great' : p.quality]);
    // La diferencia de una jugada que permite o da mate no es un número de peones: se muestra «+M» o «−M».
    const swing = p.scoreAfter - review.scores[p.ply - 1];
    const diff = Math.abs(swing) >= 9000 ? (swing > 0 ? '+M' : '−M') : formatScore(swing, decimal);
    const aria = t('review.momentLabel', {
      n: Math.ceil(p.ply / 2),
      color: t(p.move.color === 'w' ? 'common.white' : 'common.black'),
      move: mSan,
      quality,
    });
    return {
      index,
      san: mSan,
      badge,
      color: (badge ?? QUALITY_STYLE[p.great ? 'great' : p.quality]).color,
      quality,
      text: facts[0] ?? voice,
      diff,
      aria,
    };
  });

  const scoreHere = branch
    ? ply?.scoreAfter ?? branch.moves.slice(0, -1).reverse().find((m) => m.rated)?.rated?.scoreAfter ?? review.scores[branch.from]
    : review.scores[idx];
  const nameOf = (c: 'w' | 'b') => (c === 'w' ? game.white : game.black) || t(c === 'w' ? 'common.white' : 'common.black');

  const coachBubble = (
    <CoachBubble
      coach={coach}
      expression={pendingOwn ? 'piensa' : faceFor(ply, mine)}
      head={ply ? { badge, title: t(titleKey(ply), { move: san }), score: scoreHere, decimal } : null}
      startTitle={!ply && !pendingOwn && started ? t('review.startPosition') : null}
      voice={explanation.length > 0 ? '' : voice}
      details={details}
      line={ply && lineList.length > 0 ? t('review.bestLine', { line: lineText(ply.move.fenBefore, lineList, fmt) }) : ''}
    />
  );

  const graph = (
    <EvalGraph
      review={review}
      idx={idx}
      showCursor={started}
      onSelect={(i) => {
        pb.goTo(i);
        setStarted(true);
        setSheet(false);
      }}
    />
  );

  if (!started) {
    // Quiz de puntos de giro: pantalla aparte que solo lee esta revisión. Usa el bando elegido (por si el PGN no
    // dice quién jugó), el mismo que se guarda.
    const points = turningPoints(review, me);
    return shell(
      // El resumen usa una columna de 1060 px: dos tarjetas lado a lado (spec 2026-11-15, sección 2).
      <WideListColumn width={1060}>
        <SummaryView
        top={top}
        review={review}
        me={me}
        meKnown={meKnown !== null}
        nameOf={nameOf}
        decimal={decimal}
        coach={coach}
        moments={moments}
        finished={finished}
        onChangeCoach={() => {
          setSheetCoachOnly(true);
          setSheet(true);
        }}
        onStart={() => {
          pb.goTo(0);
          setFinished(false);
          setStarted(true);
        }}
        onJump={(index) => {
          pb.goTo(index + 1);
          setFinished(false);
          setStarted(true);
        }}
        onPractice={
          points.length > 0
            ? () => {
                setPendingQuiz({ points, me, coachId: coach.id });
                onPractice();
              }
            : undefined
        }
      />
      <SettingsSheet
        visible={sheet}
        coachOnly={sheetCoachOnly}
        onClose={() => {
          setSheet(false);
          setSheetCoachOnly(false);
        }}
        me={me}
        onMe={setMe}
        coachId={coach.id}
        onCoach={chooseCoach}
        filter={pb.filter}
        onFilter={pb.setFilter}
        highlights={review.highlights}
        idx={idx}
        onJump={pb.jumpHighlight}
        graph={graph}
        onChooseOther={onBack}
      />
      </WideListColumn>
    );
  }

  // ── Revisión jugada a jugada ──
  const canBest = bad && !!ply?.bestSan;
  const boardBlock = (
    <>
      <EvalBar score={scoreHere} decimal={decimal} />
      <Board
        fen={shownFen}
        orientation={me}
        interactive={!!engine && !pb.fast && !pb.autoplaying && !pv}
        onMove={playOwn}
        lastMove={lastMove}
        colorArrows={colorArrows}
        badge={!pv && ply && badge && lastMove ? { square: lastMove.to, color: badge.color, label: badge.label } : undefined}
      />
    </>
  );
  const moveStrip = (
    <MoveStrip
      plies={review.plies}
      idx={idx}
      inBranch={!!branch}
      fmt={fmt}
      onGo={pb.goTo}
      onPrev={pb.stepBack}
      onNext={pb.stepForward}
    />
  );
  return shell(
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: topInset() }]}>
        <View style={contentWidth ? { width: contentWidth, alignSelf: 'center' } : null}>{top}</View>
        {wide ? (
          <BoardLayout reserveHeight={REVIEW_RESERVE} board={boardBlock}>
            {coachBubble}
            <View style={{ height: space.md }} />
            {moveStrip}
          </BoardLayout>
        ) : (
          <>
            {coachBubble}
            <View style={{ height: space.md }} />
            {boardBlock}
            {moveStrip}
          </>
        )}
      </ScrollView>

      {/* Barra inferior: Mejor · Reproducir · Siguiente / Finalizar. En pantalla ancha, alineada con el tablero. */}
      <View style={[styles.bottomBar, contentWidth ? { paddingHorizontal: Math.max(space.lg, (windowWidth - contentWidth) / 2) } : null]}>
        <ToolBtn
          icon="star"
          label={pb.showBest ? t('review.hide') : t('review.best')}
          disabled={!canBest}
          onPress={() => pb.setShowBest((v) => !v)}
        />
        <ToolBtn
          icon="line"
          label={pv ? t('review.stopLine') : t('review.showLine')}
          disabled={!pv && lineList.length === 0}
          onPress={() => (pv ? pb.stopPreview() : ply && pb.startPreview(ply.move.fenBefore, lineList))}
        />
        <ToolBtn
          icon={pb.autoplaying ? 'pause' : 'play'}
          label={t(pb.autoplaying ? 'review.ctrlPause' : 'review.ctrlPlay')}
          onPress={pb.togglePlay}
        />
        <Button3D
          label={t('review.nextMoment')}
          variant="primary"
          onPress={() =>
            pb.next(() => {
              pb.goTo(0);
              setStarted(false);
              setFinished(true);
            })
          }
          style={{ flex: 1.5 }}
        />
      </View>

      <SettingsSheet
        visible={sheet}
        coachOnly={sheetCoachOnly}
        onPlay={() => pb.togglePlay()}
        onClose={() => {
          setSheet(false);
          setSheetCoachOnly(false);
        }}
        me={me}
        onMe={setMe}
        coachId={coach.id}
        onCoach={chooseCoach}
        filter={pb.filter}
        onFilter={pb.setFilter}
        highlights={review.highlights}
        idx={idx}
        onJump={pb.jumpHighlight}
        graph={graph}
        onChooseOther={onBack}
      />
    </View>
  );
}
