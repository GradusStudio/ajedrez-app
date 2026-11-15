import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';
import { Board } from '../components/Board';
import { Button3D } from '../components/Button3D';
import { EvalBar } from '../components/EvalBar';
import { summaryMoments } from '../review/summaryMoments';
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
import { catOf, faceFor, qualityColor, qualityNameKey, QUALITY_INK, QUALITY_TEXT_DARK } from './review/quality';
import { reviewView } from './review/reviewView';import { FilterPills } from './review/FilterPills';
import { MoveList } from './review/MoveList';
import { NavButtons } from './review/NavButtons';
import { ReviewTop } from './review/ReviewParts';
import { styles } from './review/reviewStyles';
import { SettingsSheet } from './review/SettingsSheet';
import { SummaryView } from './review/SummaryView';
import { useBranchPlay } from './review/useBranchPlay';
import { useReviewAnalysis } from './review/useReviewAnalysis';
import { useReviewCoach } from './review/useReviewCoach';
import { useReviewPlayback } from './review/useReviewPlayback';
import { statusBarTop } from '../components/statusBarTop';
import { BoardLayout, useBoardLayoutWidth } from '../components/BoardLayout';
import { WideListColumn } from '../components/WideListColumn';
import { useWideLayout } from '../components/useWideLayout';

