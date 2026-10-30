import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, BackHandler, Pressable, ScrollView, StatusBar as RNStatusBar, StyleSheet, Text, View } from 'react-native';
import { Chess, Square } from 'chess.js';
import { detectOpening } from '../bots/book';
import { thinkMove } from '../bots/brain';
import { movesText } from '../chess/notation';
import { Board, BoardMove } from '../components/Board';
import { BotAvatar } from '../components/BotAvatar';
import { Button3D } from '../components/Button3D';
import { Chip } from '../components/Chip';
import { StatIcon } from '../components/StatIcon';
import { Bot } from '../data/bots';
import { OpeningCourse } from '../data/lessonTypes';
import { EngineView } from '../engine/EngineView';
import { UciEngine } from '../engine/uci';
import { useFeedback } from '../feedback/feedback';
import { useProgress } from '../progress/ProgressContext';
import { useSettings } from '../settings/SettingsContext';
import { colors, fonts, radius, space } from '../theme';

type Props = {
  bot: Bot;
  userColor: 'w' | 'b';
  /** Modo práctica: el bot sigue la línea de esta apertura mientras el usuario la respete. */
  practiceCourse?: OpeningCourse;
  onExit: () => void;
  onRematch: () => void;
  onOtherBot: () => void;
};

type Result = { kind: 'win' | 'loss' | 'draw'; reason: string };
// Resultado ya guardado, con las monedas ganadas (victoria) y el premio de la meta diaria.
type Finished = Result & { coins: number; goalBonus: number };

// Tope del tiempo de práctica por partida, por si la app queda abierta sin usar.
const MAX_SESSION_SECONDS = 30 * 60;
// Frases del bot: "buena jugada" como mucho cada 3 jugadas suyas.
const GOOD_MOVE_EVERY = 3;
// Cambio de evaluación (centipeones, desde el bot) que dispara cada frase.
const BLUNDER_DELTA = 200;
const GOOD_MOVE_DELTA = 150;

