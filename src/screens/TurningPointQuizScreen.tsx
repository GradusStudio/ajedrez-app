import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StatusBar as RNStatusBar, StyleSheet, Text, View } from 'react-native';
import { Chess, Square } from 'chess.js';
import { Board, BoardMove } from '../components/Board';
import { BotAvatar } from '../components/BotAvatar';
import type { BotExpression } from '../components/botFace';
import { Button3D } from '../components/Button3D';
import { Chip } from '../components/Chip';
import { FadeIn } from '../components/FadeIn';
import { FeedbackPanel } from '../components/FeedbackPanel';
import { resolveNotation, sanFromEnglish } from '../chess/notation';
import { bots } from '../data/bots';
import { pickPhrase } from '../data/teachers';
import { useContent } from '../data/useContent';
import { useFeedback } from '../feedback/feedback';
import { useI18n } from '../i18n/I18nContext';
import { useProgress } from '../progress/ProgressContext';
import { isQuizAnswer, peekPendingQuiz, turningPointKey } from '../review/turningPoints';
import { useSettings } from '../settings/SettingsContext';
import { colors, fonts, radius, space } from '../theme';

type Props = { onExit: () => void };
type SquareMove = { from: Square; to: Square };
type Status = 'playing' | 'solved' | 'shown';

const toSquares = (uci: string): SquareMove => ({ from: uci.slice(0, 2) as Square, to: uci.slice(2, 4) as Square });

function play(fen: string, uci: string): string | null {
  const chess = new Chess(fen);
  try {
    chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
  } catch {
    return null;
  }
  return chess.fen();
}

/**
 * Quiz de puntos de giro: las peores jugadas del usuario en la partida revisada, como puzzles.
 * Solo vale la mejor jugada del motor. Lee la revisión ya hecha (no analiza nada).
 */
