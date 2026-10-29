import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Square } from 'chess.js';
import { Board } from '../../components/Board';
import { Button3D } from '../../components/Button3D';
import { FadeIn } from '../../components/FadeIn';
import { SelectSquaresStep as SelectSquaresStepData } from '../../data/lessonTypes';
import { StepCallbacks } from '../stepTypes';
import { colors, fonts, space } from '../../theme';

type Props = { step: SelectSquaresStepData } & StepCallbacks;

export function SelectSquaresStep({ step, onCorrect, onWrong, locked }: Props) {
  const [picked, setPicked] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);

  // Tras un error, las casillas elegidas quedan marcadas para corregirlas después de "Reintentar".
  const toggle = (s: Square) => {
    if (solved || locked) return;
    setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));
  };

  const check = () => {
    const ok = picked.length === step.squares.length && step.squares.every((s) => picked.includes(s));
    if (ok) {
      setSolved(true);
      onCorrect('Correcto');
    } else {
      onWrong(step.hint);
    }
  };

  return (
    <View>
      <Board
        fen={step.fen}
        orientation={step.orientation ?? 'w'}
        interactive={false}
        highlight={solved ? step.squares : step.highlight}
        pickedSquares={solved ? [] : picked}
        onSquarePress={toggle}
      />
      <View style={{ height: space.lg }} />
      <FadeIn>
        <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: colors.text, lineHeight: 26 }}>{step.prompt}</Text>
      </FadeIn>
      {!solved && !locked && (
        <View style={{ marginTop: space.lg }}>
          <Button3D label="Comprobar" variant={picked.length > 0 ? 'primary' : 'secondary'} onPress={check} />
        </View>
      )}
    </View>
  );
}
