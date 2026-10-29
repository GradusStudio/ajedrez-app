import React from 'react';
import { router } from 'expo-router';
import { PuzzlesScreen } from '../../screens/PuzzlesScreen';

export default function PuzzlesTab() {
  return (
    <PuzzlesScreen
      onOpenDaily={(id) => router.push({ pathname: '/puzzle', params: { id, modo: 'dia' } })}
      onPractice={(nivel, tema) =>
        router.push({ pathname: '/puzzle', params: { modo: 'practica', nivel, ...(tema ? { tema } : {}) } })
      }
    />
  );
}