export function TurningPointQuizScreen({ onExit }: Props) {
  const { t, tn, language } = useI18n();
  const { settings } = useSettings();
  const { findBot } = useContent();
  const { finishTurningPoint } = useProgress();
  const feedback = useFeedback();
  const notation = resolveNotation(settings.notation, language);
  const fmt = (san: string) => sanFromEnglish(san, notation);

  const quiz = useMemo(() => peekPendingQuiz(), []);
  const coach = findBot(quiz?.coachId ?? '') ?? bots[0];
  const closing = useMemo(() => pickPhrase(coach.teaching.close), [coach]);

  const [index, setIndex] = useState(0);
  const [fen, setFen] = useState(() => quiz?.points[0]?.fen ?? '');
  const [lastMove, setLastMove] = useState<SquareMove | null>(null);
  const [status, setStatus] = useState<Status>('playing');
  const [wrongMove, setWrongMove] = useState<SquareMove | null>(null);
  const [errors, setErrors] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [found, setFound] = useState(0);
  const [coins, setCoins] = useState(0);
  const [lastCoins, setLastCoins] = useState(0);
  const [ended, setEnded] = useState(false);

  const points = quiz?.points ?? [];
  const tp = points[index];

  if (!quiz || !tp) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Text style={styles.muted}>{t('review.invalid')}</Text>
        <View style={{ height: space.lg }} />
        <Button3D label={t('common.continue')} onPress={onExit} />
      </View>
    );
  }

  const handleMove = (m: BoardMove) => {
    if (status !== 'playing' || wrongMove) return;
    const uci = `${m.from}${m.to}${m.promotion ?? ''}`;
    const next = play(tp.fen, uci);
    if (!next) return;
    setFen(next);
    setLastMove({ from: m.from, to: m.to });
    if (!isQuizAnswer(tp, uci)) {
      feedback.wrong();
      setErrors((e) => e + 1);
      setWrongMove({ from: m.from, to: m.to });
      return;
    }
    feedback.correct();
    const earned = finishTurningPoint(turningPointKey(tp), errors === 0 && !hintUsed);
    setFound((n) => n + 1);
    setCoins((c) => c + earned);
    setLastCoins(earned);
    setStatus('solved');
  };

  /** Deshace la jugada equivocada y marca la pieza que hay que mover. */
  const retry = () => {
    setFen(tp.fen);
    setLastMove(null);
    setWrongMove(null);
    setHintUsed(true);
  };

  const showSolution = () => {
    setFen(play(tp.fen, tp.bestUci) ?? tp.fen);
    setLastMove(toSquares(tp.bestUci));
    setLastCoins(0);
    setStatus('shown');
  };

  const goNext = () => {
    const i = index + 1;
    if (i >= points.length) return setEnded(true);
    setIndex(i);
    setFen(points[i].fen);
    setLastMove(null);
    setStatus('playing');
    setWrongMove(null);
    setErrors(0);
    setHintUsed(false);
  };

  const top = (
    <View style={styles.topRow}>
      <Pressable onPress={onExit} accessibilityRole="button" accessibilityLabel={t('puzzles.exit')} hitSlop={12}>
        <Text style={styles.close}>✕</Text>
      </Pressable>
      <Chip label={ended ? t('quiz.title') : `${t('quiz.title')} · ${t('quiz.progress', { n: index + 1, total: points.length })}`} />
    </View>
  );

  const bubble = (expression: BotExpression, title: string, text: string) => (
    <View style={styles.coachRow}>
      <BotAvatar bot={coach} size={64} expression={expression} />
      <View style={styles.bubble} accessibilityLiveRegion="polite">
        <Text style={styles.bubbleTitle}>{title}</Text>
        {text ? <Text style={styles.bubbleText}>{text}</Text> : null}
      </View>
    </View>
  );

  if (ended) {
    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={[styles.content, { paddingTop: (RNStatusBar.currentHeight ?? 40) + space.sm }]}>
          {top}
          <FadeIn>
            {bubble(
              found > 0 ? 'acierto' : 'explica',
              t('quiz.found', { n: found, total: points.length }),
              [coins > 0 ? tn('puzzles.earnedCoins', coins) : '', closing].filter(Boolean).join(' ')
            )}
          </FadeIn>
        </ScrollView>
        <View style={styles.bottomBar}>
          <Button3D label={t('quiz.back')} variant="primary" onPress={onExit} style={{ flex: 1 }} />
        </View>
      </View>
    );
  }

  const best = fmt(tp.bestSan);
  const face: BotExpression = status === 'solved' ? 'acierto' : wrongMove || hintUsed ? 'pista' : status === 'shown' ? 'explica' : 'piensa';
  const bubbleText = wrongMove
    ? t('quiz.wrong')
    : status === 'playing' && hintUsed
      ? t('quiz.hintText')
      : t(tp.quality === 'blunder' ? 'quiz.playedBlunder' : 'quiz.playedMistake', { move: fmt(tp.playedSan) });

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: (RNStatusBar.currentHeight ?? 40) + space.sm }]}>
        {top}
        {bubble(face, t('quiz.prompt'), bubbleText)}
        <View style={{ height: space.md }} />
        <Board
          key={index}
          fen={fen}
          orientation={quiz.me}
          interactive={status === 'playing' && !wrongMove}
          lastMove={lastMove}
          highlight={status === 'playing' && hintUsed && !wrongMove ? [tp.bestUci.slice(0, 2)] : undefined}
          onMove={handleMove}
        />

        {status === 'playing' && wrongMove && (
          <FadeIn style={styles.wrongCard}>
            <Text style={styles.wrongTitle}>{t('common.incorrect')}</Text>
            <Button3D label={t('common.retry')} variant="danger" onPress={retry} style={{ marginTop: space.md }} />
          </FadeIn>
        )}
        {status === 'playing' && !wrongMove && (
          <View style={styles.actions}>
            <Button3D label={t('puzzles.hint')} onPress={() => setHintUsed(true)} style={{ flex: 1 }} />
            <Button3D label={t('puzzles.showSolution')} variant="destructive" onPress={showSolution} style={{ flex: 1 }} />
          </View>
        )}
      </ScrollView>

      {status !== 'playing' && (
        <FeedbackPanel
          kind={status === 'solved' ? 'correct' : 'neutral'}
          title={status === 'solved' ? t('quiz.correct', { move: best }) : t('quiz.solution', { move: best })}
          message={status === 'solved' && lastCoins > 0 ? tn('puzzles.earnedCoins', lastCoins) : ''}
          buttonLabel={index + 1 < points.length ? t('quiz.next') : t('quiz.finish')}
          onButton={goNext}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center', padding: space.lg },
  muted: { fontFamily: fonts.semibold, fontSize: 14, color: colors.textMuted },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xl },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.md },
  close: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.textMuted },
  coachRow: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  bubble: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.control, padding: space.md, minHeight: 64 },
  bubbleTitle: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.text },
  bubbleText: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: colors.textMuted, marginTop: 4 },
  actions: { flexDirection: 'row', gap: space.sm, marginTop: space.lg },
  wrongCard: {
    marginTop: space.lg,
    backgroundColor: colors.incorrectBg,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.danger,
    borderBottomWidth: 4,
    borderBottomColor: colors.dangerShadow,
    paddingVertical: space.md,
    paddingHorizontal: 14,
  },
  wrongTitle: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.danger },
  bottomBar: { flexDirection: 'row', paddingHorizontal: space.lg, paddingVertical: space.md, borderTopWidth: 1, borderTopColor: colors.outline },
});
