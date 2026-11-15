import { useEffect, useState } from 'react';
import { nextAction, type Branch, type PlaybackFilter, type Preview } from './playbackMachine';

/** Jugadas propias del usuario sobre una posición de la partida (`from` = jugada desde la que se desvió). */
export type { Branch, Preview } from './playbackMachine';

const AUTOPLAY_MS = 1400;
const FAST_MS = 220; // cámara rápida hasta la próxima jugada destacada
const LINE_MS = 1100; // una jugada de la línea del motor cada tanto

export type Playback = ReturnType<typeof useReviewPlayback>;

/**
 * Dónde está la revisión (jugada actual, reproducción automática, cámara rápida, variante propia)
 * y cómo se mueve. `n` = jugadas de la partida; `highlights` = índices de las jugadas destacadas.
 */
export function useReviewPlayback(n: number, highlights: number[]) {
  const [idx, setIdx] = useState(0);
  const [filter, setFilter] = useState<PlaybackFilter>('highlights');
  const [ffTarget, setFfTarget] = useState<number | null>(null);
  const [showBest, setShowBest] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);

  const lastVar = branch ? branch.moves[branch.moves.length - 1] : null;

  const goTo = (i: number) => {
    // Un índice no finito (por ejemplo un toque sin coordenada) no puede llegar al render.
    const target = Number.isFinite(i) ? i : 0;
    setIdx(Math.max(0, Math.min(n, Math.round(target))));
    setPlaying(false);
    setShowBest(false);
    setFfTarget(null);
    setBranch(null);
    setPreview(null);
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

  // La línea del motor avanza sola hasta su última jugada y se queda ahí hasta que se la detenga.
  const previewing = preview !== null && preview.step < preview.moves.length;
  useEffect(() => {
    if (!previewing) return;
    const id = setInterval(() => setPreview((p) => (p && p.step < p.moves.length ? { ...p, step: p.step + 1 } : p)), LINE_MS);
    return () => clearInterval(id);
  }, [previewing]);
  const startPreview = (baseFen: string, moves: Preview['moves']) => {
    setPlaying(false);
    setFfTarget(null);
    setBranch(null);
    setShowBest(false);
    setPreview({ baseFen, moves, step: 0 });
  };
  const stopPreview = () => setPreview(null);

  const togglePlay = () => {
    setFfTarget(null);
    setBranch(null);
    setPreview(null);
    if (autoplaying) return setPlaying(false);
    if (idx >= n) goTo(0);
    setPlaying(true);
  };

  /** Botón principal. `onFinish` se llama al tocarlo estando en la última jugada («Finalizar»). */
  const nextState = () => ({
    preview: !!preview,
    branch: !!branch,
    ffTarget,
    idx,
    n,
    filter,
    nextHighlight: highlights.find((h) => h + 1 > idx),
  });
  const nextLabel = nextAction(nextState()).label;
  const next = (onFinish: () => void) => {
    const action = nextAction(nextState());
    switch (action.type) {
      case 'stopPreview':
        return setPreview(null);
      case 'leaveBranch':
        setBranch(null);
        setShowBest(false);
        return;
      case 'finish':
        return onFinish();
      case 'goTo':
        return goTo(action.target);
      case 'fastForward':
        setShowBest(false);
        setPlaying(false);
        setFfTarget(action.target);
        return;
    }
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
    setPlaying, setFfTarget, autoplaying, fast, preview, startPreview, stopPreview,
    goTo, togglePlay, next, nextLabel, stepBack, stepForward, jumpHighlight,
  };
}
