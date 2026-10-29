import React, { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useIsFocused } from 'expo-router';
import { Chess, Square } from 'chess.js';
import { movesText, Notation, sanFromEnglish } from '../chess/notation';
import { useSettings } from '../settings/SettingsContext';
import { Board, BoardMove } from '../components/Board';
import { Button3D } from '../components/Button3D';
import { EngineView } from '../engine/EngineView';
import { AnalysisUpdate, EngineLine, UciEngine } from '../engine/uci';
import { colors, fonts, radius, space } from '../theme';

type LastMove = { from: Square; to: Square } | null;

const ANALYSIS_DEPTH = 20; // profundidad máxima del análisis en vivo (después el motor descansa)
const TOP_LINES = 3; // mejores jugadas que se muestran
const PV_SHOWN = 6; // jugadas de cada variante que se muestran

function statusText(chess: Chess): string {
  const side = chess.turn() === 'w' ? 'blancas' : 'negras';
  if (chess.isCheckmate()) {
    return `Jaque mate · ganan las ${chess.turn() === 'w' ? 'negras' : 'blancas'}`;
  }
  if (chess.isStalemate()) return 'Tablas por rey ahogado';
  if (chess.isDraw()) return 'Tablas';
  if (chess.isCheck()) return `Jaque · juegan las ${side}`;
  return `Juegan las ${side}`;
}

/** Evaluación desde el punto de vista de las blancas (el motor la da para el bando que mueve). */
const whiteScore = (line: EngineLine, turn: 'w' | 'b') => (turn === 'w' ? line.score : -line.score);

const isMate = (score: number) => Math.abs(score) >= 9000;

/** "+1,3", "−0,4", "M3" (mate de las blancas en 3), "−M2" (mate de las negras en 2). */
function formatScore(score: number): string {
  if (isMate(score)) return `${score > 0 ? '' : '−'}M${10000 - Math.abs(score)}`;
  const pawns = (Math.abs(score) / 100).toFixed(1).replace('.', ',');
  return score > 0 ? `+${pawns}` : score < 0 ? `−${pawns}` : '0,0';
}

/** Parte de la barra que es blanca (0 a 1). Misma curva que Lichess: ±4 peones ≈ 90 %. */
function whiteShare(score: number): number {
  if (isMate(score)) return score > 0 ? 1 : 0;
  return 1 / (1 + Math.exp(-0.00368208 * score));
}

/** Variante en notación, numerada desde la posición: "12… Cf6 13. e5 Cd5". */
function pvText(fen: string, pv: string[], notation: Notation): { first: string; rest: string } {
  const chess = new Chess(fen);
  let moveNo = Number(fen.split(' ')[5] ?? 1);
  const parts: string[] = [];
  for (const uci of pv.slice(0, PV_SHOWN)) {
    const white = chess.turn() === 'w';
    let san: string;
    try {
      san = chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] }).san;
    } catch {
      break;
    }
    const s = sanFromEnglish(san, notation);
    if (white) parts.push(`${moveNo}. ${s}`);
    else {
      parts.push(parts.length === 0 ? `${moveNo}… ${s}` : s);
      moveNo++;
    }
  }
  return { first: parts[0] ?? '', rest: parts.slice(1).join(' ') };
}

