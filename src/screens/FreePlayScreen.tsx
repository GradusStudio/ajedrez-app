import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useIsFocused } from 'expo-router';
import { Chess, Square } from 'chess.js';
import { movesText, Notation, resolveNotation, sanFromEnglish } from '../chess/notation';
import { MessageKey, useI18n } from '../i18n/I18nContext';
import { useSettings } from '../settings/SettingsContext';
import { Board, BoardMove } from '../components/Board';
import { Button3D } from '../components/Button3D';
import { EvalBar } from '../components/EvalBar';
import { formatScore, whiteScore } from '../engine/evalFormat';
import { AnalysisUpdate } from '../engine/uci';
import { useUciEngine } from '../engine/useUciEngine';
import { colors, fonts, radius, space } from '../theme';

type LastMove = { from: Square; to: Square } | null;
type Translate = (key: MessageKey, values?: Record<string, string | number>) => string;

const ANALYSIS_DEPTH = 20; // profundidad máxima del análisis en vivo (después el motor descansa)
const TOP_LINES = 3; // mejores jugadas que se muestran
const PV_SHOWN = 6; // jugadas de cada variante que se muestran

function statusText(chess: Chess, t: Translate): string {
  const white = chess.turn() === 'w';
  if (chess.isCheckmate()) return t(white ? 'analysis.mateBlackWins' : 'analysis.mateWhiteWins');
  if (chess.isStalemate()) return t('analysis.stalemate');
  if (chess.isDraw()) return t('analysis.draw');
  if (chess.isCheck()) return t(white ? 'analysis.checkWhite' : 'analysis.checkBlack');
  return t(white ? 'common.whiteToMove' : 'common.blackToMove');
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

export function FreePlayScreen({ onBack }: { onBack?: () => void } = {}) {
  const { settings } = useSettings();
  const { language, t } = useI18n();
  const notation = resolveNotation(settings.notation, language);
  // Separador decimal del idioma (en español, la coma).
  const decimal = language === 'en' ? '.' : ',';
  // La partida vive aquí; el tablero solo recibe la posición (FEN).
  const [chess] = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [lastMove, setLastMove] = useState<LastMove>(null);
  const [orientation, setOrientation] = useState<'w' | 'b'>('w');

  // Motor: se enciende y apaga desde la tarjeta. Solo analiza con la pestaña a la vista.
  const [engineOn, setEngineOn] = useState(true);
  const { engine, error: engineError, retry: retryEngine, view: engineView } = useUciEngine(engineOn);
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
    if (!on) setAnalysis(null);
  };

  return (
    <View style={styles.screen}>
      {engineView}

      <ScrollView contentContainerStyle={[styles.content, { paddingTop: (RNStatusBar.currentHeight ?? 40) + space.sm }]}>
        {onBack && (
          <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel={t('analysisMenu.title')} hitSlop={12}>
            <Text style={styles.back}>{t('analysisMenu.back')}</Text>
          </Pressable>
        )}
        <Text style={styles.title}>{t('analysis.title')}</Text>
        <Text style={styles.subtitle}>{t('analysis.subtitle')}</Text>

        <View style={{ height: space.lg }} />
        {engineOn && <EvalBar score={barScore} decimal={decimal} />}
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
                  ? t('analysis.engineOff')
                  : engineError
                    ? t('analysis.engineDown')
                    : !engine
                      ? t('analysis.starting')
                      : gameOver
                        ? t('analysis.over')
                        : current
                          ? t(current.done ? 'analysis.depth' : 'analysis.depthRunning', { n: current.depth })
                          : t('analysis.thinking')}
              </Text>
            </View>
            <Switch
              value={engineOn}
              onValueChange={toggleEngine}
              trackColor={{ false: colors.surfaceRaised, true: colors.primaryShadow }}
              thumbColor={engineOn ? colors.primary : colors.textMuted}
              accessibilityLabel={t('analysis.switchLabel')}
            />
          </View>

          {engineOn && engineError && (
            <Button3D label={t('common.retry')} variant="danger" onPress={retryEngine} style={{ marginTop: space.md }} />
          )}

          {engineOn && !engineError && !gameOver &&
            (current?.lines ?? []).map((line) => {
              const text = pvText(fen, line.pv, notation);
              return (
                <Pressable
                  key={line.rank}
                  onPress={() => playUci(line.move)}
                  accessibilityRole="button"
                  accessibilityLabel={t('analysis.playLabel', { move: text.first })}
                  style={({ pressed }) => [styles.line, pressed && { backgroundColor: colors.surfaceRaised }]}
                >
                  <View style={[styles.scoreChip, whiteScore(line, turn) < 0 && styles.scoreChipBlack]}>
                    <Text style={[styles.scoreText, whiteScore(line, turn) < 0 && { color: colors.text }]}>
                      {formatScore(whiteScore(line, turn), decimal)}
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
          <Text style={styles.question}>{statusText(chess, t)}</Text>
          <Text style={styles.notation}>{chess.history().length === 0 ? t('lesson.line.noMoves') : movesText(chess.history(), 8, notation)}</Text>
        </View>

        <View style={{ height: space.lg }} />
        <View style={styles.row}>
          {gameOver && <Button3D label={t('analysis.newGame')} variant="primary" onPress={reset} />}
          <Button3D label={t('analysis.undo')} onPress={undo} />
          <Button3D label={t('analysis.flip')} onPress={() => setOrientation((o) => (o === 'w' ? 'b' : 'w'))} />
          {!gameOver && <Button3D label={t('analysis.reset')} variant="destructive" onPress={reset} />}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  back: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted, marginBottom: space.md },
  title: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.text },
  subtitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted, marginTop: 2 },
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
