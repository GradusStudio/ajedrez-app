import React from 'react';
import { router } from 'expo-router';
import { WideListColumn } from '../../components/WideListColumn';
import { WIDE_GRID_COLUMN } from '../../components/wideLayout';
import { BotsScreen } from '../../screens/BotsScreen';

export default function BotsTab() {
  return (
    <WideListColumn width={WIDE_GRID_COLUMN}>
      <BotsScreen
        onOpenBot={(bot) => router.push({ pathname: '/bot/[id]', params: { id: bot.id } })}
        onContinue={() => router.push({ pathname: '/partida', params: { continuar: '1' } })}
      />
    </WideListColumn>
  );
}