/** Barra de evaluación: blanco a la izquierda, negro a la derecha; se desliza al cambiar. */
function EvalBar({ score }: { score: number | null }) {
  const share = score === null ? 0.5 : whiteShare(score);
  const [w] = useState(() => new Animated.Value(share));
  useEffect(() => {
    Animated.timing(w, { toValue: share, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [w, share]);
  const label = score === null ? '' : formatScore(score);
  const whiteAhead = score === null || score >= 0;
  // Mismo ancho que el tablero (Board calcula su tamaño igual).
  const { width } = useWindowDimensions();
  const boardPx = Math.floor(Math.min(width - 32, 480) / 8) * 8;
  return (
    <View style={[styles.bar, { width: boardPx }]} accessibilityLabel={`Evaluación ${label || 'pendiente'}`}>
      <Animated.View
        style={[styles.barWhite, { width: w.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}
      />
      {!!label && (
        <Text style={[styles.barLabel, whiteAhead ? { left: 8, color: '#262421' } : { right: 8, color: '#FFFFFF' }]}>
          {label}
        </Text>
      )}
    </View>
  );
}

export function FreePlayScreen() {
  const { settings } = useSettings();
  // La partida vive aquí; el tablero solo recibe la posición (FEN).
  const [chess] = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [lastMove, setLastMove] = useState<LastMove>(null);
  const [orientation, setOrientation] = useState<'w' | 'b'>('w');

  // Motor: se enciende y apaga desde la tarjeta. Solo analiza con la pestaña a la vista.
  const [engineOn, setEngineOn] = useState(true);
  const [engine, setEngine] = useState<UciEngine | null>(null);
  const [engineError, setEngineError] = useState<string | null>(null);
  const [engineKey, setEngineKey] = useState(0);
  const [analysis, setAnalysis] = useState<(AnalysisUpdate & { fen: string }) | null>(null);
  const focused = useIsFocused();

  const gameOver = chess.isGameOver();
  const turn = chess.turn();

  useEffect(() => {
    if (!engine || !engineOn || !focused || gameOver) return;
    // Al cambiar la posición (o salir de la pestaña), el análisis anterior se detiene.
    return engine.analyze({ fen, multipv: TOP_LINES, depth: ANALYSIS_DEPTH }, (u) => setAnalysis({ ...u, fen }));
  }, [engine, engineOn, focused, fen, gameOver]);

  // Solo vale el análisis de la posición que se ve.
  const current = analysis && analysis.fen === fen ? analysis : null;
  const best = current?.lines[0];
  // En el mate la barra se llena para el ganador; en tablas queda al medio.
  const barScore = chess.isCheckmate()
    ? turn === 'w' ? -10000 : 10000
    : gameOver
      ? 0
      : best
        ? whiteScore(best, turn)
        : null;

  const sync = () => {
    setFen(chess.fen());
    const h = chess.history({ verbose: true });
    const last = h[h.length - 1];
    setLastMove(last ? { from: last.from, to: last.to } : null);
  };

  const handleMove = (m: BoardMove) => {
    try {
      chess.move({ from: m.from, to: m.to, promotion: m.promotion });
    } catch {
      return;
    }
    sync();
  };

  const playUci = (uci: string) =>
    handleMove({ from: uci.slice(0, 2) as Square, to: uci.slice(2, 4) as Square, promotion: uci[4] as BoardMove['promotion'] });

  const undo = () => {
    chess.undo();
    sync();
  };

  const reset = () => {
    chess.reset();
    sync();
  };

  const toggleEngine = (on: boolean) => {
    setEngineOn(on);
    if (!on) {
      setEngine(null);
      setAnalysis(null);
      setEngineError(null);
    }
  };

  const retryEngine = () => {
    setEngineError(null);
    setEngine(null);
    setEngineKey((k) => k + 1);
  };

  return (
    <View style={styles.screen}>
      {engineOn && !engineError && <EngineView key={engineKey} onReady={setEngine} onError={setEngineError} />}

      <ScrollView contentContainerStyle={[styles.content, { paddingTop: (RNStatusBar.currentHeight ?? 40) + space.sm }]}>
        <Text style={styles.title}>Análisis</Text>
        <Text style={styles.subtitle}>Tablero libre: mueve las piezas y Stockfish analiza la posición</Text>

        <View style={{ height: space.lg }} />
        {engineOn && <EvalBar score={barScore} />}
        <Board
          fen={fen}
          orientation={orientation}
          lastMove={lastMove}
          onMove={handleMove}
          arrows={engineOn && best && !gameOver ? [best.move.slice(0, 4)] : undefined}
        />
        <View style={{ height: space.lg }} />

        <View style={styles.card}>
          <View style={styles.engineHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.question}>Stockfish</Text>
              <Text style={styles.engineMeta}>
                {!engineOn
                  ? 'Apagado'
                  : engineError
                    ? 'No se pudo iniciar'
                    : !engine
                      ? 'Iniciando…'
                      : gameOver
                        ? 'Partida terminada'
                        : current
                          ? `Profundidad ${current.depth}${current.done ? '' : '…'}`
                          : 'Pensando…'}
              </Text>
            </View>
            <Switch
              value={engineOn}
              onValueChange={toggleEngine}
              trackColor={{ false: colors.surfaceRaised, true: colors.primaryShadow }}
              thumbColor={engineOn ? colors.primary : colors.textMuted}
              accessibilityLabel="Motor de análisis"
            />
          </View>

          {engineOn && engineError && (
            <Button3D label="Reintentar" variant="danger" onPress={retryEngine} style={{ marginTop: space.md }} />
          )}

          {engineOn && !engineError && !gameOver &&
            (current?.lines ?? []).map((line) => {
              const text = pvText(fen, line.pv, settings.notation);
              return (
                <Pressable
                  key={line.rank}
                  onPress={() => playUci(line.move)}
                  accessibilityRole="button"
                  accessibilityLabel={`Jugar ${text.first}`}
                  style={({ pressed }) => [styles.line, pressed && { backgroundColor: colors.surfaceRaised }]}
                >
                  <View style={[styles.scoreChip, whiteScore(line, turn) < 0 && styles.scoreChipBlack]}>
                    <Text style={[styles.scoreText, whiteScore(line, turn) < 0 && { color: colors.text }]}>
                      {formatScore(whiteScore(line, turn))}
                    </Text>
                  </View>
                  <Text style={styles.pv} numberOfLines={1}>
                    <Text style={styles.pvFirst}>{text.first}</Text>
                    {text.rest ? `  ${text.rest}` : ''}
                  </Text>
                </Pressable>
              );
            })}
        </View>

        <View style={{ height: space.md }} />
        <View style={styles.card}>
          <Text style={styles.question}>{statusText(chess)}</Text>
          <Text style={styles.notation}>{movesText(chess.history(), 8, settings.notation)}</Text>
        </View>

        <View style={{ height: space.lg }} />
        <View style={styles.row}>
          {gameOver && <Button3D label="Nueva partida" variant="primary" onPress={reset} />}
          <Button3D label="Deshacer" onPress={undo} />
          <Button3D label="Voltear" onPress={() => setOrientation((o) => (o === 'w' ? 'b' : 'w'))} />
          {!gameOver && <Button3D label="Reiniciar" variant="destructive" onPress={reset} />}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  title: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.text },
  subtitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted, marginTop: 2 },
  bar: {
    height: 22,
    borderRadius: radius.bar,
    backgroundColor: '#403D39',
    overflow: 'hidden',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: space.sm,
  },
  barWhite: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#F2F2F2' },
  barLabel: { position: 'absolute', fontFamily: fonts.extrabold, fontSize: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    borderBottomWidth: 4,
    borderBottomColor: colors.surfaceShadow,
    paddingVertical: space.md,
    paddingHorizontal: 14,
  },
  engineHeader: { flexDirection: 'row', alignItems: 'center' },
  engineMeta: { fontFamily: fonts.semibold, fontSize: 12, color: colors.textMuted },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.sm,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: radius.bar,
  },
  scoreChip: { minWidth: 52, paddingVertical: 3, paddingHorizontal: 6, borderRadius: 6, backgroundColor: '#F2F2F2', alignItems: 'center' },
  scoreChipBlack: { backgroundColor: '#1B1A18' },
  scoreText: { fontFamily: fonts.extrabold, fontSize: 13, color: '#262421' },
  pv: { flex: 1, fontFamily: fonts.semibold, fontSize: 14, color: colors.textMuted },
  pvFirst: { fontFamily: fonts.extrabold, color: colors.text },
  question: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.text, marginBottom: 4 },
  notation: { fontFamily: fonts.semibold, fontSize: 14, color: colors.textMuted },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
