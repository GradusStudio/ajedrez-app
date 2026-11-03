import React from 'react';
import { router } from 'expo-router';
import { BoardThemeScreen } from '../screens/BoardThemeScreen';

export default function BoardsRoute() {
  return <BoardThemeScreen onBack={() => router.back()} />;
}
