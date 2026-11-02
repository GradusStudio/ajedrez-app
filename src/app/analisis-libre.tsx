import React from 'react';
import { router } from 'expo-router';
import { FreePlayScreen } from '../screens/FreePlayScreen';

export default function FreeAnalysisRoute() {
  return <FreePlayScreen onBack={() => router.back()} />;
}
