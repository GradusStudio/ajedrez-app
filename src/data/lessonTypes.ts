// Tipos para unidad-1-lo-basico.json y aperturas-v1.json.
// Copiar a src/data/lessonTypes.ts

export type Square = string; // 'e4'
export type Uci = string; // 'e2e4' (origen + destino); al coronar puede llevar la pieza: 'e7e8n'

type StepBase = {
  id: string; // 'u1-l02-s03' o 'london-l02-s01'
  fen: string; // posición del tablero en este paso
  orientation?: 'w' | 'b'; // lado que se ve abajo (por defecto 'w')
  highlight?: Square[]; // casillas a resaltar (explicaciones y quiz)
};

/** Texto + tablero. No pide nada al usuario. */
export type ExplainStep = StepBase & {
  type: 'explain';
  text: string;
  /** Si existe, el tablero muestra los destinos legales de la pieza en esa casilla. */
  showMovesFrom?: Square;
  /** Flechas a dibujar, como pares origen+destino: ['c4f7']. */
  arrows?: Uci[];
  /** Jugadas que se reproducen solas sobre el tablero, una tras otra (con animación). */
  play?: Uci[];
};

/** El usuario debe hacer una jugada. Es correcta si coincide con alguna de `solutions`. */
export type MoveStep = StepBase & {
  type: 'move';
  prompt: string;
  solutions: Uci[];
  hint: string; // se muestra tras un error
  success: string; // se muestra al acertar
};

/** El usuario debe tocar todas las casillas indicadas. */
export type SelectSquaresStep = StepBase & {
  type: 'select_squares';
  prompt: string;
  squares: Square[];
  hint: string;
};

/** Pregunta de opción única. */
export type QuizStep = StepBase & {
  type: 'quiz';
  prompt: string;
  options: string[];
  answer: number; // índice en `options`
  explanation: string; // se muestra tras responder, sea correcto o no
  /** Mensaje opcional al elegir cada opción incorrecta (mismo índice que `options`). */
  feedback?: string[];
};

export type LineMove = {
  uci: Uci;
  san: string; // notación en español: 'Cf3', 'Axf7+', 'O-O'
  note?: string; // solo en modo 'guided'; se muestra al jugarse esta jugada
};

/**
 * Línea de apertura desde la posición inicial.
 * El usuario juega las jugadas de su color (`side`); la app juega las del rival automáticamente.
 * Las jugadas del usuario son las de índice par si side = 'w', impar si side = 'b'.
 */
export type LineStep = StepBase & {
  type: 'line';
  prompt: string;
  side: 'w' | 'b';
  mode: 'guided' | 'drill'; // guided: muestra notas y ayuda; drill: sin ayudas
  moves: LineMove[];
  /** Mensaje al completar (combinaciones tácticas). Si falta, "Completaste la línea". */
  success?: string;
  /** Pista tras un error (combinaciones tácticas). Si falta, el mensaje de las aperturas. */
  hint?: string;
};

/**
 * Práctica contra Stockfish (finales): el usuario juega libre y el motor defiende con todo.
 * Vale cualquier jugada que mantenga el resultado; solo es error la que lo deja escapar
 * (ahogar, perder material, dejar de ganar o, si el objetivo es tablas, pasar a perder).
 */
export type PracticeStep = StepBase & {
  type: 'practice';
  prompt: string;
  side: 'w' | 'b';
  /** mate: dar mate. promote: coronar sin perder la pieza nueva. draw: no perder durante `maxMoves` jugadas. */
  goal: 'mate' | 'promote' | 'draw';
  /** mate/promote: jugadas propias disponibles para lograrlo. draw: jugadas que hay que aguantar. */
  maxMoves: number;
  success: string;
  hint: string; // tras una jugada que deja escapar el resultado
};

export type Step = ExplainStep | MoveStep | SelectSquaresStep | QuizStep | LineStep | PracticeStep;

export type Lesson = {
  id: string;
  unit?: number; // solo en las unidades de conceptos
  order: number;
  title: string;
  summary: string;
  xp: number; // monedas que da la primera vez que se termina (el nombre viene de cuando era XP)
  steps: Step[];
};

export type Unit = {
  unit: number;
  title: string;
  lessons: Lesson[];
};

export type OpeningCourse = {
  id: string; // 'london'
  name: string; // 'Sistema Londres'
  color: 'w' | 'b'; // el color con el que se juega
  summary: string;
  botStyles: string[]; // personalidades de bot que la usan
  lessons: Lesson[];
};

export type OpeningsFile = {
  version: number;
  openings: OpeningCourse[];
};
