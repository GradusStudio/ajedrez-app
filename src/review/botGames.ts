import type { GameRecord } from '../progress/progressStore';
import { pgnFromMoves, pgnResult } from './botGame';

// Las partidas contra bots se guardan en el progreso con las jugadas en UCI. Para revisarlas hace falta un PGN:
// se arma con el mismo constructor que usa la partida recién jugada. Módulo puro y probado.

/** Resultado de la partida desde el punto de vista del usuario, en la cabecera PGN. */
export function botGameResult(record: GameRecord): '1-0' | '0-1' | '1/2-1/2' {
  return pgnResult(record.userColor, record.result);
}

/**
 * PGN de una partida guardada contra un bot: `userName` es como se muestra el usuario en las cabeceras («Tú»), para
 * que la revisión sepa de qué bando juega. Las jugadas ilegales cortan la partida sin lanzar.
 */
export function botGamePgn(record: GameRecord, botName: string, userName: string): string {
  return pgnFromMoves(record.moves, {
    userColor: record.userColor,
    userName,
    botName,
    result: botGameResult(record),
    date: record.playedAt,
  });
}

/** Id estable de la revisión de una partida de bot (el `playedAt` no se repite). */
export const botGameReviewId = (record: GameRecord) => `bot:${record.playedAt}`;
