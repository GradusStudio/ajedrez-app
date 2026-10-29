import React from 'react';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { findBot } from '../data/bots';
import { findOpening } from '../data/openings';
import { GameScreen } from '../screens/GameScreen';

/**
 * Partida contra un bot. Parámetros: bot (id), color (del usuario: w/b),
 * curso (opcional: modo práctica de esa apertura) y n (para que la revancha empiece de cero).
 */
export default function GameRoute() {
  const params = useLocalSearchParams<{ bot: string; color: string; curso?: string; n?: string }>();
  const bot = findBot(params.bot);
  if (!bot) return <Redirect href="/bots" />;
  const userColor = params.color === 'b' ? 'b' : 'w';
  const practiceCourse = params.curso ? findOpening(params.curso) : undefined;

  return (
    <GameScreen
      key={`${bot.id}-${userColor}-${params.n ?? 0}`}
      bot={bot}
      userColor={userColor}
      practiceCourse={practiceCourse}
      onExit={() => router.back()}
      onRematch={() =>
        router.replace({
          pathname: '/partida',
          params: {
            bot: bot.id,
            // Revancha con los colores cambiados; en práctica, siempre con el color de la apertura.
            color: practiceCourse ? userColor : userColor === 'w' ? 'b' : 'w',
            ...(practiceCourse ? { curso: practiceCourse.id } : {}),
            n: String(Date.now()),
          },
        })
      }
      onOtherBot={() => (practiceCourse ? router.back() : router.dismissTo('/bots'))}
    />
  );
}
