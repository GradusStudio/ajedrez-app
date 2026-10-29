import React from 'react';
import { router } from 'expo-router';
import { useProgress } from '../progress/ProgressContext';
import { OnboardingScreen } from '../screens/OnboardingScreen';

// Se abre sola la primera vez (ver (tabs)/_layout.tsx). Al terminar o saltar, no vuelve a aparecer.
export default function WelcomeRoute() {
  const { updateProfile } = useProgress();
  return (
    <OnboardingScreen
      onFinish={({ level, dailyGoalMin }) => {
        updateProfile({ onboarded: true, ...(level ? { level } : {}), ...(dailyGoalMin ? { dailyGoalMin } : {}) });
        router.replace('/');
      }}
    />
  );
}
