import React, { useEffect, useState } from 'react';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useContent } from '../data/useContent';
import { replayMoves } from '../progress/ongoingGame';
import { useProgress } from '../progress/ProgressContext';
import type { OngoingGame } from '../progress/progressStore';
import { GameScreen } from '../screens/GameScreen';

/**
 * Partida contra un bot. Parámetros: bot (id), color (del usuario: w/b),
 * curso (opcional: modo práctica de esa apertura), n (para que la revancha empiece de cero) y
 * continuar=1 (retoma la partida sin terminar guardada en el progreso; entonces bot, color y curso salen de ella).
 */
export default function GameRoute() {
  const params = useLocalSearchParams<{ bot: string; color: string; curso?: string; n?: string; continuar?: string }>();
  const { loaded } = useProgress();
  if (params.continuar === '1') return loaded ? <ResumeRoute /> : null;
  return <NewGame bot={params.bot} color={params.color} curso={params.curso} n={params.n} />;
}

/**
 * Se toma una copia de la partida guardada al entrar: al terminarla o al cambiar de dispositivo el progreso la quita,
 * y la pantalla tiene que seguir mostrando el resultado en vez de redirigir.
 */
function ResumeRoute() {
  const { progress, saveOngoingGame } = useProgress();
  const { findBot, findOpening } = useContent();
  const [saved] = useState<OngoingGame | undefined>(() => progress.ongoingGame);
  const [valid] = useState(
    () => !!saved && !!findBot(saved.botId) && (!saved.practiceCourseId || !!findOpening(saved.practiceCourseId)) && replayMoves(saved.moves) !== null
  );
  // Una partida guardada que ya no se puede retomar (bot o curso que no existen, jugadas ilegales) se descarta.
  useEffect(() => {
    if (saved && !valid) saveOngoingGame(null);
  }, [saved, valid, saveOngoingGame]);
  if (!saved || !valid) return <Redirect href="/bots" />;
  return <NewGame bot={saved.botId} color={saved.userColor} curso={saved.practiceCourseId} moves={saved.moves} startedAt={saved.startedAt} />;
}

function NewGame({ bot: botId, color, curso, n, moves, startedAt }: { bot: string; color: string; curso?: string; n?: string; moves?: string[]; startedAt?: string }) {
  const { findBot, findOpening } = useContent();
  const bot = findBot(botId);
  if (!bot) return <Redirect href="/bots" />;
  const userColor = color === 'b' ? 'b' : 'w';
  const practiceCourse = curso ? findOpening(curso) : undefined;

  return (
    <GameScreen
      key={`${bot.id}-${userColor}-${n ?? 0}`}
      bot={bot}
      userColor={userColor}
      practiceCourse={practiceCourse}
      initialMoves={moves}
      initialStartedAt={startedAt}
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
