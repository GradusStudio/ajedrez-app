import React from 'react';
import { router } from 'expo-router';
import { CreditsScreen } from '../screens/CreditsScreen';

export default function CreditsRoute() {
  return <CreditsScreen onBack={() => router.back()} />;
}
