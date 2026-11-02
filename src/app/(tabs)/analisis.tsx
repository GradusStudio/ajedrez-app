import React from 'react';
import { router } from 'expo-router';
import { AnalysisMenuScreen } from '../../screens/AnalysisMenuScreen';

export default function AnalysisTab() {
  return <AnalysisMenuScreen onGame={() => router.push('/importar-partida')} onFree={() => router.push('/analisis-libre')} />;
}
