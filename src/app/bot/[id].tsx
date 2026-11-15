import React from 'react';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useContent } from '../../data/useContent';
import { useConfirmNewGame } from '../../progress/useConfirmNewGame';
import { WideListColumn } from '../../components/WideListColumn';
import { BotDetailScreen } from '../../screens/BotDetailScreen';

export default function BotRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { findBot, findOpening } = useContent();
  const bot = findBot(id);
  const confirmNewGame = useConfirmNewGame();
  if (!bot) return <Redirect href="/bots" />;

  return (
    <WideListColumn width={1000}>
      <BotDetailScreen
        bot={bot}
        onBack={() => router.back()}
        onPlay={(color) => confirmNewGame(() => router.push({ pathname: '/partida', params: { bot: bot.id, color } }))}
        onContinue={() => router.push({ pathname: '/partida', params: { continuar: '1' } })}
        onOpenCourse={(courseId) => router.push({ pathname: '/apertura/[id]', params: { id: courseId } })}
        onPractice={(courseId, color) => {
          const course = findOpening(courseId);
          if (!course) return;
          confirmNewGame(() =>
            // La ficha promete «Practica la apertura contra este bot»: se juega contra el de la ficha, no contra
            // el de menor nivel que conoce el curso (botForOpening).
            router.push({ pathname: '/partida', params: { bot: bot.id, color, curso: course.id } })
          );
        }}
      />
    </WideListColumn>
  );
}
