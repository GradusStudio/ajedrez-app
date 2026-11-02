import React from 'react';
import { router } from 'expo-router';
import { GameReviewScreen } from '../screens/GameReviewScreen';

export default function ReviewRoute() {
  return <GameReviewScreen onBack={() => router.back()} />;
}
