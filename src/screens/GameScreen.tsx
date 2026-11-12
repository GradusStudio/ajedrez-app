import React, { useCallback, useEffect, useRef, useState } from 'react';
import { showDialog } from '../components/dialog';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Chess, Square } from 'chess.js';
import { detectOpening } from '../bots/book';
import { enginesFor, thinkMove } from '../bots/brain';
import { movesText, resolveNotation } from '../chess/notation';
import { Board, BoardMove } from '../components/Board';
import { BotAvatar } from '../components/BotAvatar';
import { Button3D } from '../components/Button3D';
import { Chip } from '../components/Chip';
import { StatIcon } from '../components/StatIcon';
import { Bot } from '../data/bots';
import { OpeningCourse } from '../data/lessonTypes';
import { EngineView } from '../engine/EngineView';
import { MaiaEngine } from '../engine/maia/maiaEngine';
import { MaiaView } from '../engine/maia/MaiaView';
import { UciEngine } from '../engine/uci';
import { useFeedback } from '../feedback/feedback';
import { useProgress } from '../progress/ProgressContext';
import { replayMoves, uciMoves } from '../progress/ongoingGame';
import { ownsOngoing, shouldSaveOngoing } from '../progress/ongoingGuard';
import { gameCountsForStreak } from '../progress/streak';
import { useI18n } from '../i18n/I18nContext';
import { es, MessageKey } from '../i18n/es';
import { botGamePgn } from '../review/botGame';
import { setPendingGame } from '../review/session';
import { useSettings } from '../settings/SettingsContext';
import { colors, fonts, radius, space } from '../theme';
import { statusBarTop } from '../components/statusBarTop';
import { BoardLayout, useBoardLayoutWidth } from '../components/BoardLayout';
import { useWideLayout } from '../components/useWideLayout';

/** Alto fuera del tablero en pantalla ancha: la fila de arriba y los márgenes (el resultado va en el panel). */
const GAME_RESERVE = 110;

type Props = {
  bot: Bot;
  userColor: 'w' | 'b';
  /** Modo práctica: el bot sigue la línea de esta apertura mientras el usuario la respete. */
  practiceCourse?: OpeningCourse;
  /** Partida guardada que se retoma: jugadas UCI desde el inicio y cuándo se empezó. Sin ellas, empieza de cero. */
  initialMoves?: string[];
  initialStartedAt?: string;
  onExit: () => void;
  onRematch: () => void;
  onOtherBot: () => void;
  onAnalyze: () => void;
};

// `reason` es una clave de es.ts; en el historial se guarda su texto en español, como antes.
type Result = { kind: 'win' | 'loss' | 'draw'; reason: MessageKey };
// Resultado ya guardado, con las monedas ganadas (victoria), el premio del día y si se recuperó la racha.
type Finished = Result & { coins: number; dailyBonus: number; streakRecovered: boolean };

// Tope del tiempo de práctica por partida, por si la app queda abierta sin usar.
const MAX_SESSION_SECONDS = 30 * 60;
// Frases del bot: "buena jugada" como mucho cada 3 jugadas suyas.
const GOOD_MOVE_EVERY = 3;
// Cambio de evaluación (centipeones, desde el bot) que dispara cada frase.
const BLUNDER_DELTA = 200;
const GOOD_MOVE_DELTA = 150;

/** Identidad de la partida de esta pantalla para decidir si puede escribir la guardada (ver ongoingGuard.ts). */
const idOf = (startedIso: string) => (startedIso ? { startedAt: startedIso } : null);

