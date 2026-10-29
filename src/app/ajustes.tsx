import React from 'react';
import { router } from 'expo-router';
import { SettingsScreen } from '../screens/SettingsScreen';

export default function SettingsRoute() {
  return <SettingsScreen onBack={() => router.back()} onOpenPieces={() => router.push('/piezas')} />;
}
