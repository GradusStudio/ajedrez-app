import React from 'react';
import { router } from 'expo-router';
import { ImportGameScreen } from '../screens/ImportGameScreen';

export default function ImportGameRoute() {
  return <ImportGameScreen onBack={() => router.back()} onReview={() => router.push('/revision')} />;
}
