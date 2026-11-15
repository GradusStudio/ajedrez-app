// Dibujos fijos de 3 × 3 para la grilla de temas de Puzzles (spec, sección «Practicar un tema»).
// Coordenadas: [fila, columna], de 0 a 2. Son decorativos: cada tema es un botón con su etiqueta.

export type DiagramPiece = { type: 'k' | 'q' | 'r' | 'b' | 'n' | 'p'; color: 'w' | 'b'; at: [number, number] };
export type DiagramArrow = { from: [number, number]; to: [number, number] };
export type ThemeDiagram = { pieces: DiagramPiece[]; arrows: DiagramArrow[] };

export const THEME_DIAGRAMS: Record<string, ThemeDiagram> = {
  todos: {
    pieces: [
      { type: 'n', color: 'w', at: [1, 1] },
      { type: 'q', color: 'b', at: [0, 2] },
      { type: 'k', color: 'b', at: [2, 2] },
    ],
    arrows: [
      { from: [1, 1], to: [0, 2] },
      { from: [1, 1], to: [2, 2] },
    ],
  },
  mateIn1: {
    pieces: [
      { type: 'q', color: 'w', at: [1, 1] },
      { type: 'k', color: 'b', at: [0, 2] },
    ],
    arrows: [{ from: [1, 1], to: [0, 2] }],
  },
  mateIn2: {
    pieces: [
      { type: 'r', color: 'w', at: [1, 0] },
      { type: 'q', color: 'w', at: [2, 1] },
      { type: 'k', color: 'b', at: [0, 1] },
    ],
    arrows: [{ from: [1, 0], to: [0, 1] }],
  },
  mateIn3: {
    pieces: [
      { type: 'b', color: 'w', at: [1, 1] },
      { type: 'q', color: 'w', at: [2, 2] },
      { type: 'k', color: 'b', at: [0, 1] },
    ],
    arrows: [{ from: [1, 1], to: [0, 1] }],
  },
  fork: {
    pieces: [
      { type: 'n', color: 'w', at: [1, 1] },
      { type: 'k', color: 'b', at: [0, 2] },
      { type: 'q', color: 'b', at: [2, 0] },
    ],
    arrows: [
      { from: [1, 1], to: [0, 2] },
      { from: [1, 1], to: [2, 0] },
    ],
  },
  pin: {
    pieces: [
      { type: 'b', color: 'w', at: [1, 0] },
      { type: 'r', color: 'b', at: [1, 1] },
      { type: 'k', color: 'b', at: [1, 2] },
    ],
    arrows: [{ from: [1, 0], to: [1, 2] }],
  },
  skewer: {
    pieces: [
      { type: 'r', color: 'w', at: [1, 0] },
      { type: 'q', color: 'b', at: [1, 1] },
      { type: 'k', color: 'b', at: [1, 2] },
    ],
    arrows: [{ from: [1, 0], to: [1, 2] }],
  },
  discoveredAttack: {
    pieces: [
      { type: 'b', color: 'w', at: [0, 1] },
      { type: 'r', color: 'w', at: [2, 0] },
      { type: 'k', color: 'b', at: [2, 2] },
    ],
    arrows: [{ from: [2, 0], to: [2, 2] }],
  },
  doubleCheck: {
    pieces: [
      { type: 'n', color: 'w', at: [0, 1] },
      { type: 'b', color: 'w', at: [2, 1] },
      { type: 'k', color: 'b', at: [1, 1] },
    ],
    arrows: [
      { from: [0, 1], to: [1, 1] },
      { from: [2, 1], to: [1, 1] },
    ],
  },
  hangingPiece: {
    pieces: [
      { type: 'b', color: 'w', at: [0, 0] },
      { type: 'n', color: 'b', at: [1, 1] },
      { type: 'k', color: 'b', at: [2, 2] },
    ],
    arrows: [{ from: [0, 0], to: [1, 1] }],
  },
  capturingDefender: {
    pieces: [
      { type: 'r', color: 'w', at: [0, 0] },
      { type: 'q', color: 'b', at: [0, 1] },
      { type: 'k', color: 'b', at: [0, 2] },
    ],
    arrows: [{ from: [0, 0], to: [0, 1] }],
  },
  deflection: {
    pieces: [
      { type: 'q', color: 'w', at: [1, 0] },
      { type: 'r', color: 'b', at: [1, 1] },
      { type: 'k', color: 'b', at: [2, 2] },
    ],
    arrows: [{ from: [1, 0], to: [1, 1] }],
  },
  attraction: {
    pieces: [
      { type: 'q', color: 'w', at: [1, 1] },
      { type: 'k', color: 'b', at: [0, 2] },
      { type: 'n', color: 'w', at: [2, 0] },
    ],
    arrows: [{ from: [1, 1], to: [0, 2] }],
  },
  backRankMate: {
    pieces: [
      { type: 'r', color: 'w', at: [2, 0] },
      { type: 'k', color: 'b', at: [0, 0] },
      { type: 'p', color: 'b', at: [0, 1] },
    ],
    arrows: [{ from: [2, 0], to: [0, 0] }],
  },
  sacrifice: {
    pieces: [
      { type: 'b', color: 'w', at: [1, 1] },
      { type: 'k', color: 'b', at: [0, 2] },
      { type: 'q', color: 'w', at: [2, 0] },
    ],
    arrows: [{ from: [1, 1], to: [0, 2] }],
  },
  endgame: {
    pieces: [
      { type: 'k', color: 'w', at: [1, 0] },
      { type: 'p', color: 'w', at: [1, 1] },
      { type: 'k', color: 'b', at: [2, 2] },
    ],
    arrows: [{ from: [1, 0], to: [1, 1] }],
  },
};
