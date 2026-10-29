import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { findLesson } from '../data/units';
import { useProgress } from '../progress/ProgressContext';
import { currentStreak } from '../progress/progressStore';
import { LessonResultScreen } from '../screens/LessonResultScreen';

export default function ResultRoute() {
  const params = useLocalSearchParams<{ id: string; errors: string; xp: string; fallos?: string; modo?: string }>();
  const { progress } = useProgress();
  const lesson = findLesson(params.id);
  const failed = params.fallos ?? '';

  return (
    <LessonResultScreen
      title={lesson?.title ?? ''}
      mode={params.modo === 'repaso' ? 'review' : params.xp === '0' ? 'replay' : 'lesson'}
      errors={Number(params.errors) || 0}
      xpEarned={Number(params.xp) || 0}
      streak={currentStreak(progress)}
      onContinue={() => router.back()}
      onReviewMistakes={
        failed && params.modo !== 'repaso'
          ? () => router.replace({ pathname: '/leccion/[id]', params: { id: params.id, repaso: failed } })
          : undefined
      }
    />
  );
}
