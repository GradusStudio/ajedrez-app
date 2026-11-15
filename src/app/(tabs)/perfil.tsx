import React from 'react';
import { router } from 'expo-router';
import { WideListColumn } from '../../components/WideListColumn';
import { ProfileScreen } from '../../screens/ProfileScreen';

export default function ProfileTab() {
  return (
    <WideListColumn width={1000}>
      <ProfileScreen
        onOpenSettings={() => router.push('/ajustes')}
        onOpenBotGames={() => router.push('/historial-bots')}
        onOpenReview={(lessonId, stepIds) =>
          router.push({ pathname: '/leccion/[id]', params: { id: lessonId, repaso: stepIds.join(',') } })
        }
        onOpenUnit={(unit) => router.push({ pathname: '/aprender', params: { unidad: String(unit) } })}
        onOpenBot={(botId) => router.push({ pathname: '/bot/[id]', params: { id: botId } })}
        onOpenPuzzles={() => router.push('/puzzles')}
      />
    </WideListColumn>
  );
}
