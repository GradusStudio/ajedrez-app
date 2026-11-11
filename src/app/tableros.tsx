import React from 'react';
import { router } from 'expo-router';
import { BoardThemeScreen } from '../screens/BoardThemeScreen';
import { WideListColumn } from '../components/WideListColumn';
import { WIDE_GRID_COLUMN } from '../components/wideLayout';

export default function BoardsRoute() {
  return (
    <WideListColumn width={WIDE_GRID_COLUMN}>
      <BoardThemeScreen onBack={() => router.back()} />
    </WideListColumn>
  );
}