// Partida contra un bot (mapa-de-pantallas.md, 2.10).
export function GameScreen({ bot, userColor, practiceCourse, initialMoves, initialStartedAt, onExit, onRematch, onOtherBot, onAnalyze }: Props) {
  const { finishGame, saveOngoingGame, getProgress } = useProgress();
  const { settings } = useSettings();
  const { language, t } = useI18n();
  const feedback = useFeedback();
  // Si se retoma una partida, se rearma con sus jugadas (partida.tsx ya comprobó que son legales; si no, empieza de cero).
  const [chess] = useState(() => (initialMoves?.length ? replayMoves(initialMoves) : null) ?? new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(() => {
    const last = chess.history({ verbose: true }).at(-1);
    return last ? { from: last.from, to: last.to } : null;
  });
  const [engine, setEngine] = useState<UciEngine | null>(null);
  const [engineError, setEngineError] = useState<string | null>(null);
  const [engineKey, setEngineKey] = useState(0);
  const [maia, setMaia] = useState<MaiaEngine | null>(null);
  // Maia no arrancó o se cayó y el bot sigue con su motor de respaldo de Stockfish (bots.ts, `fallback`).
  const [maiaFailed, setMaiaFailed] = useState(false);
  // Motores del bot: Maia y, para el seguro de los más fuertes (o un bot sin Maia), Stockfish.
  const needs = enginesFor(bot);
  const ready = (!needs.maia || !!maia || maiaFailed) && (!needs.stockfish || !!engine);
  const [speech, setSpeech] = useState(
    practiceCourse ? t('game.practiceSpeech', { name: practiceCourse.name }) : bot.lines.greeting
  );
  const [result, setResult] = useState<Finished | null>(null);

  const botColor = userColor === 'w' ? 'b' : 'w';
  const startedAt = useRef(0); // se fija al montar: el render tiene que ser puro
  const alive = useRef(true);
  const prevScore = useRef<number | undefined>(undefined); // evaluación de la última jugada del bot
  const sincePhrase = useRef(0);
  const inBook = useRef(!initialMoves?.length);
  const startedIso = useRef(initialStartedAt ?? ''); // fecha de inicio de la partida guardada; se completa al montar
  const finished = useRef(false); // la partida se guarda una sola vez
  // Al retomar con «Continuar» la partida ya estaba guardada: si desapareció antes de la primera jugada (terminada o
  // borrada en otro dispositivo) no se vuelve a guardar. Una partida nueva sí guarda su primera vez.
  const savedOngoing = useRef(!!initialStartedAt);

  useEffect(() => {
    startedAt.current = Date.now();
    if (!startedIso.current) startedIso.current = new Date().toISOString();
    return () => {
      alive.current = false;
    };
  }, []);

  const uciHistory = () => uciMoves(chess);
  const sans = chess.history();
  const opening = detectOpening(uciHistory());

  const sync = () => {
    setFen(chess.fen());
    const h = chess.history({ verbose: true });
    const last = h[h.length - 1];
    setLastMove(last ? { from: last.from, to: last.to } : null);
  };

  const end = useCallback(
    // quit: se rindió o abandonó (cuenta para la racha solo con 10 jugadas o más).
    (r: Result, quit = false) => {
      if (finished.current) return;
      finished.current = true;
      // Solo se quita lo guardado si es esta misma partida: otro dispositivo pudo haber empezado otra.
      if (ownsOngoing(getProgress().ongoingGame, idOf(startedIso.current))) saveOngoingGame(null);
      if (r.kind === 'win') feedback.correct();
      else if (r.kind === 'loss') feedback.wrong();
      setSpeech(r.kind === 'win' ? bot.lines.onLose : r.kind === 'loss' ? bot.lines.onWin : t('game.drawSpeech'));
      const earned = finishGame(
        {
          botId: bot.id,
          userColor,
          result: r.kind,
          reason: es[r.reason],
          moves: uciMoves(chess),
          practiceCourseId: practiceCourse?.id,
        },
        Math.min((Date.now() - startedAt.current) / 1000, MAX_SESSION_SECONDS),
        bot.elo,
        gameCountsForStreak(quit, chess.history().length)
      );
      setResult({ ...r, ...earned });
    },
    [bot, chess, finishGame, saveOngoingGame, getProgress, practiceCourse, userColor, feedback, t]
  );

  /** Lleva la partida recién jugada a la misma revisión que las partidas importadas. */
  const analyze = () => {
    if (!result) return;
    const userName = t('game.you');
    setPendingGame({
      pgn: botGamePgn({ moves: uciMoves(chess), userColor, userName, botName: bot.name, kind: result.kind }),
      username: userName,
    });
    onAnalyze();
  };

  /** Después de cada jugada (del usuario o del bot): si la partida terminó la cierra y, si sigue, la guarda para continuarla. */
  const checkEnd = () => {
    checkResult();
    // `getProgress` lee lo último guardado (con lo que llegó de otros dispositivos). Si otro dispositivo retomó, terminó o
    // reemplazó la partida, esta pantalla sigue jugando pero deja de escribirla.
    if (!finished.current && shouldSaveOngoing(getProgress().ongoingGame, idOf(startedIso.current), savedOngoing.current)) {
      savedOngoing.current = true;
      saveOngoingGame({ botId: bot.id, userColor, practiceCourseId: practiceCourse?.id, moves: uciMoves(chess), startedAt: startedIso.current });
    }
  };

  const checkResult = () => {
    if (chess.isCheckmate()) {
      end({ kind: chess.turn() === userColor ? 'loss' : 'win', reason: 'game.reason.checkmate' });
    } else if (chess.isStalemate()) {
      end({ kind: 'draw', reason: 'game.reason.stalemate' });
    } else if (chess.isInsufficientMaterial()) {
      end({ kind: 'draw', reason: 'game.reason.insufficient' });
    } else if (chess.isThreefoldRepetition()) {
      end({ kind: 'draw', reason: 'game.reason.threefold' });
    } else if (chess.isDraw()) {
      end({ kind: 'draw', reason: 'game.reason.fifty' });
    }
  };

  // Turno del bot.
  useEffect(() => {
    if (!ready || result || chess.turn() !== botColor) return;
    let cancelled = false;
    thinkMove({ maia, stockfish: engine }, bot, { fen: chess.fen(), history: uciHistory(), botColor, practiceCourseId: practiceCourse?.id }).then(
      (move) => {
        if (cancelled || !alive.current) return;
        if (!move.fromBook && inBook.current) {
          inBook.current = false;
          if (practiceCourse) setSpeech(t('game.leftBook'));
        }
        // Frases según cómo cambió la evaluación desde su jugada anterior.
        if (!move.fromBook && move.score !== undefined) {
          if (prevScore.current !== undefined) {
            const delta = move.score - prevScore.current;
            if (delta >= BLUNDER_DELTA) {
              setSpeech(bot.lines.onBlunder);
              sincePhrase.current = 0;
            } else if (delta <= -GOOD_MOVE_DELTA && sincePhrase.current >= GOOD_MOVE_EVERY) {
              setSpeech(bot.lines.onGoodMove);
              sincePhrase.current = 0;
            }
          }
          prevScore.current = move.score;
        }
        sincePhrase.current++;
        try {
          chess.move({ from: move.uci.slice(0, 2), to: move.uci.slice(2, 4), promotion: move.uci[4] ?? 'q' });
        } catch {
          return;
        }
        sync();
        checkEnd();
      },
      () => {} // motor caído: se muestra "Reintentar" y este efecto vuelve a correr con el motor nuevo
    );
    return () => {
      cancelled = true;
    };
    // checkEnd, sync y uciHistory leen `chess`, que no cambia; el turno depende de `fen`. `ready` pasa a true
    // cuando ya están los motores del bot (`maia` y `engine`), y no cambian mientras dura.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, fen, result]);

  const onUserMove = (m: BoardMove) => {
    if (result || !ready || chess.turn() !== userColor) return;
    try {
      chess.move({ from: m.from, to: m.to, promotion: m.promotion });
    } catch {
      return;
    }
    sync();
    checkEnd();
  };

  const resign = () =>
    showDialog(t('game.resign.title'), t('game.resign.message'), [
      { text: t('game.keepPlaying'), style: 'cancel' },
      { text: t('game.resign.confirm'), style: 'destructive', onPress: () => end({ kind: 'loss', reason: 'game.reason.resigned' }, true) },
    ]);

  const offerDraw = () => {
    // Acepta si no está ganando y ya se jugó un buen rato, o si está claramente perdido.
    const score = prevScore.current ?? 0;
    if ((score <= 50 && chess.moveNumber() >= 20) || score <= -300) {
      end({ kind: 'draw', reason: 'game.reason.agreed' });
    } else {
      setSpeech(t('game.drawRefused', { name: bot.name }));
    }
  };

  const exit = () => {
    if (result || chess.history().length === 0) {
      onExit();
      return;
    }
    showDialog(t('game.abandon.title'), t('game.abandon.message'), [
      { text: t('game.keepPlaying'), style: 'cancel' },
      {
        text: t('game.abandon.confirm'),
        style: 'destructive',
        onPress: () => {
          end({ kind: 'loss', reason: 'game.reason.abandoned' }, true);
          onExit();
        },
      },
    ]);
  };

  // El botón "atrás" de Android pide la misma confirmación que la ✕.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      exit();
      return true;
    });
    return () => sub.remove();
  });

  const userTurn = ready && !result && chess.turn() === userColor;
  const thinking = ready && !result && chess.turn() === botColor;
  const status = engineError
    ? t('game.status.engineDown')
    : !ready
      ? t('game.status.preparing', { name: bot.name })
      : result
        ? t('game.status.over')
        : thinking
          ? t('game.status.thinking')
          : t('game.status.yourTurn');

  // Pantalla ancha (web): el tablero va a la izquierda y todo lo demás en un panel a la derecha (BoardLayout).
  const wide = useWideLayout();
  const contentWidth = useBoardLayoutWidth(GAME_RESERVE);

  const board = <Board fen={fen} orientation={userColor} interactive={userTurn} lastMove={lastMove} onMove={onUserMove} />;
  const botBlock = (
    <>
      <View style={styles.playerRow}>
        <BotAvatar bot={bot} size={40} />
        <View style={{ flex: 1 }}>
          <Text style={styles.playerName}>
            {bot.name} <Text style={styles.playerMeta}>· {bot.elo}</Text>
          </Text>
          <Text style={styles.status}>{status}</Text>
        </View>
      </View>
      <View style={styles.bubble}>
        <Text style={styles.bubbleText}>{speech}</Text>
      </View>
    </>
  );
  const youBlock = (
    <>
      <View style={styles.youRow}>
        <Text style={styles.playerName}>{t('game.you')}</Text>
        <Text style={styles.playerMeta}>{userColor === 'w' ? t('game.colorWhite') : t('game.colorBlack')}</Text>
        {opening && <Text style={styles.opening}>{t('game.opening', { name: opening.name })}</Text>}
      </View>
      <Text style={styles.notation}>{sans.length === 0 ? t('lesson.line.noMoves') : movesText(sans, 8, resolveNotation(settings.notation, language))}</Text>
    </>
  );
  const errorBlock = engineError && (
    <View style={styles.errorCard}>
      <Text style={styles.errorText}>{t('game.engineError')}</Text>
      <Button3D
        label={t('common.retry')}
        variant="danger"
        onPress={() => {
          setEngineError(null);
          setEngine(null);
          setMaia(null);
          setMaiaFailed(false);
          setEngineKey((k) => k + 1);
        }}
        style={{ marginTop: space.sm }}
      />
    </View>
  );
  const actionsBlock = !result && !engineError && (
    <View style={styles.actions}>
      <Button3D label={t('game.offerDraw')} onPress={offerDraw} style={{ flex: 1 }} />
      <Button3D label={t('game.resignButton')} variant="destructive" onPress={resign} style={{ flex: 1 }} />
    </View>
  );
  const resultBg = result?.kind === 'win' ? colors.correctBg : result?.kind === 'loss' ? colors.incorrectBg : colors.surface;
  // Resultado: en el celular, panel al pie; en pantalla ancha, una tarjeta en el panel de la derecha.
  const resultBody = result && (
    <>
      <Text style={[styles.resultTitle, { color: result.kind === 'win' ? colors.primary : result.kind === 'loss' ? colors.danger : colors.text }]}>
        {result.kind === 'win' ? t('game.win') : result.kind === 'loss' ? t('game.loss') : t('game.draw')}
      </Text>
      <Text style={styles.resultReason}>{t(result.reason)}</Text>
      {result.coins > 0 && (
        <View style={styles.coinsRow}>
          <StatIcon name="coin" size={18} />
          <Text style={[styles.coinsText, { marginTop: 0 }]}>{t('game.coins', { n: result.coins })}</Text>
        </View>
      )}
      {result.kind === 'win' && result.coins === 0 && !practiceCourse && <Text style={styles.coinsNote}>{t('game.coinsNote')}</Text>}
      {result.dailyBonus > 0 && <Text style={styles.coinsText}>{t('common.dailyBonus', { n: result.dailyBonus })}</Text>}
      {result.streakRecovered && <Text style={styles.coinsText}>{t('common.streakRecovered')}</Text>}
      <Button3D
        label={practiceCourse ? t('game.rematchPractice') : t('game.rematch')}
        variant="primary"
        onPress={onRematch}
        style={{ marginTop: space.md }}
      />
      <Button3D label={practiceCourse ? t('game.backToOpening') : t('game.otherBot')} onPress={onOtherBot} style={{ marginTop: space.sm }} />
      {sans.length > 0 && <Button3D label={t('game.analyze')} onPress={analyze} style={{ marginTop: space.sm }} />}
    </>
  );

  return (
    <View style={styles.screen}>
      {!engineError && !maiaFailed && bot.engine.type === 'maia' && (
        <MaiaView
          key={`maia-${engineKey}`}
          net={bot.engine.net}
          onReady={setMaia}
          onError={(msg) => {
            setMaia(null);
            if (bot.fallback) setMaiaFailed(true);
            else setEngineError(msg);
          }}
        />
      )}
      {!engineError && needs.stockfish && (
        <EngineView
          key={`sf-${engineKey}`}
          onReady={setEngine}
          onError={(msg) => {
            setEngineError(msg);
            setEngine(null);
          }}
        />
      )}

      <ScrollView contentContainerStyle={[styles.content, { paddingTop: statusBarTop(space.sm) }]}>
        <View style={[styles.topRow, contentWidth ? { width: contentWidth, alignSelf: 'center' } : null]}>
          <Pressable onPress={exit} accessibilityRole="button" accessibilityLabel={t('game.exitLabel')} hitSlop={12}>
            <Text style={styles.close}>✕</Text>
          </Pressable>
          {practiceCourse && <Chip label={t('game.practiceChip', { name: practiceCourse.name })} />}
        </View>

        {wide ? (
          // Pantalla ancha: tablero a la izquierda; el bot, tus datos, las jugadas y el resultado en el panel.
          <BoardLayout reserveHeight={GAME_RESERVE} board={board}>
            {botBlock}
            <View style={{ height: space.lg }} />
            {youBlock}
            {errorBlock}
            {actionsBlock}
            {result && <View style={[styles.resultCard, { backgroundColor: resultBg }]}>{resultBody}</View>}
          </BoardLayout>
        ) : (
          <>
            {/* El bot: arriba, como en un tablero real */}
            {botBlock}
            {board}
            {youBlock}
            {errorBlock}
            {actionsBlock}
          </>
        )}
      </ScrollView>

      {result && !wide && <View style={[styles.resultPanel, { backgroundColor: resultBg }]}>{resultBody}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xl },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.sm },
  close: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.textMuted },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  playerName: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.text },
  playerMeta: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted },
  status: { fontFamily: fonts.semibold, fontSize: 12, color: colors.textMuted },
  bubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.control,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    marginTop: space.sm,
    marginBottom: space.md,
    maxWidth: '100%',
  },
  bubbleText: { fontFamily: fonts.bold, fontSize: 14, color: colors.text, lineHeight: 20 },
  youRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: space.sm, marginTop: space.md },
  opening: { fontFamily: fonts.bold, fontSize: 13, color: colors.gold },
  notation: { fontFamily: fonts.semibold, fontSize: 14, color: colors.textMuted, marginTop: space.sm, lineHeight: 22 },
  actions: { flexDirection: 'row', gap: space.sm, marginTop: space.lg },
  errorCard: {
    marginTop: space.lg,
    backgroundColor: colors.incorrectBg,
    borderRadius: radius.control,
    padding: space.md,
  },
  errorText: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  resultPanel: { paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.xl },
  resultCard: { marginTop: space.lg, borderRadius: radius.control, padding: space.lg },
  resultTitle: { fontFamily: fonts.extrabold, fontSize: 22 },
  resultReason: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text, marginTop: 4 },
  coinsRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: space.sm },
  coinsText: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.gold, marginTop: space.xs },
  coinsNote: { fontFamily: fonts.semibold, fontSize: 13, color: colors.textMuted, marginTop: space.sm },
});
