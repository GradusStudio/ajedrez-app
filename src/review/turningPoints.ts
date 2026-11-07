import { positionKey } from './book';
import type { Review, ReviewPly } from './types';

// Quiz de puntos de giro: las peores jugadas del usuario en una partida revisada, para volver a
// jugarlas como puzzles. Solo lee la revisión ya hecha; no analiza nada. Sin React Native.

export const MAX_TURNING_POINTS = 3;

export type TurningPoint = {
  /** Jugada de la partida (1 = la primera). */
  ply: number;
  /** Posición antes de la jugada mala: la que se le muestra al usuario. */
  fen: string;
  /** Lo que jugó el usuario en la partida (notación inglesa). */
  playedSan: string;
  quality: 'mistake' | 'blunder';
  /** La única respuesta que vale (UCI, con la pieza si corona). */
  bestUci: string;
  bestSan: string;
};

const isTurningPoint = (p: ReviewPly, me: 'w' | 'b') =>
  p.move.color === me && (p.quality === 'mistake' || p.quality === 'blunder') && p.bestUci.length >= 4 && p.bestUci !== p.move.uci;

/** Hasta `max` errores y errores graves de `me`, los que más costaron, en el orden de la partida. */
export function turningPoints(review: Review, me: 'w' | 'b', max = MAX_TURNING_POINTS): TurningPoint[] {
  return review.plies
    .filter((p) => isTurningPoint(p, me))
    .sort((a, b) => b.loss - a.loss || a.ply - b.ply)
    .slice(0, max)
    .sort((a, b) => a.ply - b.ply)
    .map((p) => ({
      ply: p.ply,
      fen: p.move.fenBefore,
      playedSan: p.move.san,
      quality: p.quality as 'mistake' | 'blunder',
      bestUci: p.bestUci,
      bestSan: p.bestSan,
    }));
}

/** Acierto solo con la mejor jugada; si corona, también tiene que coincidir la pieza. */
export const isQuizAnswer = (tp: TurningPoint, uci: string) =>
  tp.bestUci.length > 4 ? uci === tp.bestUci : uci.slice(0, 4) === tp.bestUci;

/** Lo que la revisión le pasa a la pantalla del quiz (como `session.ts` con la partida). */
export type PendingQuiz = { points: TurningPoint[]; me: 'w' | 'b'; coachId: string };

let pendingQuiz: PendingQuiz | null = null;
export const setPendingQuiz = (q: PendingQuiz) => {
  pendingQuiz = q;
};
export const peekPendingQuiz = () => pendingQuiz;

/** Clave para pagar las monedas una sola vez por posición (aunque se importe la misma partida otra vez). */
export const turningPointKey = (tp: TurningPoint) => `${positionKey(tp.fen)}|${tp.bestUci}`;
