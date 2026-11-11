import React from 'react';
import { router } from 'expo-router';
import { SettingsScreen } from '../screens/SettingsScreen';
import { WideListColumn } from '../components/WideListColumn';

export default function SettingsRoute() {
  return (
    <WideListColumn>
      <SettingsScreen
        onBack={() => router.back()}
        onOpenPieces={() => router.push('/piezas')}
        onOpenBoards={() => router.push('/tableros')}
      />
    </WideListColumn>
  );
}
