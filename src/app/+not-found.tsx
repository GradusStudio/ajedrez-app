import React from 'react';
import { router } from 'expo-router';
import { NotFoundScreen } from '../screens/NotFoundScreen';

export default function NotFoundRoute() {
  return <NotFoundScreen onHome={() => router.replace('/')} />;
}
