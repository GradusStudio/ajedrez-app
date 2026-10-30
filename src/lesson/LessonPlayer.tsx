import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, BackHandler, Pressable, ScrollView, StatusBar as RNStatusBar, StyleSheet, Text, View } from 'react-native';
import { FeedbackPanel } from '../components/FeedbackPanel';
import { useFeedback } from '../feedback/feedback';
import { ProgressBar } from '../components/ProgressBar';
import { Lesson, Step } from '../data/lessonTypes';
import { ExplainStep } from './steps/ExplainStep';
import { LineStep } from './steps/LineStep';
import { MoveStep } from './steps/MoveStep';
import { PracticeStep } from './steps/PracticeStep';
import { QuizStep } from './steps/QuizStep';
import { SelectSquaresStep } from './steps/SelectSquaresStep';
import { colors, fonts, space } from '../theme';

export type LessonResult = { errors: number; xp: number; mistakes: string[] }; // xp: monedas de la lección

/** Dónde va el usuario: sirve para guardar el avance y retomarlo. */
export type LessonState = { stepIndex: number; errors: number; mistakes: string[] };

type Props = {
  lesson: Lesson;
  /** Avance guardado desde donde retomar. */
  initial?: LessonState;
  /** Texto del aviso al salir con la ✕ o el botón "atrás". */
  exitMessage: string;
  onExit: (state: LessonState) => void;
  /** Se llama al pasar al paso siguiente, con el estado nuevo. */
  onAdvance?: (state: LessonState) => void;
  onFinish: (result: LessonResult) => void;
};

type Status = 'idle' | 'correct' | 'wrong';

export function LessonPlayer({ lesson, initial, exitMessage, onExit, onAdvance, onFinish }: Props) {
  const start = initial && initial.stepIndex < lesson.steps.length ? initial : undefined;
  const [index, setIndex] = useState(start?.stepIndex ?? 0);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [mistakes, setMistakes] = useState<string[]>(start?.mistakes ?? []);
  const [errors, setErrors] = useState(start?.errors ?? 0);

  const step: Step = lesson.steps[index];
  const total = lesson.steps.length;
  const isLast = index === total - 1;

  const feedback = useFeedback();

  const onCorrect = useCallback(
    (m?: string) => {
      feedback.correct();
      setStatus('correct');
      setMessage(m ?? '');
    },
    [feedback]
  );

  // Lo que deshace el error a la vista (por ejemplo, la jugada equivocada), para "Reintentar".
  const undoWrong = useRef<(() => void) | null>(null);

  const onWrong = useCallback(
    (m: string, undo?: () => void) => {
      feedback.wrong();
      undoWrong.current = undo ?? null;
      setStatus('wrong');
      setMessage(m);
      setErrors((e) => e + 1);
      setMistakes((list) => (list.includes(step.id) ? list : [...list, step.id]));
    },
    [step.id, feedback]
  );

  const onClear = useCallback(() => {
    undoWrong.current = null;
    setStatus('idle');
    setMessage('');
  }, []);

  /** "Reintentar": deshace lo equivocado y deja seguir desde la misma posición. */
  const retry = () => {
    undoWrong.current?.();
    onClear();
  };

  // Un doble toque en "Terminar" no debe registrar la lección dos veces.
  const finished = useRef(false);

  const next = () => {
    if (isLast) {
      if (finished.current) return;
      finished.current = true;
      onFinish({ errors, xp: lesson.xp, mistakes });
    } else {
      setIndex(index + 1);
      setStatus('idle');
      setMessage('');
      onAdvance?.({ stepIndex: index + 1, errors, mistakes });
    }
  };

  const confirmExit = () => {
    Alert.alert('¿Salir de la lección?', exitMessage, [
      { text: 'Seguir', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => onExit({ stepIndex: index, errors, mistakes }) },
    ]);
  };

  // El botón "atrás" de Android pide la misma confirmación que la ✕.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      confirmExit();
      return true;
    });
    return () => sub.remove();
  });

  const renderStep = () => {
    const callbacks = { onCorrect, onWrong, locked: status === 'wrong' };
    switch (step.type) {
      case 'explain':
        return <ExplainStep step={step} />;
      case 'move':
        return <MoveStep step={step} {...callbacks} />;
      case 'quiz':
        return <QuizStep step={step} {...callbacks} />;
      case 'select_squares':
        return <SelectSquaresStep step={step} {...callbacks} />;
      case 'line':
        return <LineStep step={step} {...callbacks} onClear={onClear} />;
      case 'practice':
        return <PracticeStep step={step} {...callbacks} />;
    }
  };

  const continueLabel = isLast ? 'Terminar' : 'Continuar';
  const progress = (index + (status === 'correct' ? 1 : 0)) / total;

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: (RNStatusBar.currentHeight ?? 40) + space.sm }]}>
        <Pressable onPress={confirmExit} accessibilityRole="button" accessibilityLabel="Salir" hitSlop={12}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
        <ProgressBar value={progress} />
      </View>

      {/* key = id del paso: cada paso empieza con su estado limpio */}
      <ScrollView contentContainerStyle={styles.content}>
        <View key={step.id}>{renderStep()}</View>
      </ScrollView>

      {step.type === 'explain' && <FeedbackPanel kind="neutral" buttonLabel={continueLabel} onButton={next} />}
      {step.type !== 'explain' && status === 'correct' && (
        <FeedbackPanel kind="correct" title="Correcto" message={message} buttonLabel={continueLabel} onButton={next} />
      )}
      {step.type !== 'explain' && status === 'wrong' && (
        <FeedbackPanel kind="wrong" title="Incorrecto" message={message} buttonLabel="Reintentar" onButton={retry} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingBottom: space.md },
  close: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.textMuted },
  content: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.xl },
});
