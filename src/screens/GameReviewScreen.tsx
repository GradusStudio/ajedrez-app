import React, { useEffect, useMemo, useState } from 'react';
import { StatusBar as RNStatusBar, ScrollView, Text, View } from 'react-native';
import { Square } from 'chess.js';
import { Board } from '../components/Board';
import { Button3D } from '../components/Button3D';
import { EvalBar } from '../components/EvalBar';
import { resolveNotation, sanFromEnglish } from '../chess/notation';
import { useI18n } from '../i18n/I18nContext';
import { useSettings } from '../settings/SettingsContext';
import { coachExplanation, coachLang, coachVoice } from '../review/coachText';
import { parseGame } from '../review/pgn';
import { clearPendingGame, peekPendingGame, sideOf } from '../review/session';
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

type Props = { onBack: () => void };

const topInset = () => (RNStatusBar.currentHeight ?? 40) + space.sm;

export function GameReviewScreen({ onBack }: Props) {
  const { t, tn, language } = useI18n();
  const { settings } = useSettings();
  const notation = resolveNotation(settings.notation, language);
  const decimal = language === 'en' ? '.' : ',';
  const fmt = (san: string) => sanFromEnglish(san, notation);

  const pending = useMemo(() => peekPendingGame(), []);
  const game = useMemo(() => (pending ? parseGame(pending.pgn) : null), [pending]);
  useEffect(() => () => clearPendingGame(), []);

  const { engine, engineError, engineView, review, progress, failed, retry } = useReviewAnalysis(game);
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
      <View style={[styles.screen, styles.center, { paddingTop: RNStatusBar.currentHeight ?? 40 }]}>
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
      <AnalyzingView down={!!engineError || failed} engineReady={!!engine} progress={progress} onBack={onBack} onRetry={retry} />
    );
  }

  // ── Lo que se ve ahora: jugada de la partida o jugada propia ──
  const ply = lastVar ? (lastVar.rated ?? undefined) : idx > 0 ? review.plies[idx - 1] : undefined;
  const pendingOwn = !!lastVar && !lastVar.rated;
  const shownMove = lastVar ? lastVar.move : ply?.move;
  const lastMove = shownMove ? { from: shownMove.uci.slice(0, 2) as Square, to: shownMove.uci.slice(2, 4) as Square } : null;
  const mine = lastVar ? true : ply ? ply.move.color === me : true;
  const bad = !!ply && isBad(ply.quality);
  const badge = ply ? badgeOf(ply) : null;
  const colorArrows: { move: string; color: string }[] = [];
  if (ply && bad && ply.replyUci) colorArrows.push({ move: ply.replyUci.slice(0, 4), color: REPLY_ARROW });
  if (ply && pb.showBest && ply.bestUci) colorArrows.push({ move: ply.bestUci.slice(0, 4), color: BEST_ARROW });

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

  let details: string[] = [];
  if (pb.showBest && ply) {
    const lines = coachExplanation({
      lang: coachLang(language),
      subject: mine ? 'you' : 'opponent',
      quality: ply.quality,
      facts: ply.facts,
      move: san,
      bestSan: ply.bestSan,
      fmt,
    });
    details = lines.length > 0 ? lines : ply.bestSan ? [t('review.bestWas', { move: fmt(ply.bestSan) })] : [];
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
      voice={voice}
      details={details}
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
          fen={fen}
          orientation={me}
          interactive={!pb.fast && !pb.autoplaying}
          onMove={playOwn}
          lastMove={lastMove}
          colorArrows={colorArrows}
          badge={ply && badge && lastMove ? { square: lastMove.to, color: badge.color, label: badge.label } : undefined}
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