/** Alto fuera del tablero en pantalla ancha: barra de arriba, barra de evaluación, navegación, gráfico y márgenes. */
const REVIEW_RESERVE = 380;

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
  const [me, setMe] = useState<'w' | 'b' | null>(() => meKnown);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [sheet, setSheet] = useState<'coach' | 'settings' | null>(null);
  // Filas de «Momentos clave» del resumen, con el comentario y la diferencia ya calculados (módulo puro probado).
  const moments = review ? summaryMoments(review, me, coach, { language, fmt, decimal, t }) : [];
  const backLabel = from === 'game' ? t('back.generic') : t('tabs.analysis');
  const backAria = from === 'game' ? t('back.generic') : t('back.to', { screen: t('tabs.analysis') });
  const top = (
    <ReviewTop
      onBack={onBack}
      backLabel={backLabel}
      backAria={backAria}
      onSettings={() => setSheet('settings')}
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

  // En una revisión ya guardada, cambiar el bando o el comentarista también actualiza el registro.
  const initialMe = useRef(me);
  const initialCoach = useRef(coach.id);
  useEffect(() => {
    if (!saved || !pending || !game) return;
    if (initialMe.current === me && initialCoach.current === coach.id) return;
    void saveReview({
      id: pending.id ?? reviewId(pending.pgn),
      savedAt: new Date().toISOString(),
      me,
      coachId: coach.id,
      review: saved,
    });
  }, [saved, pending, game, me, coach.id]);

  // Flechas del teclado en la web (spec de la revisión): retroceder, avanzar, inicio y fin.
  const pbRef = useRef(pb);
  useEffect(() => {
    pbRef.current = pb;
  });
  useEffect(() => {
    if (Platform.OS !== 'web' || !started) return;
    // Al pasar al modo revisión, el foco va al contenedor nuevo (el botón que se pulsó desaparece).
    const node = document.getElementById('gradus-review-start') as (HTMLElement & { tabIndex: number }) | null;
    if (node) {
      node.tabIndex = -1;
      node.focus();
    }
  }, [started]);
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
        backAria={backAria}
        onBack={onBack}
        onRetry={retry}
      />
    );
  }

  // ── Lo que se ve ahora: jugada de la partida, variante propia o línea del motor (selector puro probado) ──
  const view = reviewView({
    fen,
    plies: review.plies,
    scores: review.scores,
    idx,
    lastVar,
    preview: pb.preview,
    branch,
    me,
    showBest: pb.showBest,
  });
  const { ply, pendingOwn, shownFen, lastMove, mine, bad, badge, colorArrows, score: scoreHere } = view;
  const pv = pb.preview;
  // La línea del motor de una jugada mala se puede reproducir sobre el tablero desde la posición anterior a esa jugada.
  const lineList = ply && isBad(ply.quality) ? lineMoves(ply.move.fenBefore, ply.bestPv) : [];

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


  const nameOf = (c: 'w' | 'b') => (c === 'w' ? game.white : game.black) || t(c === 'w' ? 'common.white' : 'common.black');

  const coachBubble = (
    <CoachBubble
      coach={coach}
      expression={pendingOwn ? 'piensa' : faceFor(ply, mine)}
      head={
        ply
          ? {
              badge,
              move: san,
              quality: t(qualityNameKey(ply)),
              color: qualityColor(ply),
              textColor: QUALITY_TEXT_DARK[catOf(ply)],
              ink: QUALITY_INK[catOf(ply)],
              score: scoreHere,
              decimal,
            }
          : null
      }
      startTitle={!ply && !pendingOwn && started ? t('review.startPosition') : null}
      voice={explanation.length > 0 ? '' : voice}
      details={details}
      line={ply && lineList.length > 0 ? t('review.bestLine', { line: lineText(ply.move.fenBefore, lineList, fmt) }) : ''}
      resetKey={ply?.ply ?? 0}
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
        setSheet(null);
      }}
    />
  );
  const sheetNode = (
    <SettingsSheet
      visible={sheet !== null}
      mode={sheet ?? 'settings'}
      onClose={() => setSheet(null)}
      me={me ?? 'w'}
      onMe={setMe}
      coachId={coach.id}
      onCoach={chooseCoach}
      graph={graph}
      onChooseOther={onBack}
      playing={pb.autoplaying}
      onPlay={() => {
        pb.togglePlay();
        setSheet(null);
      }}
    />
  );

  if (!started) {
    // Quiz de puntos de giro: pantalla aparte que solo lee esta revisión. Usa el bando elegido; sin bando no hay
    // errores del usuario que ofrecer.
    const points = me ? turningPoints(review, me) : [];
    return shell(
      // El resumen usa una columna de 1060 px: dos tarjetas lado a lado (spec 2026-11-15, sección 2).
      <WideListColumn width={1060}>
        <SummaryView
        top={top}
        review={review}
        me={me}
        nameOf={nameOf}
        decimal={decimal}
        coach={coach}
        moments={moments}
        finished={finished}
        truncated={!!game?.truncated}
        onChangeCoach={() => setSheet('coach')}
        onMe={setMe}
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
          me && points.length > 0
            ? () => {
                setPendingQuiz({ points, me, coachId: coach.id });
                onPractice();
              }
            : undefined
        }
      />
      {sheetNode}
      </WideListColumn>
    );
  }

  // ── Revisión jugada a jugada (spec 2026-11-15, sección 3) ──
  const canBest = bad && !!ply?.bestSan;
  const boardBlock = (
    <>
      <EvalBar score={scoreHere} decimal={decimal} />
      <Board
        fen={shownFen}
        orientation={me ?? 'w'}
        interactive={!!engine && !pb.fast && !pb.autoplaying && !pv}
        onMove={playOwn}
        lastMove={lastMove}
        colorArrows={colorArrows}
        badge={!pv && ply && badge && lastMove ? { square: lastMove.to, color: badge.color, label: badge.label } : undefined}
      />
    </>
  );
  const nav = (
    <NavButtons
      onStart={() => pb.goTo(0)}
      onPrev={pb.stepBack}
      onNext={pb.stepForward}
      onEnd={() => pb.goTo(n)}
      idx={idx}
      n={n}
      inBranch={!!branch}
    />
  );
  const moveStrip = (
    <MoveStrip
      plies={review.plies}
      idx={idx}
      inBranch={!!branch}
      fmt={fmt}
      onGo={pb.goTo}
    />
  );
  const controls = (
    <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.sm }}>
      <Button3D
        label={t(pb.showBest ? 'review.hideBestShort' : 'review.showBestShort')}
        ariaLabel={t(pb.showBest ? 'review.hideBest' : 'review.showBest')}
        disabled={!canBest}
        onPress={() => pb.setShowBest((v) => !v)}
        style={{ flex: 1 }}
      />
      <Button3D
        label={t(pv ? 'review.stopLine' : 'review.showLineShort')}
        ariaLabel={t(pv ? 'review.stopLine' : 'review.showLine')}
        disabled={!pv && lineList.length === 0}
        onPress={() => (pv ? pb.stopPreview() : ply && pb.startPreview(ply.move.fenBefore, lineList))}
        style={{ flex: 1 }}
      />
    </View>
  );
  const nextMoment = () =>
    pb.next(() => {
      pb.goTo(0);
      setStarted(false);
      setFinished(true);
    });
  // La acción principal dice lo que hace: con «Todas» avanza una jugada; al final, termina.
  const primaryLabel = pv
    ? t('review.stopLine')
    : branch
      ? t('review.finish')
      : idx >= n
        ? t('review.finish')
        : pb.filter === 'all'
          ? t('review.ctrlNext')
          : t('review.nextMoment');
  const nextMomentBtn = <Button3D label={primaryLabel} variant="primary" onPress={nextMoment} style={{ marginTop: space.sm }} />;
  const filter = <FilterPills value={pb.filter} onChange={pb.setFilter} />;

  return shell(
    <View style={styles.screen} nativeID="gradus-review-start">
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: topInset() }]}>
        <View style={contentWidth ? { width: contentWidth, alignSelf: 'center' } : null}>{top}</View>
        {wide ? (
          // Tablero a la izquierda (barra, tablero, navegación y gráfico); comentarista y jugadas en el panel.
          <BoardLayout reserveHeight={REVIEW_RESERVE} board={<>{boardBlock}{nav}{graph}</>}>
            {coachBubble}
            {controls}
            {nextMomentBtn}
            <View style={{ height: space.sm }} />
            {filter}
            <View style={{ height: space.sm }} />
            <MoveList plies={review.plies} idx={idx} inBranch={!!branch} fmt={fmt} onGo={pb.goTo} />
          </BoardLayout>
        ) : (
          <>
            {boardBlock}
            <View style={{ height: space.md }} />
            {coachBubble}
            {controls}
            {nextMomentBtn}
            {graph}
            {filter}
            {nav}
            {moveStrip}
          </>
        )}
      </ScrollView>

      <SettingsSheet
        visible={sheet !== null}
        mode={sheet ?? 'settings'}
        onClose={() => setSheet(null)}
        me={me ?? 'w'}
        onMe={setMe}
        coachId={coach.id}
        onCoach={chooseCoach}
        graph={graph}
        onChooseOther={onBack}
        playing={pb.autoplaying}
        onPlay={() => {
          pb.togglePlay();
          setSheet(null);
        }}
      />
    </View>
  );
}
