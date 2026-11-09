import React from 'react';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useContent } from '../../data/useContent';
import { useConfirmNewGame } from '../../progress/useConfirmNewGame';
import { BotDetailScreen } from '../../screens/BotDetailScreen';

export default function BotRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { findBot } = useContent();
  const bot = findBot(id);
  const confirmNewGame = useConfirmNewGame();
  if (!bot) return <Redirect href="/bots" />;

  return (
    <BotDetailScreen
      bot={bot}
      onBack={() => router.back()}
      onPlay={(color) => confirmNewGame(() => router.push({ pathname: '/partida', params: { bot: bot.id, color } }))}
    />
  );
}
