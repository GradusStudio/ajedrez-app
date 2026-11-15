import React from 'react';
import { router } from 'expo-router';
import { WideListColumn } from '../../components/WideListColumn';
import { WIDE_GRID_COLUMN } from '../../components/wideLayout';
import { StartScreen } from '../../screens/StartScreen';

export default function StartTab() {
  return (
    <WideListColumn width={WIDE_GRID_COLUMN}>
      <StartScreen
        onLesson={(lesson) => router.push({ pathname: '/leccion/[id]', params: { id: lesson.id } })}
        onDaily={(id) => router.push({ pathname: '/puzzle', params: { id, modo: 'dia' } })}
        onFirstPuzzle={() => router.push({ pathname: '/puzzle', params: { modo: 'practica', nivel: 'facil' } })}
        onContinueGame={() => router.push({ pathname: '/partida', params: { continuar: '1' } })}
        onBot={(bot) => router.push({ pathname: '/bot/[id]', params: { id: bot.id } })}
        onFirstGame={(bot) => router.push({ pathname: '/partida', params: { bot: bot.id } })}
        onCourse={(course) => router.push({ pathname: '/apertura/[id]', params: { id: course.id } })}
        onShop={() => router.push('/tienda')}
      />
    </WideListColumn>
  );
}
