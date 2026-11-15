import React from 'react';
import { router } from 'expo-router';
import { WideListColumn } from '../../components/WideListColumn';
import { PuzzlesScreen } from '../../screens/PuzzlesScreen';

export default function PuzzlesTab() {
  return (
    <WideListColumn width={1000}>
      <PuzzlesScreen
        onOpenDaily={(id) => router.push({ pathname: '/puzzle', params: { id, modo: 'dia' } })}
        onPractice={(nivel, tema) =>
          router.push({ pathname: '/puzzle', params: { modo: 'practica', nivel, ...(tema ? { tema } : {}) } })
        }
      />
    </WideListColumn>
  );
}
