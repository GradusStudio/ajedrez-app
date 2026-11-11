import React from 'react';
import { router } from 'expo-router';
import { CreditsScreen } from '../screens/CreditsScreen';
import { WideListColumn } from '../components/WideListColumn';
import { WIDE_GRID_COLUMN } from '../components/wideLayout';

export default function CreditsRoute() {
  return (
    <WideListColumn width={WIDE_GRID_COLUMN}>
      <CreditsScreen onBack={() => router.back()} />
    </WideListColumn>
  );
}
