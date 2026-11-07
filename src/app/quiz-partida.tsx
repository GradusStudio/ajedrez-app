import React from 'react';
import { router } from 'expo-router';
import { TurningPointQuizScreen } from '../screens/TurningPointQuizScreen';

export default function TurningPointQuizRoute() {
  return <TurningPointQuizScreen onExit={() => router.back()} />;
}
