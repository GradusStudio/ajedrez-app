import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Chess, Square } from 'chess.js';
import { sanFromSpanish } from '../../chess/notation';
import { Board, BoardMove } from '../../components/Board';
import { FadeIn } from '../../components/FadeIn';
import { useSettings } from '../../settings/SettingsContext';
import { LineStep as LineStepData } from '../../data/lessonTypes';
import { StepCallbacks } from '../stepTypes';
import { colors, fonts, radius, space } from '../../theme';

type Props = { step: LineStepData } & StepCallbacks;

// Pausa antes de que el rival juegue solo (y antes de la primera jugada blanca si juegas con negras).
const REPLY_DELAY_MS = 700;

/**
 * Línea de apertura: el usuario juega las jugadas de su color (`side`) y la app juega las del rival.
 * guided: antes de cada jugada propia explica cuál toca y para qué (con origen y destino marcados);
 *   la explicación queda fija mientras responde el rival. Tras un error, una flecha marca la jugada.
 * drill: sin explicaciones ni ayudas; un error se marca y se reintenta.
 */
export function LineStep({ step, onCorrect, onWrong, onClear, locked }: Props) {
  const { notation: notationSetting } = useSettings().settings;
  // Las jugadas de los datos están en español; se muestran en la notación elegida en Ajustes.
  const san = (s: string) => sanFromSpanish(s, notationSetting);
  const [chess] = useState(() => new Chess(step.fen));
  const [ply, setPly] = useState(0); // jugadas ya hechas
  const [fen, setFen] = useState(step.fen);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [showHint, setShowHint] = useState(false);
  // Jugada equivocada a la vista (posición aparte: la partida real no cambia) hasta "Reintentar".
  const [wrong, setWrong] = useState<{ fen: string; move: { from: Square; to: Square } } | null>(null);

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
    if (finished) {
      onCorrect(guided ? 'Completaste la línea.' : 'Completaste la línea de memoria.');
      return;
    }
    if (chess.turn() === step.side) return;
    const t = setTimeout(() => play(ply), REPLY_DELAY_MS);
    return () => clearTimeout(t);
    // play y onCorrect cambian en cada render; el efecto solo depende de la jugada actual.
  }, [ply]);

  const handleMove = (m: BoardMove) => {
    if (!expected || locked) return;
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
        guided
          ? `En esta línea se juega ${san(expected.san)}. Al reintentar, la flecha te la marca.`
          : 'Esa no es la jugada de la línea.',
        () => setWrong(null)
      );
    }
  };

  const rivalLast = ply > 0 && !isUserMove(step, ply - 1) ? step.moves[ply - 1] : undefined;

  return (
    <View>
      <Board
        fen={wrong?.fen ?? fen}
        orientation={step.orientation ?? step.side}
        interactive={userTurn && !locked}
        lastMove={wrong?.move ?? lastMove}
        // En guiado se marcan el origen y el destino de la jugada que toca (no mientras se ve el error).
        highlight={guided && expected && !wrong ? [expected.uci.slice(0, 2), expected.uci.slice(2, 4)] : undefined}
        arrows={showHint && expected && !wrong ? [expected.uci.slice(0, 4)] : undefined}
        onMove={handleMove}
      />
      <View style={{ height: space.lg }} />
      <FadeIn>
        <Text style={styles.prompt}>{step.prompt}</Text>
      </FadeIn>
      <Text style={styles.turn}>
        {rivalLast && userTurn ? `El rival jugó ${san(rivalLast.san)} · ` : ''}
        {finished ? 'Línea completa' : userTurn ? 'Tu turno' : 'Juega el rival…'}
        {' · '}
        {step.side === 'w' ? 'juegas con blancas' : 'juegas con negras'}
      </Text>

      {/* key = jugada explicada: cada explicación nueva aparece con su animación */}
      {card && (
        <FadeIn key={cardIndex} delay={80} style={[styles.noteCard, !cardPlayed && styles.noteCardActive]}>
          <Text style={styles.noteTitle}>
            {cardPlayed ? 'Jugaste ' : 'Tu jugada: '}
            <Text style={{ color: cardPlayed ? colors.text : colors.primary }}>{san(card.san)}</Text>
          </Text>
          {!!card.note && <Text style={styles.noteText}>{card.note}</Text>}
        </FadeIn>
      )}

      <Text style={styles.notation}>{notation(step, ply, san)}</Text>
    </View>
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

/** Jugadas hechas hasta ahora, numeradas: "1. e4 d5 2. exd5 Dxd5". `san` convierte a la notación elegida. */
function notation(step: LineStepData, ply: number, san: (s: string) => string): string {
  if (ply === 0) return 'Aún no hay jugadas';
  const parts: string[] = [];
  step.moves.slice(0, ply).forEach((m, i) => {
    if (i % 2 === 0) parts.push(`${i / 2 + 1}. ${san(m.san)}`);
    else parts[parts.length - 1] += ` ${san(m.san)}`;
  });
  return parts.join('   ');
}

const styles = StyleSheet.create({
  prompt: { fontFamily: fonts.bold, fontSize: 18, color: colors.text, lineHeight: 26 },
  turn: { fontFamily: fonts.semibold, fontSize: 12, color: colors.textMuted, marginTop: space.xs },
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
  noteTitle: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.text },
  noteText: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted, lineHeight: 20, marginTop: space.xs },
  notation: { fontFamily: fonts.semibold, fontSize: 14, color: colors.textMuted, marginTop: space.md, lineHeight: 22 },
});
