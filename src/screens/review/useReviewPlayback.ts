import { useEffect, useState } from 'react';
import type { GameMove, ReviewPly } from '../../review/types';

export type Filter = 'all' | 'highlights';

/** Jugadas propias del usuario sobre una posición de la partida (`from` = jugada desde la que se desvió). */
export type Branch = { from: number; moves: { id: number; move: GameMove; rated: ReviewPly | null }[] };

const AUTOPLAY_MS = 1400;
const FAST_MS = 220; // cámara rápida hasta la próxima jugada destacada

export type Playback = ReturnType<typeof useReviewPlayback>;

/**
 * Dónde está la revisión (jugada actual, reproducción automática, cámara rápida, variante propia)
 * y cómo se mueve. `n` = jugadas de la partida; `highlights` = índices de las jugadas destacadas.
 */
export function useReviewPlayback(n: number, highlights: number[]) {
  const [idx, setIdx] = useState(0);
  const [filter, setFilter] = useState<Filter>('highlights');
  const [ffTarget, setFfTarget] = useState<number | null>(null);
  const [showBest, setShowBest] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [branch, setBranch] = useState<Branch | null>(null);

  const lastVar = branch ? branch.moves[branch.moves.length - 1] : null;

  const goTo = (i: number) => {
    setIdx(Math.max(0, Math.min(n, i)));
    setShowBest(false);
    setFfTarget(null);
    setBranch(null);
  };

  // La reproducción automática avanza sola hasta el final de la partida.
  const autoplaying = playing && idx < n;
  useEffect(() => {
    if (!autoplaying) return;
    const id = setInterval(() => {
      setIdx((i) => Math.min(n, i + 1));
      setShowBest(false);
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [autoplaying, n]);

  // Cámara rápida: «Siguiente» recorre las jugadas intermedias hasta la destacada.
  const fast = ffTarget !== null && idx < ffTarget;
  useEffect(() => {
    if (!fast || ffTarget === null) return;
    const id = setInterval(() => setIdx((i) => Math.min(ffTarget, i + 1)), FAST_MS);
    return () => clearInterval(id);
  }, [fast, ffTarget]);

  const togglePlay = () => {
    setFfTarget(null);
    setBranch(null);
    if (autoplaying) return setPlaying(false);
    if (idx >= n) goTo(0);
    setPlaying(true);
  };

  /** Botón principal. `onFinish` se llama al tocarlo estando en la última jugada («Finalizar»). */
  const next = (onFinish: () => void) => {
    if (branch) {
      // Vuelve a la posición de la partida desde la que se probó otra jugada.
      setBranch(null);
      setShowBest(false);
      return;
    }
    if (fast && ffTarget !== null) return goTo(ffTarget); // tocar durante la cámara rápida salta al destino
    if (idx >= n) return onFinish();
    if (filter === 'all') return goTo(idx + 1);
    const nextHl = highlights.find((h) => h + 1 > idx);
    const target = nextHl === undefined ? n : nextHl + 1;
    if (target - idx > 1) {
      setShowBest(false);
      setPlaying(false);
      setFfTarget(target);
    } else goTo(target);
  };

  const stepBack = () => {
    if (!branch) return goTo(idx - 1);
    setShowBest(false);
    setBranch((b) => (b && b.moves.length > 1 ? { ...b, moves: b.moves.slice(0, -1) } : null));
  };
  const stepForward = () => {
    if (!branch) goTo(idx + 1);
  };

  const jumpHighlight = (dir: 1 | -1) => {
    const hs = highlights.map((h) => h + 1);
    const target = dir === 1 ? hs.find((h) => h > idx) : [...hs].reverse().find((h) => h < idx);
    if (target !== undefined) goTo(target);
  };

  return {
    idx, filter, setFilter, showBest, setShowBest, branch, setBranch, lastVar,
    setPlaying, setFfTarget, autoplaying, fast,
    goTo, togglePlay, next, stepBack, stepForward, jumpHighlight,
  };
}
