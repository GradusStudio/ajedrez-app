import { Chess } from 'chess.js';
import type { GameRecord } from '../progress/progressStore';

// Las partidas contra bots se guardan en el progreso con las jugadas en UCI. Para revisarlas hace falta un PGN:
// se arma acá, con cabeceras y resultado. Módulo puro y probado.

/** Resultado de la partida desde el punto de vista del usuario, en la cabecera PGN. */
export function botGameResult(record: GameRecord): '1-0' | '0-1' | '1/2-1/2' {
  if (record.result === 'draw') return '1/2-1/2';
  const userWon = record.result === 'win';
  const userIsWhite = record.userColor === 'w';
  return userWon === userIsWhite ? '1-0' : '0-1';
}

/**
 * PGN de una partida contra un bot: `userName` es como se muestra el usuario en las cabeceras («Tú»), para que la
 * revisión sepa de qué bando juega. Las jugadas ilegales (datos viejos o rotos) cortan la partida sin lanzar.
 */
export function botGamePgn(record: GameRecord, botName: string, userName: string): string {
  const chess = new Chess();
  const date = record.playedAt.slice(0, 10).replace(/-/g, '.');
  chess.setHeader('Event', 'Gradus');
  chess.setHeader('Site', 'Gradus');
  chess.setHeader('Date', date);
  chess.setHeader('White', record.userColor === 'w' ? userName : botName);
  chess.setHeader('Black', record.userColor === 'w' ? botName : userName);
  chess.setHeader('Result', botGameResult(record));
  for (const uci of record.moves) {
    try {
      chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] ?? 'q' });
    } catch {
      break;
    }
  }
  return chess.pgn();
}

/** Id estable de la revisión de una partida de bot (el `playedAt` no se repite). */
export const botGameReviewId = (record: GameRecord) => `bot:${record.playedAt}`;
