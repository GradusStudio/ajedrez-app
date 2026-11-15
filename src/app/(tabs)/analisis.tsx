import React from 'react';
import { router } from 'expo-router';
import { AnalysisScreen } from '../../screens/AnalysisScreen';

export default function AnalysisTab() {
  return (
    <AnalysisScreen
      onReview={() => router.push('/revision')}
      onFree={() => router.push('/analisis-libre')}
      onQuiz={() => router.push('/quiz-partida')}
      onBots={() => router.push('/bots')}
    />
  );
}
