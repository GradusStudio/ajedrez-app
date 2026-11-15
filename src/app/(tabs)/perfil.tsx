import React from 'react';
import { router } from 'expo-router';
import { ProfileScreen } from '../../screens/ProfileScreen';

export default function ProfileTab() {
  return (
    <ProfileScreen
      onOpenSettings={() => router.push('/ajustes')}
      onOpenCredits={() => router.push('/creditos')}
      onOpenPieces={() => router.push({ pathname: '/tienda', params: { tab: 'piezas' } })}
      onOpenBoards={() => router.push({ pathname: '/tienda', params: { tab: 'tableros' } })}
      onOpenBotGames={() => router.push('/historial-bots')}
      onOpenReview={(lessonId, stepIds) =>
        router.push({ pathname: '/leccion/[id]', params: { id: lessonId, repaso: stepIds.join(',') } })
      }
    />
  );
}
