import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Square } from 'chess.js';
import { Board } from '../components/Board';
import { Button3D } from '../components/Button3D';
import { EvalBar } from '../components/EvalBar';
import { resolveNotation, sanFromEnglish } from '../chess/notation';
import { useI18n } from '../i18n/I18nContext';
import { useSettings } from '../settings/SettingsContext';
import { coachExplanation, coachLang, coachVoice } from '../review/coachText';
import { lineMoves, lineText } from '../review/bestLine';
import { parseGame } from '../review/pgn';
import { clearPendingGame, peekPendingGame, sideOf } from '../review/session';
import { setPendingQuiz, turningPoints } from '../review/turningPoints';
import { isBad } from '../review/types';
import { space } from '../theme';
import { AnalyzingView } from './review/AnalyzingView';
import { CoachBubble } from './review/CoachBubble';
import { EvalGraph } from './review/EvalGraph';
import { MoveStrip } from './review/MoveStrip';
import { badgeOf, BEST_ARROW, faceFor, REPLY_ARROW, titleKey } from './review/quality';
import { ToolBtn, TopBar } from './review/ReviewParts';
import { styles } from './review/reviewStyles';
import { SettingsSheet } from './review/SettingsSheet';
import { SummaryView } from './review/SummaryView';
import { useBranchPlay } from './review/useBranchPlay';
import { useReviewAnalysis } from './review/useReviewAnalysis';
import { useReviewCoach } from './review/useReviewCoach';
import { useReviewPlayback } from './review/useReviewPlayback';
import { statusBarTop } from '../components/statusBarTop';

type Props = { onBack: () => void; onPractice: () => void };

const topInset = () => statusBarTop(space.sm);

export function GameReviewScreen({ onBack, onPractice }: Props) {
  const { t, tn, language } = useI18n();
  const { settings } = useSettings();
  const notation = resolveNotation(settings.notation, language);
  const decimal = language === 'en' ? '.' : ',';
  const fmt = (san: string) => sanFromEnglish(san, notation);

  const pending = useMemo(() => peekPendingGame(), []);
  const game = useMemo(() => (pending ? parseGame(pending.pgn) : null), [pending]);
  useEffect(() => () => clearPendingGame(), []);

  const { engine, engineError, engineView, review, progress, phase, failed, retry } = useReviewAnalysis(game);
  const n = review?.plies.length ?? 0;
  const pb = useReviewPlayback(n, review?.highlights ?? []);
  const { coach, choose: chooseCoach } = useReviewCoach();
  const [me, setMe] = useState<'w' | 'b'>(() => (game ? sideOf(pending?.username, game.white, game.black) ?? 'w' : 'w'));
  const [started, setStarted] = useState(false);
  const [sheet, setSheet] = useState(false);

  const { idx, lastVar, branch } = pb;
  const fen =
    !game || !review ? '' : lastVar ? lastVar.move.fenAfter : idx === 0 ? game.startFen : review.plies[idx - 1].move.fenAfter;
  const playOwn = useBranchPlay(review, engine, pb, fen);

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
      <AnalyzingView down={!!engineError || failed} engineReady={!!engine} progress={progress} phase={phase} onBack={onBack} onRetry={retry} />
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
  const mine = lastVar ? true : ply ? ply.move.color === me : true;
  const bad = !!ply && isBad(ply.quality);
  const badge = ply ? badgeOf(ply) : null;
  const colorArrows: { move: string; color: string }[] = [];
  if (!pv && ply && bad && ply.replyUci) colorArrows.push({ move: ply.replyUci.slice(0, 4), color: REPLY_ARROW });
  if (!pv && ply && pb.showBest && ply.bestUci) colorArrows.push({ move: ply.bestUci.slice(0, 4), color: BEST_ARROW });

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
    // Quiz de puntos de giro: pantalla aparte que solo lee esta revisión. Solo si se sabe de qué bando jugó el usuario.
    const points = sideOf(pending?.username, game.white, game.black) ? turningPoints(review, me) : [];
    return shell(
      <SummaryView
        top={<TopBar onBack={onBack} />}
        bubble={coachBubble}
        graph={graph}
        review={review}
        me={me}
        nameOf={nameOf}
        decimal={decimal}
        onStart={() => {
          pb.goTo(0);
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
    );
  }

  // ── Revisión jugada a jugada ──
  const canBest = bad && !!ply?.bestSan;
  return shell(
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: topInset() }]}>
        <TopBar onBack={onBack} onSettings={() => setSheet(true)} />
        {coachBubble}
        <View style={{ height: space.md }} />
        <EvalBar score={scoreHere} decimal={decimal} />
        <Board
          fen={shownFen}
          orientation={me}
          interactive={!pb.fast && !pb.autoplaying && !pv}
          onMove={playOwn}
          lastMove={lastMove}
          colorArrows={colorArrows}
          badge={!pv && ply && badge && lastMove ? { square: lastMove.to, color: badge.color, label: badge.label } : undefined}
        />
        <MoveStrip
          plies={review.plies}
          idx={idx}
          inBranch={!!branch}
          fmt={fmt}
          onGo={pb.goTo}
          onPrev={pb.stepBack}
          onNext={pb.stepForward}
        />
      </ScrollView>

      {/* Barra inferior: Mejor · Reproducir · Siguiente / Finalizar */}
      <View style={styles.bottomBar}>
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
          label={t(idx >= n && !branch ? 'review.finish' : 'review.next')}
          variant="primary"
          onPress={() => pb.next(onBack)}
          style={{ flex: 1.5 }}
        />
      </View>

      <SettingsSheet
        visible={sheet}
        onClose={() => setSheet(false)}
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
