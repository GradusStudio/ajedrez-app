import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { GameReviewScreen } from '../screens/GameReviewScreen';

export default function ReviewRoute() {
  // `from=game` lo pone la capa del resultado de una partida: el botón de volver no puede prometer «Análisis».
  const { from } = useLocalSearchParams<{ from?: string }>();
  return <GameReviewScreen from={from} onBack={() => router.back()} onPractice={() => router.push('/quiz-partida')} />;
}
