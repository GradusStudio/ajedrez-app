import { Chess } from 'chess.js';

/** Una partida de progreso: cada lección hecha avanza una jugada del bando que estudia. */
export type ProgressGame = {
  /** Posición de partida. Si falta, la inicial. */
  startFen?: string;
  /** Jugadas en UCI: origen + destino, con la pieza al coronar ('e7e8q'). */
  moves: string[];
  /** Bando que estudia: sus jugadas cuentan para el progreso. */
  side: 'w' | 'b';
};

export type ProgressGamePosition = {
  fen: string;
  lastMove: { from: string; to: string } | null;
  /** Jugadas del bando que estudia incluidas (de 0 a total). */
  played: number;
  /** Jugadas del bando que estudia en toda la partida. */
  total: number;
  /** true si se muestra la posición final de la partida. */
  complete: boolean;
};

export type ProgressGamesFile = {
  version: number;
  units: Record<string, ProgressGame>;
};

/** Pieza en el formato de MiniBoard y Board: color + tipo ('wn', 'bk'...). */
export type FenPiece = `${'w' | 'b'}${'p' | 'n' | 'b' | 'r' | 'q' | 'k'}`;

/**
 * Posición del tablero con `lessonsDone` lecciones hechas: la que queda después de la
 * jugada número `lessonsDone` del bando que estudia, con las del rival que haya antes.
 * Si la unidad está completa, o la partida tiene menos jugadas que lecciones, se muestra
 * la posición final.
 */
export function progressPosition(
  game: ProgressGame,
  lessonsDone: number,
  lessonsTotal: number,
): ProgressGamePosition {
  const chess = new Chess(game.startFen);
  const unitComplete = lessonsDone >= lessonsTotal;
  const target = Math.max(0, lessonsDone);

  let studyMoves = 0;
  let studied = 0;
  let fen = chess.fen();
  let lastMove: { from: string; to: string } | null = null;
  let finalFen = fen;
  let finalLastMove: { from: string; to: string } | null = null;

  for (const uci of game.moves) {
    const turn = chess.turn();
    const move = chess.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci.slice(4) || undefined,
    });
    const isStudy = turn === game.side;
    if (isStudy) studyMoves++;
    if (!unitComplete && isStudy && studyMoves === target) {
      fen = chess.fen();
      lastMove = { from: move.from, to: move.to };
      studied = studyMoves;
    }
    finalFen = chess.fen();
    finalLastMove = { from: move.from, to: move.to };
  }

  if (unitComplete || target >= studyMoves) {
    fen = finalFen;
    lastMove = finalLastMove;
    studied = studyMoves;
  }

  return {
    fen,
    lastMove,
    played: studied,
    total: studyMoves,
    complete: studied === studyMoves,
  };
}

/** Piezas de una posición, listas para MiniBoard: casilla -> 'wn', 'bk'... */
export function piecesFromFen(fen: string): Record<string, FenPiece> {
  const pieces: Record<string, FenPiece> = {};
  for (const row of new Chess(fen).board()) {
    for (const piece of row) {
      if (piece) pieces[piece.square] = `${piece.color}${piece.type}`;
    }
  }
  return pieces;
}
