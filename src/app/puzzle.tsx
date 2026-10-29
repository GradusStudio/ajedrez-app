import React, { useState } from 'react';
import { View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useProgress } from '../progress/ProgressContext';
import { isPuzzleSolved } from '../progress/progressStore';
import { findPuzzle, Level, LEVELS, nextPuzzle, themeName } from '../puzzles/puzzles';
import { PuzzleScreen } from '../screens/PuzzleScreen';
import { colors } from '../theme';

/**
 * Un puzzle. Parámetros: modo (dia | practica), id (puzzle del día), nivel y tema (práctica).
 * En práctica, "Siguiente puzzle" cambia el puzzle dentro de esta misma pantalla
 * (sin navegar: así no aparece un fondo blanco entre uno y otro).
 */
export default function PuzzleRoute() {
  const params = useLocalSearchParams<{ modo?: string; id?: string; nivel?: string; tema?: string }>();
  const { progress } = useProgress();
  const practice = params.modo === 'practica';
  const level: Level = params.nivel && params.nivel in LEVELS ? (params.nivel as Level) : 'facil';
  const theme = params.tema ?? null;
  const solved = (id: string) => isPuzzleSolved(progress, id);

  const [puzzle, setPuzzle] = useState(() =>
    params.id ? findPuzzle(params.id) : nextPuzzle(level, theme, solved)
  );
  if (!puzzle) return <Redirect href="/puzzles" />;

  const label = practice
    ? ['Práctica', LEVELS[level].label, theme ? themeName(theme) : null].filter(Boolean).join(' · ')
    : 'Puzzle del día';

  return (
    // Fondo oscuro debajo del fundido de entrada de cada puzzle.
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <PuzzleScreen
        key={puzzle.id}
        puzzle={puzzle}
        label={label}
        onExit={() => router.back()}
        onNext={practice ? () => setPuzzle(nextPuzzle(level, theme, solved, puzzle.id) ?? puzzle) : undefined}
      />
    </View>
  );
}