// Partida contra un bot (mapa-de-pantallas.md, 2.10).
export function GameScreen({ bot, userColor, practiceCourse, onExit, onRematch, onOtherBot }: Props) {
  const { finishGame } = useProgress();
  const { settings } = useSettings();
  const feedback = useFeedback();
  const [chess] = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [engine, setEngine] = useState<UciEngine | null>(null);
  const [engineError, setEngineError] = useState<string | null>(null);
  const [engineKey, setEngineKey] = useState(0);
  const [speech, setSpeech] = useState(
    practiceCourse ? `Practiquemos la ${practiceCourse.name}. Sigue la línea que aprendiste.` : bot.lines.greeting
  );
  const [result, setResult] = useState<Finished | null>(null);

  const botColor = userColor === 'w' ? 'b' : 'w';
  const startedAt = useRef(0); // se fija al montar: el render tiene que ser puro
  const alive = useRef(true);
  const prevScore = useRef<number | undefined>(undefined); // evaluación de la última jugada del bot
  const sincePhrase = useRef(0);
  const inBook = useRef(true);
  const finished = useRef(false); // la partida se guarda una sola vez

  useEffect(() => {
    startedAt.current = Date.now();
    return () => {
      alive.current = false;
    };
  }, []);

  const uciHistory = () => chess.history({ verbose: true }).map((m) => m.from + m.to + (m.promotion ?? ''));
  const sans = chess.history();
  const opening = detectOpening(uciHistory());

  const sync = () => {
    setFen(chess.fen());
    const h = chess.history({ verbose: true });
    const last = h[h.length - 1];
    setLastMove(last ? { from: last.from, to: last.to } : null);
  };

  const end = useCallback(
    (r: Result) => {
      if (finished.current) return;
      finished.current = true;
      if (r.kind === 'win') feedback.correct();
      else if (r.kind === 'loss') feedback.wrong();
      setSpeech(r.kind === 'win' ? bot.lines.onLose : r.kind === 'loss' ? bot.lines.onWin : 'Tablas. Buena partida.');
      const earned = finishGame(
        {
          botId: bot.id,
          userColor,
          result: r.kind,
          reason: r.reason,
          moves: chess.history({ verbose: true }).map((m) => m.from + m.to + (m.promotion ?? '')),
          practiceCourseId: practiceCourse?.id,
        },
        Math.min((Date.now() - startedAt.current) / 1000, MAX_SESSION_SECONDS),
        bot.elo
      );
      setResult({ ...r, ...earned });
    },
    [bot, chess, finishGame, practiceCourse, userColor, feedback]
  );

  /** Revisa si la partida terminó después de una jugada. */
  const checkEnd = () => {
    if (chess.isCheckmate()) {
      end({ kind: chess.turn() === userColor ? 'loss' : 'win', reason: 'Jaque mate' });
    } else if (chess.isStalemate()) {
      end({ kind: 'draw', reason: 'Rey ahogado' });
    } else if (chess.isInsufficientMaterial()) {
      end({ kind: 'draw', reason: 'Material insuficiente' });
    } else if (chess.isThreefoldRepetition()) {
      end({ kind: 'draw', reason: 'Triple repetición' });
    } else if (chess.isDraw()) {
      end({ kind: 'draw', reason: 'Regla de las 50 jugadas' });
    }
  };

  // Turno del bot.
  useEffect(() => {
    if (!engine || result || chess.turn() !== botColor) return;
    let cancelled = false;
    thinkMove(engine, bot, { fen: chess.fen(), history: uciHistory(), botColor, practiceCourseId: practiceCourse?.id }).then(
      (move) => {
        if (cancelled || !alive.current) return;
        if (!move.fromBook && inBook.current) {
          inBook.current = false;
          if (practiceCourse) setSpeech('Salimos de la línea. Desde aquí jugamos libre.');
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
    // checkEnd, sync y uciHistory leen `chess`, que no cambia; el turno depende de `fen`.
  }, [engine, fen, result]);

  const onUserMove = (m: BoardMove) => {
    if (result || !engine || chess.turn() !== userColor) return;
    try {
      chess.move({ from: m.from, to: m.to, promotion: m.promotion });
    } catch {
      return;
    }
    sync();
    checkEnd();
  };

  const resign = () =>
    Alert.alert('¿Rendirte?', 'La partida cuenta como derrota.', [
      { text: 'Seguir jugando', style: 'cancel' },
      { text: 'Rendirme', style: 'destructive', onPress: () => end({ kind: 'loss', reason: 'Te rendiste' }) },
    ]);

  const offerDraw = () => {
    // Acepta si no está ganando y ya se jugó un buen rato, o si está claramente perdido.
    const score = prevScore.current ?? 0;
    if ((score <= 50 && chess.moveNumber() >= 20) || score <= -300) {
      end({ kind: 'draw', reason: 'Tablas de mutuo acuerdo' });
    } else {
      setSpeech(`${bot.name} no acepta las tablas. Sigamos jugando.`);
    }
  };

  const exit = () => {
    if (result || chess.history().length === 0) {
      onExit();
      return;
    }
    Alert.alert('¿Abandonar la partida?', 'Cuenta como derrota.', [
      { text: 'Seguir jugando', style: 'cancel' },
      {
        text: 'Abandonar',
        style: 'destructive',
        onPress: () => {
          end({ kind: 'loss', reason: 'Abandonaste la partida' });
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

  const userTurn = !!engine && !result && chess.turn() === userColor;
  const thinking = !!engine && !result && chess.turn() === botColor;
  const status = engineError
    ? 'El motor no responde'
    : !engine
      ? `Preparando a ${bot.name}…`
      : result
        ? 'Partida terminada'
        : thinking
          ? 'Pensando…'
          : 'Te toca';

  return (
    <View style={styles.screen}>
      {!engineError && (
        <EngineView
          key={engineKey}
          onReady={setEngine}
          onError={(msg) => {
            setEngineError(msg);
            setEngine(null);
          }}
        />
      )}

      <ScrollView contentContainerStyle={[styles.content, { paddingTop: (RNStatusBar.currentHeight ?? 40) + space.sm }]}>
        <View style={styles.topRow}>
          <Pressable onPress={exit} accessibilityRole="button" accessibilityLabel="Salir de la partida" hitSlop={12}>
            <Text style={styles.close}>✕</Text>
          </Pressable>
          {practiceCourse && <Chip label={`Práctica: ${practiceCourse.name}`} />}
        </View>

        {/* El bot: arriba, como en un tablero real */}
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

        <Board
          fen={fen}
          orientation={userColor}
          interactive={userTurn}
          lastMove={lastMove}
          onMove={onUserMove}
        />

        <View style={styles.youRow}>
          <Text style={styles.playerName}>Tú</Text>
          <Text style={styles.playerMeta}>{userColor === 'w' ? 'blancas' : 'negras'}</Text>
          {opening && <Text style={styles.opening}>Apertura: {opening.name}</Text>}
        </View>
        <Text style={styles.notation}>{movesText(sans, 8, settings.notation)}</Text>

        {engineError && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>El motor de ajedrez no responde. Prueba otra vez: la partida sigue donde estaba.</Text>
            <Button3D
              label="Reintentar"
              variant="danger"
              onPress={() => {
                setEngineError(null);
                setEngine(null);
                setEngineKey((k) => k + 1);
              }}
              style={{ marginTop: space.sm }}
            />
          </View>
        )}

        {!result && !engineError && (
          <View style={styles.actions}>
            <Button3D label="Ofrecer tablas" onPress={offerDraw} style={{ flex: 1 }} />
            <Button3D label="Rendirse" variant="destructive" onPress={resign} style={{ flex: 1 }} />
          </View>
        )}
      </ScrollView>

      {result && (
        <View
          style={[
            styles.resultPanel,
            { backgroundColor: result.kind === 'win' ? colors.correctBg : result.kind === 'loss' ? colors.incorrectBg : colors.surface },
          ]}
        >
          <Text
            style={[
              styles.resultTitle,
              { color: result.kind === 'win' ? colors.primary : result.kind === 'loss' ? colors.danger : colors.text },
            ]}
          >
            {result.kind === 'win' ? 'Ganaste' : result.kind === 'loss' ? 'Perdiste' : 'Tablas'}
          </Text>
          <Text style={styles.resultReason}>{result.reason}</Text>
          {result.coins > 0 && (
            <View style={styles.coinsRow}>
              <StatIcon name="coin" size={18} />
              <Text style={[styles.coinsText, { marginTop: 0 }]}>+{result.coins} monedas</Text>
            </View>
          )}
          {result.kind === 'win' && result.coins === 0 && !practiceCourse && (
            <Text style={styles.coinsNote}>Las monedas por ganarle a cada bot se dan una vez por día.</Text>
          )}
          {result.goalBonus > 0 && (
            <Text style={styles.coinsText}>Cumpliste tu meta diaria: +{result.goalBonus} monedas.</Text>
          )}
          <Button3D
            label={practiceCourse ? 'Practicar otra vez' : 'Revancha'}
            variant="primary"
            onPress={onRematch}
            style={{ marginTop: space.md }}
          />
          <Button3D
            label={practiceCourse ? 'Volver a la apertura' : 'Elegir otro bot'}
            onPress={onOtherBot}
            style={{ marginTop: space.sm }}
          />
        </View>
      )}
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
  resultTitle: { fontFamily: fonts.extrabold, fontSize: 22 },
  resultReason: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text, marginTop: 4 },
  coinsRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: space.sm },
  coinsText: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.gold, marginTop: space.xs },
  coinsNote: { fontFamily: fonts.semibold, fontSize: 13, color: colors.textMuted, marginTop: space.sm },
});
