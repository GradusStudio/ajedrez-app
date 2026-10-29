import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Chess, Square } from 'chess.js';
import { Board, BoardMove } from '../../components/Board';
import { FadeIn } from '../../components/FadeIn';
import { MoveStep as MoveStepData } from '../../data/lessonTypes';
import { StepCallbacks } from '../stepTypes';
import { colors, fonts, space } from '../../theme';

type Props = { step: MoveStepData } & StepCallbacks;

export function MoveStep({ step, onCorrect, onWrong, locked }: Props) {
  const [fen, setFen] = useState(step.fen);
  const [solved, setSolved] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);

  const handleMove = (m: BoardMove) => {
    if (solved || locked) return;
    // Una solución con 5 letras (e7e8n) pide además esa pieza al coronar; con 4, vale cualquiera.
    const uci = `${m.from}${m.to}${m.promotion ?? ''}`;
    const ok = step.solutions.some((s) => (s.length === 5 ? s === uci : s === uci.slice(0, 4)));
    // La jugada se ve en el tablero, sea correcta o no.
    try {
      const chess = new Chess(step.fen);
      chess.move({ from: m.from, to: m.to, promotion: m.promotion });
      setFen(chess.fen());
      setLastMove({ from: m.from, to: m.to });
    } catch {
      return;
    }
    if (ok) {
      setSolved(true);
      onCorrect(step.success);
    } else {
      // "Reintentar" vuelve a la posición del ejercicio.
      onWrong(step.hint, () => {
        setFen(step.fen);
        setLastMove(null);
      });
    }
  };

  return (
    <View>
      <Board
        fen={fen}
        orientation={step.orientation ?? 'w'}
        interactive={!solved && !locked}
        lastMove={lastMove}
        highlight={step.highlight}
        onMove={handleMove}
      />
      <View style={{ height: space.lg }} />
      <FadeIn>
        <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: colors.text, lineHeight: 26 }}>{step.prompt}</Text>
      </FadeIn>
    </View>
  );
}
