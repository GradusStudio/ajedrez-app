import React from 'react';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { findBot } from '../../data/bots';
import { BotDetailScreen } from '../../screens/BotDetailScreen';

export default function BotRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const bot = findBot(id);
  if (!bot) return <Redirect href="/bots" />;

  return (
    <BotDetailScreen
      bot={bot}
      onBack={() => router.back()}
      onPlay={(color) => router.push({ pathname: '/partida', params: { bot: bot.id, color } })}
    />
  );
}
