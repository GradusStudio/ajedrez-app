import React from 'react';
import { router } from 'expo-router';
import { WideListColumn } from '../../components/WideListColumn';
import { ProfileScreen } from '../../screens/ProfileScreen';
import { useProgress } from '../../progress/ProgressContext';

export default function ProfileTab() {
  const { setLastUnit } = useProgress();
  return (
    <WideListColumn width={1000}>
      <ProfileScreen
        onOpenSettings={() => router.push('/ajustes')}
        onOpenBotGames={() => router.push('/historial-bots')}
        onOpenReview={(lessonId, stepIds) =>
          router.push({ pathname: '/leccion/[id]', params: { id: lessonId, repaso: stepIds.join(',') } })
        }
        onOpenUnit={(unit) => {
          setLastUnit(unit);
          router.push('/aprender');
        }}
        onOpenBot={(botId) => router.push({ pathname: '/bot/[id]', params: { id: botId } })}
        onOpenPuzzles={() => router.push('/puzzles')}
      />
    </WideListColumn>
  );
}
