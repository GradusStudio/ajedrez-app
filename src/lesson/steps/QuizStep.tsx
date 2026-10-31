import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Board } from '../../components/Board';
import { FadeIn } from '../../components/FadeIn';
import { QuizStep as QuizStepData } from '../../data/lessonTypes';
import { useI18n } from '../../i18n/I18nContext';
import { StepCallbacks } from '../stepTypes';
import { TeacherBubble } from '../TeacherBubble';
import { colors, fonts, radius, space } from '../../theme';

type Props = { step: QuizStepData } & StepCallbacks;

export function QuizStep({ step, onCorrect, onWrong, locked }: Props) {
  const { t } = useI18n();
  const [wrong, setWrong] = useState<number[]>([]);
  const [solved, setSolved] = useState(false);

  const pick = (i: number) => {
    // La opción equivocada queda marcada en rojo; tras "Reintentar" se elige otra.
    if (solved || locked || wrong.includes(i)) return;
    if (i === step.answer) {
      setSolved(true);
      onCorrect(step.explanation);
    } else {
      setWrong((w) => [...w, i]);
      onWrong(step.feedback?.[i] ?? t('lesson.quizWrong'));
    }
  };

  return (
    <View>
      <Board fen={step.fen} orientation={step.orientation ?? 'w'} interactive={false} highlight={step.highlight} />
      <View style={{ height: space.lg }} />
      <FadeIn>
        <TeacherBubble>{step.prompt}</TeacherBubble>
      </FadeIn>
      <View style={{ height: space.md }} />
      {/* Las opciones aparecen una tras otra, después del enunciado */}
      {step.options.map((opt, i) => {
        const isWrong = wrong.includes(i);
        const isRight = solved && i === step.answer;
        return (
          <FadeIn key={i} delay={120 + i * 70}>
            <Pressable
              onPress={() => pick(i)}
              accessibilityRole="button"
              accessibilityLabel={opt}
              style={[
                styles.option,
                isRight && { borderColor: colors.primary, backgroundColor: colors.correctBg },
                isWrong && { borderColor: colors.danger, backgroundColor: colors.incorrectBg },
              ]}
            >
              <Text style={[styles.optionText, isWrong && { opacity: 0.7 }]}>{opt}</Text>
            </Pressable>
          </FadeIn>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  option: {
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    borderBottomWidth: 4,
    borderBottomColor: colors.surfaceShadow,
    paddingVertical: 14,
    paddingHorizontal: space.lg,
    marginBottom: space.sm,
  },
  optionText: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
});
