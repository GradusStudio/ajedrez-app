import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Chess, Square } from 'chess.js';
import { resolveNotation, sanFromSpanish } from '../../chess/notation';
import { BoardLayout } from '../../components/BoardLayout';
import { Board, BoardMove } from '../../components/Board';
import { FadeIn } from '../../components/FadeIn';
import { useI18n } from '../../i18n/I18nContext';
import { useSettings } from '../../settings/SettingsContext';
import { LineStep as LineStepData } from '../../data/lessonTypes';
import { LESSON_RESERVE, StepCallbacks } from '../stepTypes';
import { TeacherBubble } from '../TeacherBubble';
import { type, colors, fonts, radius, space } from '../../theme';

type Props = { step: LineStepData } & StepCallbacks;

// Pausa antes de que el rival juegue solo (y antes de la primera jugada blanca si juegas con negras).
const REPLY_DELAY_MS = 700;
// Marca para partir un texto traducido y poner la jugada con otro color en el medio.
const SAN_MARK = '\u0001';

/**
 * Línea de apertura: el usuario juega las jugadas de su color (`side`) y la app juega las del rival.
 * guided: antes de cada jugada propia explica cuál toca y para qué (con origen y destino marcados);
 *   la explicación queda fija mientras responde el rival. Tras un error, una flecha marca la jugada.
 * drill: sin explicaciones ni ayudas; un error se marca y se reintenta.
 */
