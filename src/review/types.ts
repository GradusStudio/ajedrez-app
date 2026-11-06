// Tipos de la revisión de partidas. Sin React Native: lo usan las pruebas con tsx.
import type { Plan } from './plans';
import type { LineFacts } from './lines';
import type { Tactic, Threat } from './tactics';

export type MoveQuality = 'book' | 'best' | 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';

/** Jugada que pierde ventaja: imprecisión, error o error grave. */
export const isBad = (q: MoveQuality): q is 'inaccuracy' | 'mistake' | 'blunder' => q === 'inaccuracy' || q === 'mistake' || q === 'blunder';

export type PieceKind = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

/** Una jugada de la partida, ya reproducida con chess.js. */
export type GameMove = {
  san: string; // notación inglesa (Nf3), como la da chess.js
  uci: string; // e2e4, e7e8q
  color: 'w' | 'b';
  fenBefore: string;
  fenAfter: string;
};

export type ParsedGame = {
  white: string;
  black: string;
  result: string; // 1-0, 0-1, 1/2-1/2, *
  startFen: string;
  moves: GameMove[];
};

/** Lo que el motor dice de una posición. `score` va en centipeones desde las blancas (mate: ±(10000 − n)). */
export type PositionEval = {
  score: number;
  /** Mejor jugada del bando que mueve (UCI). Vacía si la partida terminó. */
  best: string;
  /** Variante principal del motor (UCI), como mucho 8 jugadas. */
  pv?: string[];
};

/** Hechos verificados con el tablero (no inventados): de ellos salen las frases del comentarista. */
export type Facts = {
  /** Lo que hace la jugada jugada. */
  did?: { kind: 'mate' } | { kind: 'check' } | { kind: 'capture'; piece: PieceKind } | { kind: 'castle' };
  /** Lo que le permite al rival (solo en imprecisiones, errores y errores graves). */
  allows?: { kind: 'mate'; san: string } | { kind: 'capture'; piece: PieceKind; san: string; ofMoved: boolean } | { kind: 'check'; san: string };
  /** Lo que se dejó pasar. */
  missed?: { kind: 'mate' } | { kind: 'capture'; piece: PieceKind };
  /** Amenaza que crea la jugada (pieza movida que ataca algo valioso). No se guarda si ya hay una táctica. */
  threat?: Threat;
  /** Tácticas que creó la jugada (máximo 2). */
  found?: Tactic[];
  /** Por qué era mejor la jugada recomendada (solo en jugadas malas): la táctica, la amenaza o el plan que tenía. */
  bestWhy?: { found?: Tactic[]; threat?: Threat; plan?: Plan };
  /** Táctica que crea la mejor respuesta del rival (solo en imprecisiones, errores y errores graves). */
  allowsTactic?: { tactic: Tactic; san: string };
  /** Línea del motor DESPUÉS de la jugada. Mueve primero el rival de quien jugó: `material` positivo es ganancia de quien mueve ahora (en un error del rival, del usuario; en un error propio, del rival). Solo en jugadas malas y si es informativa. */
  line?: LineFacts;
  /** Línea del motor ANTES de la jugada. Mueve primero quien jugó: `material` positivo es lo que pudo ganar. Mismas condiciones que `line`. */
  missedLine?: LineFacts;
  /** Mate en `n` jugadas; `mover` es true si lo da quien jugó. */
  mateIn?: { n: number; mover: boolean };
  /** Para qué sirve la jugada; solo si no hay `did` ni `found`. */
  plan?: Plan;
};

export type ReviewPly = {
  /** 1 = primera jugada de la partida. */
  ply: number;
  move: GameMove;
  quality: MoveQuality;
  /** Puntos de probabilidad de ganar que se perdieron con la jugada (0–100). */
  loss: number;
  /** Ventaja perdida con la jugada en centipeones, desde quien jugó (≥ 0). Con mates de por medio es enorme: no se muestra. */
  cpLoss: number;
  /** Jugada que aprovecha un error grave del rival. */
  great: boolean;
  /** Entra en «Lo más destacado». */
  highlight: boolean;
  /** Evaluación (blancas) de la posición después de la jugada. */
  scoreAfter: number;
  bestUci: string;
  bestSan: string;
  replyUci: string;
  replySan: string;
  facts: Facts;
};

export type Review = {
  game: ParsedGame;
  /** Evaluación (blancas) de cada posición: índice 0 = inicial, índice n = tras la jugada n. */
  scores: number[];
  plies: ReviewPly[];
  /** Posiciones (índices de `plies`) destacadas, en orden. */
  highlights: number[];
  accuracy: { w: number; b: number };
};
