import React, { useState } from 'react';
import { View } from 'react-native';
import { Square } from 'chess.js';
import { Board } from '../../components/Board';
import { Button3D } from '../../components/Button3D';
import { FadeIn } from '../../components/FadeIn';
import { SelectSquaresStep as SelectSquaresStepData } from '../../data/lessonTypes';
import { useI18n } from '../../i18n/I18nContext';
import { StepCallbacks } from '../stepTypes';
import { TeacherBubble } from '../TeacherBubble';
import { space } from '../../theme';

type Props = { step: SelectSquaresStepData } & StepCallbacks;

export function SelectSquaresStep({ step, onCorrect, onWrong, locked }: Props) {
  const { t } = useI18n();
  const [picked, setPicked] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);

  // Tras un error, las casillas elegidas quedan marcadas para corregirlas después de "Reintentar".
  // No se pueden marcar más casillas que las de la respuesta: con una sola, tocar otra la reemplaza;
  // con varias, al pasarse se desmarca la más antigua.
  const toggle = (s: Square) => {
    if (solved || locked) return;
    const max = step.squares.length;
    setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s].slice(-max)));
  };

  const check = () => {
    const ok = picked.length === step.squares.length && step.squares.every((s) => picked.includes(s));
    if (ok) {
      setSolved(true);
      onCorrect(t('lesson.correct'));
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
        <TeacherBubble>{step.prompt}</TeacherBubble>
      </FadeIn>
      {!solved && !locked && (
        <View style={{ marginTop: space.lg }}>
          <Button3D label={t('lesson.check')} variant={picked.length > 0 ? 'primary' : 'secondary'} onPress={check} />
        </View>
      )}
    </View>
  );
}
