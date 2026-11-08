import React, { useState } from 'react';
import { View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useI18n } from '../i18n/I18nContext';
import { useProgress } from '../progress/ProgressContext';
import { isPuzzleSolved } from '../progress/progressStore';
import { findPuzzle, Level, LEVELS, nextPuzzle, PRACTICE_THEMES, Puzzle, themeName } from '../puzzles/puzzles';
import { PuzzlesStatus } from '../puzzles/PuzzlesStatus';
import { usePuzzles } from '../puzzles/usePuzzles';
import { PuzzleScreen } from '../screens/PuzzleScreen';
import { colors } from '../theme';

/**
 * Un puzzle. Parámetros: modo (dia | practica), id (puzzle del día), nivel y tema (práctica).
 * En práctica, "Siguiente puzzle" cambia el puzzle dentro de esta misma pantalla
 * (sin navegar: así no aparece un fondo blanco entre uno y otro).
 */
export default function PuzzleRoute() {
  const state = usePuzzles();
  if (state.status !== 'ready') return <PuzzlesStatus state={state} />;
  return <PuzzleLoaded puzzles={state.puzzles} />;
}

function PuzzleLoaded({ puzzles }: { puzzles: Puzzle[] }) {
  const params = useLocalSearchParams<{ modo?: string; id?: string; nivel?: string; tema?: string }>();
  const { progress } = useProgress();
  const { t } = useI18n();
  const practice = params.modo === 'practica';
  const level: Level = params.nivel && params.nivel in LEVELS ? (params.nivel as Level) : 'facil';
  // Un tema que no existe (un enlace escrito a mano) se ignora en vez de dejar la práctica vacía.
  const theme = params.tema && PRACTICE_THEMES.includes(params.tema) ? params.tema : null;
  const solved = (id: string) => isPuzzleSolved(progress, id);

  const [puzzle, setPuzzle] = useState(() =>
    params.id ? findPuzzle(puzzles, params.id) : nextPuzzle(puzzles, level, theme, solved)
  );
  if (!puzzle) return <Redirect href="/puzzles" />;

  const label = practice
    ? [t('puzzles.practice'), t(`puzzles.level.${level}`), theme ? themeName(theme, t) : null].filter(Boolean).join(' · ')
    : t('puzzles.daily');

  return (
    // Fondo oscuro debajo del fundido de entrada de cada puzzle.
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <PuzzleScreen
        key={puzzle.id}
        puzzle={puzzle}
        label={label}
        onExit={() => router.back()}
        onNext={practice ? () => setPuzzle(nextPuzzle(puzzles, level, theme, solved, puzzle.id) ?? puzzle) : undefined}
      />
    </View>
  );
}
