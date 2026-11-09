import React from 'react';
import { router } from 'expo-router';
import { BotsScreen } from '../../screens/BotsScreen';

export default function BotsTab() {
  return (
    <BotsScreen
      onOpenBot={(bot) => router.push({ pathname: '/bot/[id]', params: { id: bot.id } })}
      onContinue={() => router.push({ pathname: '/partida', params: { continuar: '1' } })}
    />
  );
}
