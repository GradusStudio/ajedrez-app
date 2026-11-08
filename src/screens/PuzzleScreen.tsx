import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Chess, Square } from 'chess.js';
import { Board, BoardMove } from '../components/Board';
import { Button3D } from '../components/Button3D';
import { Chip } from '../components/Chip';
import { FadeIn } from '../components/FadeIn';
import { FeedbackPanel } from '../components/FeedbackPanel';
import { useFeedback } from '../feedback/feedback';
import { useI18n } from '../i18n/I18nContext';
import { Earned, useProgress } from '../progress/ProgressContext';
import { PuzzleResult } from '../progress/progressStore';
import { displayThemes, Puzzle, puzzleGoal, userColor } from '../puzzles/puzzles';
import { colors, fonts, radius, space } from '../theme';
import { statusBarTop } from '../components/statusBarTop';

type Props = {
  puzzle: Puzzle;
  /** Texto del chip de arriba: "Puzzle del día" o "Práctica · Medio · Horquilla". */
  label: string;
  onExit: () => void;
  /** Solo en práctica: pasa al siguiente puzzle. */
  onNext?: () => void;
};

type Status = 'playing' | 'solved' | 'failed';
type SquareMove = { from: Square; to: Square };

const OPPONENT_DELAY_MS = 700; // pausa antes de cada jugada del rival
const SOLUTION_STEP_MS = 800; // ritmo al mostrar la solución
const FADE_IN_MS = 220; // entrada suave de cada puzzle
const MAX_SESSION_SECONDS = 30 * 60;


const toSquares = (uci: string): SquareMove => ({ from: uci.slice(0, 2) as Square, to: uci.slice(2, 4) as Square });

