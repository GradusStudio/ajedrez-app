import React from 'react';
import { router } from 'expo-router';
import { PieceSetScreen } from '../screens/PieceSetScreen';

export default function PiecesRoute() {
  return <PieceSetScreen onBack={() => router.back()} />;
}
