import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useI18n } from '../i18n/I18nContext';
import { useProgress } from '../progress/ProgressContext';
import { isPuzzleSolved } from '../progress/progressStore';
import { currentRating } from '../progress/puzzleRating';
import { Level, LEVELS, PRACTICE_THEMES, Puzzle, themeName } from '../puzzles/puzzles';
import { PuzzlesStatus } from '../puzzles/PuzzlesStatus';
import { PuzzleSource } from '../puzzles/source';
import { isOfflineError, usePuzzleSource } from '../puzzles/usePuzzles';
import { PuzzleScreen } from '../screens/PuzzleScreen';
import { colors } from '../theme';

/**
 * Un puzzle. Parámetros: modo (dia | practica), id (puzzle del día), nivel y tema (práctica).
 * En práctica, `nivel` ausente o `auto` es la dificultad automática: puzzles cerca del nivel de puzzles.
 * En práctica, "Siguiente puzzle" cambia el puzzle dentro de esta misma pantalla
 * (sin navegar: así no aparece un fondo blanco entre uno y otro).
 */
export default function PuzzleRoute() {
  const state = usePuzzleSource();
  if (state.status !== 'ready') return <PuzzlesStatus state={state} />;
  return <PuzzleLoaded source={state.source} />;
}

type Current = { status: 'loading' } | { status: 'error'; offline: boolean } | { status: 'missing' } | { status: 'ready'; puzzle: Puzzle };

function PuzzleLoaded({ source }: { source: PuzzleSource }) {
  const params = useLocalSearchParams<{ modo?: string; id?: string; nivel?: string; tema?: string }>();
  const { progress } = useProgress();
  const { t } = useI18n();
  const practice = params.modo === 'practica';
  // Un nivel válido elige la dificultad a mano; si no (`auto`, ausente o inventado), Automático.
  const level: Level | null = params.nivel && params.nivel in LEVELS ? (params.nivel as Level) : null;
  // Un tema que no existe (un enlace escrito a mano) se ignora en vez de dejar la práctica vacía.
  const theme = params.tema && PRACTICE_THEMES.includes(params.tema) ? params.tema : null;
  // El progreso más reciente, para que «Siguiente» no vuelva a dar el puzzle recién resuelto.
  const progressRef = useRef(progress);
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);
  const seen = useRef(new Set<string>());
  const [current, setCurrent] = useState<Current>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const byId = useRef(params.id);

  const show = useCallback(
    (request: Promise<Puzzle | undefined>) =>
      request.then(
        (puzzle) => {
          if (!puzzle) return setCurrent({ status: 'missing' });
          seen.current.add(puzzle.id);
          setCurrent({ status: 'ready', puzzle });
        },
        (e) => setCurrent({ status: 'error', offline: isOfflineError(e) })
      ),
    []
  );
  /** Siguiente de práctica: a mano, del nivel elegido; en Automático, cerca del nivel de puzzles ya actualizado. */
  const request = useCallback(() => {
    const solved = (id: string) => isPuzzleSolved(progressRef.current, id);
    return level
      ? source.next(level, theme, solved, seen.current)
      : source.nextNear(currentRating(progressRef.current), theme, solved, seen.current);
  }, [source, level, theme]);
  const next = useCallback(() => show(request()), [show, request]);

  useEffect(() => {
    // El primero: el pedido por id (puzzle del día) o uno de práctica.
    show(byId.current ? source.byId(byId.current) : request());
    // Solo al montar y al reintentar: «Siguiente» llama a `next` directamente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  if (current.status === 'missing') return <Redirect href="/puzzles" />;
  if (current.status === 'loading') return <PuzzlesStatus state={{ status: 'loading' }} />;
  if (current.status === 'error') {
    const retry = () => {
      setCurrent({ status: 'loading' });
      setAttempt((n) => n + 1);
    };
    return <PuzzlesStatus state={{ status: 'error', offline: current.offline, retry }} />;
  }

  const label = practice
    ? [t('puzzles.practice'), level ? t(`puzzles.level.${level}`) : t('puzzles.mode.auto'), theme ? themeName(theme, t) : null].filter(Boolean).join(' · ')
    : t('puzzles.daily');

  return (
    // Fondo oscuro debajo del fundido de entrada de cada puzzle.
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <PuzzleScreen
        key={current.puzzle.id}
        puzzle={current.puzzle}
        label={label}
        onExit={() => router.back()}
        onNext={practice ? next : undefined}
      />
    </View>
  );
}