// Puzzle de Lichess: el rival hace la primera jugada y el usuario busca la solución (mapa-de-pantallas.md, 2.8).
export function PuzzleScreen({ puzzle, label, onExit, onNext }: Props) {
  const { finishPuzzle } = useProgress();
  const { t, tn } = useI18n();
  const feedback = useFeedback();
  const [chess] = useState(() => new Chess(puzzle.fen));
  const [fen, setFen] = useState(puzzle.fen);
  const [ply, setPly] = useState(0); // jugadas de la línea ya hechas (la 0 es la del rival)
  const [lastMove, setLastMove] = useState<SquareMove | null>(null);
  const [status, setStatus] = useState<Status>('playing');
  const [errors, setErrors] = useState(0);
  const [earned, setEarned] = useState<Earned | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  // Jugada equivocada que quedó en el tablero hasta tocar "Reintentar".
  const [wrongMove, setWrongMove] = useState<SquareMove | null>(null);
  const [fade] = useState(() => new Animated.Value(0));
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const startedAt = useRef(0);
  // Un toque doble o «ver solución» tras el acierto no cobra otra vez.
  const finished = useRef(false);
  // «Reintentar» deshace una sola jugada aunque se toque dos veces antes de que la pantalla se redibuje.
  const hasWrongMove = useRef(false);

  const me = userColor(puzzle);
  const moves = puzzle.moves;
  const userTurn = status === 'playing' && ply % 2 === 1 && ply < moves.length;
  const expected = userTurn ? moves[ply] : undefined;

  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };

  /** Aplica la jugada `i` de la línea del puzzle. */
  const apply = (i: number) => {
    const uci = moves[i];
    try {
      chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
    } catch {
      return;
    }
    setFen(chess.fen());
    setLastMove(toSquares(uci));
    setPly(i + 1);
  };

  // Al abrir: entra con un fundido y el rival hace la primera jugada.
  useEffect(() => {
    startedAt.current = Date.now();
    Animated.timing(fade, { toValue: 1, duration: FADE_IN_MS, useNativeDriver: true }).start();
    const opponent = setTimeout(() => apply(0), OPPONENT_DELAY_MS);
    const pending = timers.current;
    return () => {
      clearTimeout(opponent);
      pending.forEach(clearTimeout);
    };
    // Solo al montar: `apply` usa el `chess` de este puzzle.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finish = (result: PuzzleResult) => {
    if (finished.current) return;
    finished.current = true;
    if (result !== 'failed') feedback.correct();
    setStatus(result === 'failed' ? 'failed' : 'solved');
    setEarned(finishPuzzle(puzzle.id, result, Math.min((Date.now() - startedAt.current) / 1000, MAX_SESSION_SECONDS)));
  };

  const handleMove = (m: BoardMove) => {
    if (!expected || wrongMove) return;
    // Como en Lichess: cualquier jugada que dé mate también resuelve el puzzle.
    const probe = new Chess(chess.fen());
    let mates = false;
    try {
      probe.move({ from: m.from, to: m.to, promotion: m.promotion });
      mates = probe.isCheckmate();
    } catch {
      return;
    }
    // En una coronación también cuenta la pieza elegida (la solución puede ser coronar a caballo).
    const correct = `${m.from}${m.to}${m.promotion ?? ''}` === expected || mates;

    chess.move({ from: m.from, to: m.to, promotion: m.promotion });
    setFen(chess.fen());
    setLastMove({ from: m.from, to: m.to });
    setShowHint(false);

    if (!correct) {
      // La jugada queda en el tablero; "Reintentar" la deshace.
      feedback.wrong();
      setErrors((e) => e + 1);
      hasWrongMove.current = true;
      setWrongMove({ from: m.from, to: m.to });
      return;
    }
    const next = ply + 1;
    setPly(next);
    if (mates || next >= moves.length) {
      finish(errors === 0 && !hintUsed ? 'clean' : 'solved');
    } else {
      later(() => apply(next), OPPONENT_DELAY_MS);
    }
  };

  /** Deshace la jugada equivocada y vuelve a la posición anterior. */
  const retry = () => {
    if (!hasWrongMove.current) return;
    hasWrongMove.current = false;
    chess.undo();
    setFen(chess.fen());
    setLastMove(ply > 0 ? toSquares(moves[ply - 1]) : null);
    setWrongMove(null);
  };

  const hint = () => {
    setHintUsed(true);
    setShowHint(true);
  };

  const showSolution = () => {
    setShowHint(false);
    finish('failed');
    for (let i = ply, step = 1; i < moves.length; i++, step++) {
      const index = i;
      later(() => apply(index), SOLUTION_STEP_MS * step);
    }
  };

  const side = me === 'w' ? t('common.whiteToMove') : t('common.blackToMove');
  const done = status !== 'playing';

  /** Frases de las monedas ganadas, para sumar al mensaje del panel. */
  const coinsMessage = (e: Earned | null) =>
    [
      e?.coins ? tn('puzzles.earnedCoins', e.coins) : '',
      e?.dailyBonus ? t('common.dailyBonus', { n: e.dailyBonus }) : '',
      e?.streakRecovered ? t('common.streakRecovered') : '',
    ].filter(Boolean);

  return (
    <Animated.View style={[styles.screen, { opacity: fade }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: statusBarTop(space.sm) }]}>
        <View style={styles.topRow}>
          <Pressable onPress={onExit} accessibilityRole="button" accessibilityLabel={t('puzzles.exit')} hitSlop={12}>
            <Text style={styles.close}>✕</Text>
          </Pressable>
          <Chip label={label} />
        </View>

        <Board
          fen={fen}
          orientation={me}
          interactive={userTurn && !wrongMove}
          lastMove={lastMove}
          highlight={showHint && expected ? [expected.slice(0, 2)] : undefined}
          onMove={handleMove}
        />

        <Text style={styles.prompt}>{t('puzzles.prompt', { side, goal: puzzleGoal(puzzle, t) })}</Text>
        <Text style={styles.meta}>
          {ply === 0 ? t('puzzles.opponentToPlay') : done ? t('common.level', { n: puzzle.rating }) : t('common.yourTurn')}
        </Text>

        {done && displayThemes(puzzle, t).length > 0 && (
          <View style={styles.chips}>
            {displayThemes(puzzle, t).map((name) => (
              <Chip key={name} label={name} />
            ))}
          </View>
        )}

        {/* En el lugar de los botones: el aviso de error con "Reintentar", o Pista / Ver solución. */}
        {!done && wrongMove && (
          <FadeIn style={styles.wrongCard}>
            <View accessibilityLiveRegion="polite">
              <Text style={styles.wrongTitle}>{t('common.incorrect')}</Text>
              <Text style={styles.wrongText}>{t('puzzles.wrongText')}</Text>
              <Button3D label={t('common.retry')} variant="danger" onPress={retry} style={{ marginTop: space.md }} />
            </View>
          </FadeIn>
        )}
        {!done && !wrongMove && (
          <View style={styles.actions}>
            <Button3D label={t('puzzles.hint')} onPress={hint} style={{ flex: 1 }} />
            <Button3D label={t('puzzles.showSolution')} variant="destructive" onPress={showSolution} style={{ flex: 1 }} />
          </View>
        )}

      </ScrollView>

      {status === 'solved' && (
        <FeedbackPanel
          kind="correct"
          title={t('puzzles.solved')}
          message={[
            errors === 0 && !hintUsed ? t('puzzles.solvedClean') : errors > 0 ? tn('puzzles.solvedErrors', errors) : t('puzzles.solvedHint'),
            ...coinsMessage(earned),
          ].join(' ')}
          buttonLabel={onNext ? t('puzzles.next') : t('common.continue')}
          onButton={onNext ?? onExit}
        />
      )}
      {status === 'failed' && (
        <FeedbackPanel
          kind="neutral"
          title={t('puzzles.solution')}
          message={[t('puzzles.solutionMessage'), ...coinsMessage(earned)].join(' ')}
          buttonLabel={onNext ? t('puzzles.next') : t('common.continue')}
          onButton={onNext ?? onExit}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xl },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.md },
  close: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.textMuted },
  prompt: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.text, marginTop: space.lg },
  meta: { fontFamily: fonts.semibold, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginTop: space.sm },
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
  wrongText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text, marginTop: 4, lineHeight: 21 },
});
