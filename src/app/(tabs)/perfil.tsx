import React from 'react';
import { router } from 'expo-router';
import { ProfileScreen } from '../../screens/ProfileScreen';

export default function ProfileTab() {
  return <ProfileScreen onOpenSettings={() => router.push('/ajustes')} onOpenCredits={() => router.push('/creditos')} />;
}