export function LineStep({ step, onCorrect, onWrong, onClear, locked, replay }: Props) {
  const { notation: notationSetting } = useSettings().settings;
  const { language, t } = useI18n();
  // Las jugadas de los datos están en español; se muestran en la notación elegida en Ajustes.
  const san = (s: string) => sanFromSpanish(s, resolveNotation(notationSetting, language));
  const [chess] = useState(() => {
    const c = new Chess(step.fen);
    // En repaso, la línea aparece completa, como quedó al terminarla.
    if (replay) {
      for (const m of step.moves) {
        try {
          c.move({ from: m.uci.slice(0, 2) as Square, to: m.uci.slice(2, 4) as Square, promotion: m.uci[4] ?? 'q' });
        } catch {
          break;
        }
      }
    }
    return c;
  });
  const [ply, setPly] = useState(replay ? step.moves.length : 0); // jugadas ya hechas
  const [fen, setFen] = useState(replay ? chess.fen() : step.fen);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(() => {
    if (!replay || step.moves.length === 0) return null;
    const m = step.moves[step.moves.length - 1];
    return { from: m.uci.slice(0, 2) as Square, to: m.uci.slice(2, 4) as Square };
  });
  const [showHint, setShowHint] = useState(false);
  // Jugada equivocada a la vista (posición aparte: la partida real no cambia) hasta "Reintentar".
  const [wrong, setWrong] = useState<{ fen: string; move: { from: Square; to: Square } } | null>(null);
  // Visor de las jugadas ya hechas: null = jugada actual; un número = jugada que se está mirando.
  const [viewAt, setViewAt] = useState<number | null>(null);
  const viewingBack = viewAt !== null;
  const viewPly = viewAt ?? ply;

  // Posición que muestra el tablero: la actual o la de la jugada que se está mirando.
  const view = useMemo(() => {
    if (!viewingBack) return { fen, lastMove };
    const probe = new Chess(step.fen);
    let last: { from: Square; to: Square } | null = null;
    for (const m of step.moves.slice(0, viewPly)) {
      const from = m.uci.slice(0, 2) as Square;
      const to = m.uci.slice(2, 4) as Square;
      try {
        probe.move({ from, to, promotion: m.uci[4] ?? 'q' });
        last = { from, to };
      } catch {
        break;
      }
    }
    return { fen: probe.fen(), lastMove: last };
  }, [viewingBack, fen, lastMove, step, viewPly]);

  const guided = step.mode === 'guided';
  const finished = ply >= step.moves.length;
  const userTurn = !finished && chess.turn() === step.side;
  const expected = userTurn ? step.moves[ply] : undefined;

  // Jugada propia que explica la tarjeta: la que toca ahora o, mientras responde el rival, la recién jugada.
  const cardIndex = userTurn ? ply : lastUserMoveBefore(step, ply);
  const card = guided && cardIndex >= 0 ? step.moves[cardIndex] : undefined;
  const cardPlayed = cardIndex < ply;

  const play = (i: number) => {
    const { uci } = step.moves[i];
    const from = uci.slice(0, 2) as Square;
    const to = uci.slice(2, 4) as Square;
    try {
      chess.move({ from, to, promotion: uci[4] ?? 'q' });
    } catch {
      return; // los datos se validan antes; si una jugada fallara, la línea se detiene
    }
    setFen(chess.fen());
    setLastMove({ from, to });
    setPly(i + 1);
  };

  // Turno del rival: juega solo. Al terminar la línea, el paso queda resuelto.
  useEffect(() => {
    if (replay) return;
    if (finished) {
      onCorrect(step.success ?? t(guided ? 'lesson.line.successGuided' : 'lesson.line.successDrill'));
      return;
    }
    if (chess.turn() === step.side) return;
    const timer = setTimeout(() => play(ply), REPLY_DELAY_MS);
    return () => clearTimeout(timer);
    // play y onCorrect cambian en cada render; el efecto solo depende de la jugada actual.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ply]);

  const handleMove = (m: BoardMove) => {
    if (!expected || locked || viewingBack) return;
    // Si la línea corona, también cuenta la pieza (uci de 5 letras).
    if (`${m.from}${m.to}${expected.uci.length === 5 ? m.promotion ?? '' : ''}` === expected.uci) {
      setShowHint(false);
      onClear?.();
      play(ply);
    } else {
      // La jugada equivocada se ve en el tablero; "Reintentar" la deshace.
      const probe = new Chess(chess.fen());
      try {
        probe.move({ from: m.from, to: m.to, promotion: m.promotion });
      } catch {
        return;
      }
      setWrong({ fen: probe.fen(), move: { from: m.from, to: m.to } });
      if (guided) setShowHint(true);
      onWrong(
        step.hint ??
          (guided ? t('lesson.line.wrongGuided', { san: san(expected.san) }) : t('lesson.line.wrongDrill')),
        () => setWrong(null)
      );
    }
  };

  const rivalLast = ply > 0 && !isUserMove(step, ply - 1) ? step.moves[ply - 1] : undefined;
  const [cardBefore, cardAfter] = t(cardPlayed ? 'lesson.line.played' : 'lesson.line.yourMove', { san: SAN_MARK }).split(SAN_MARK);

  return (
    <BoardLayout
      reserveHeight={LESSON_RESERVE}
      board={
        <>
          <Board
            fen={wrong?.fen ?? view.fen}
            orientation={step.orientation ?? step.side}
            interactive={userTurn && !locked && !viewingBack}
            lastMove={wrong?.move ?? view.lastMove}
            // En guiado se marcan el origen y el destino de la jugada que toca (no mientras se ve el error).
            highlight={guided && expected && !wrong && !viewingBack ? [expected.uci.slice(0, 2), expected.uci.slice(2, 4)] : undefined}
            arrows={showHint && expected && !wrong && !viewingBack ? [expected.uci.slice(0, 4)] : undefined}
            onMove={handleMove}
          />
        </>
      }
    >
      <FadeIn>
        <TeacherBubble>{step.prompt}</TeacherBubble>
      </FadeIn>
      <Text style={styles.turn}>
        {[
          rivalLast && userTurn ? t('lesson.line.rivalPlayed', { san: san(rivalLast.san) }) : null,
          finished ? t('lesson.line.complete') : userTurn ? t('common.yourTurn') : t('lesson.line.rivalToPlay'),
          step.side === 'w' ? t('common.youPlayWhite') : t('common.youPlayBlack'),
        ]
          .filter(Boolean)
          .join(' · ')}
      </Text>

      {/* key = jugada explicada: cada explicación nueva aparece con su animación */}
      {card && !viewingBack && (
        <FadeIn key={cardIndex} delay={80} style={[styles.noteCard, !cardPlayed && styles.noteCardActive]}>
          <Text style={styles.noteTitle}>
            {cardBefore}
            <Text style={{ color: cardPlayed ? colors.text : colors.primary }}>{san(card.san)}</Text>
            {cardAfter}
          </Text>
          {!!card.note && <Text style={styles.noteText}>{card.note}</Text>}
        </FadeIn>
      )}

      <Text style={styles.notation}>{viewPly === 0 ? t('lesson.line.noMoves') : notation(step, viewPly, san)}</Text>

      {/* Visor de las jugadas ya hechas (feedback del tester, sección 3). */}
      {ply > 0 && (
        <View style={styles.viewer}>
          <Pressable
            onPress={() => setViewAt(Math.max(0, viewPly - 1))}
            disabled={viewPly <= 0}
            accessibilityRole="button"
            accessibilityLabel={t('review.ctrlPrev')}
            accessibilityState={{ disabled: viewPly <= 0 }}
            style={[styles.viewerBtn, viewPly <= 0 && styles.viewerBtnOff]}
          >
            <Text style={styles.viewerGlyph}>‹</Text>
          </Pressable>
          <Pressable
            onPress={() => setViewAt(viewPly + 1 >= ply ? null : viewPly + 1)}
            disabled={!viewingBack}
            accessibilityRole="button"
            accessibilityLabel={t('review.ctrlNext')}
            accessibilityState={{ disabled: !viewingBack }}
            style={[styles.viewerBtn, !viewingBack && styles.viewerBtnOff]}
          >
            <Text style={styles.viewerGlyph}>›</Text>
          </Pressable>
          {viewingBack && (
            <Pressable onPress={() => setViewAt(null)} accessibilityRole="button" style={styles.currentBtn}>
              <Text style={styles.currentText}>{t('lesson.line.backToCurrent')}</Text>
            </Pressable>
          )}
        </View>
      )}
    </BoardLayout>
  );
}

/** true si la jugada `i` de la línea le toca al usuario. La línea empieza con juegan las blancas. */
function isUserMove(step: LineStepData, i: number): boolean {
  const whiteStarts = new Chess(step.fen).turn() === 'w';
  const whiteMoves = (i % 2 === 0) === whiteStarts;
  return whiteMoves === (step.side === 'w');
}

/** Índice de la última jugada del usuario antes de `ply`, o la próxima si todavía no jugó ninguna. */
function lastUserMoveBefore(step: LineStepData, ply: number): number {
  for (let i = Math.min(ply, step.moves.length) - 1; i >= 0; i--) if (isUserMove(step, i)) return i;
  for (let i = ply; i < step.moves.length; i++) if (isUserMove(step, i)) return i;
  return -1;
}

/**
 * Jugadas hechas hasta ahora, numeradas desde la posición del paso: "1. e4 d5 2. exd5 Dxd5", o
 * "23… Cxe5 24. Dxe5" si empieza a mitad de partida con las negras. `san` convierte a la notación elegida.
 */
function notation(step: LineStepData, ply: number, san: (s: string) => string): string {
  const [, turn, , , , full] = step.fen.split(' ');
  let moveNo = Number(full) || 1;
  let white = turn !== 'b';
  const parts: string[] = [];
  step.moves.slice(0, ply).forEach((m) => {
    if (white) parts.push(`${moveNo}. ${san(m.san)}`);
    else if (parts.length === 0) parts.push(`${moveNo}… ${san(m.san)}`);
    else parts[parts.length - 1] += ` ${san(m.san)}`;
    if (!white) moveNo++;
    white = !white;
  });
  return parts.join('   ');
}

const styles = StyleSheet.create({
  turn: { fontFamily: fonts.semibold, fontSize: type.caption, color: colors.textMuted, marginTop: space.xs },
  noteCard: {
    marginTop: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    borderBottomWidth: 4,
    borderBottomColor: colors.surfaceShadow,
    paddingVertical: space.md,
    paddingHorizontal: 14,
  },
  noteCardActive: { borderColor: colors.primary, borderBottomColor: colors.primaryShadow },
  noteTitle: { fontFamily: fonts.extrabold, fontSize: type.body, color: colors.text },
  noteText: { fontFamily: fonts.bold, fontSize: type.body, color: colors.textMuted, lineHeight: 20, marginTop: space.xs },
  notation: { fontFamily: fonts.semibold, fontSize: type.body, color: colors.textMuted, marginTop: space.md, lineHeight: 22 },
  viewer: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.md },
  viewerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    borderBottomWidth: 3,
    borderBottomColor: colors.surfaceShadow,
  },
  viewerBtnOff: { opacity: 0.4 },
  viewerGlyph: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.text, lineHeight: 22 },
  currentBtn: { marginLeft: 'auto', paddingVertical: 6 },
  currentText: { fontFamily: fonts.bold, fontSize: type.secondary, color: colors.primary },
});
