// Tipos de la revisión de partidas. Sin React Native: lo usan las pruebas con tsx.

export type MoveQuality = 'book' | 'best' | 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';

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
};

/** Hechos verificados con el tablero (no inventados): de ellos salen las frases del comentarista. */
export type Facts = {
  /** Lo que hace la jugada jugada. */
  did?: { kind: 'mate' } | { kind: 'check' } | { kind: 'capture'; piece: PieceKind } | { kind: 'castle' };
  /** Lo que le permite al rival (solo en imprecisiones, errores y errores graves). */
  allows?: { kind: 'mate'; san: string } | { kind: 'capture'; piece: PieceKind; san: string; ofMoved: boolean } | { kind: 'check'; san: string };
  /** Lo que se dejó pasar. */
  missed?: { kind: 'mate' } | { kind: 'capture'; piece: PieceKind };
};

export type ReviewPly = {
  /** 1 = primera jugada de la partida. */
  ply: number;
  move: GameMove;
  quality: MoveQuality;
  /** Puntos de probabilidad de ganar que se perdieron con la jugada (0–100). */
  loss: number;
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
