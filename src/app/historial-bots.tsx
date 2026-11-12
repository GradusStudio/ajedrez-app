import React from 'react';
import { router } from 'expo-router';
import { BotGamesScreen } from '../screens/BotGamesScreen';
import { WideListColumn } from '../components/WideListColumn';
import { WIDE_GRID_COLUMN } from '../components/wideLayout';

export default function BotGamesRoute() {
  return (
    <WideListColumn width={WIDE_GRID_COLUMN}>
      <BotGamesScreen
        onBack={() => router.back()}
        onOpenBot={(id) => router.push({ pathname: '/bot/[id]', params: { id } })}
      />
    </WideListColumn>
  );
}
