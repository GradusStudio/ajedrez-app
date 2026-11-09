import React from 'react';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { botForOpening } from '../../data/bots';
import { useContent } from '../../data/useContent';
import { useConfirmNewGame } from '../../progress/useConfirmNewGame';
import { OpeningDetailScreen } from '../../screens/OpeningDetailScreen';

export default function OpeningRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { findOpening } = useContent();
  const course = findOpening(id);
  const confirmNewGame = useConfirmNewGame();
  if (!course) return <Redirect href="/aperturas" />;

  return (
    <OpeningDetailScreen
      course={course}
      onBack={() => router.back()}
      onStartLesson={(lesson) => router.push({ pathname: '/leccion/[id]', params: { id: lesson.id } })}
      onPractice={() =>
        confirmNewGame(() =>
          router.push({
            pathname: '/partida',
            params: { bot: botForOpening(course.id).id, color: course.color, curso: course.id },
          })
        )
      }
    />
  );
}
