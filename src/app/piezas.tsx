import React from 'react';
import { router } from 'expo-router';
import { PieceSetScreen } from '../screens/PieceSetScreen';
import { WideListColumn } from '../components/WideListColumn';
import { WIDE_GRID_COLUMN } from '../components/wideLayout';

export default function PiecesRoute() {
  return (
    <WideListColumn width={WIDE_GRID_COLUMN}>
      <PieceSetScreen onBack={() => router.back()} />
    </WideListColumn>
  );
}
