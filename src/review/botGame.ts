import { Chess } from 'chess.js';

export type BotGameKind = 'win' | 'loss' | 'draw';

/** Resultado del PGN (desde las blancas) de una partida que terminó con `kind` para quien jugó con `color`. */
export function pgnResult(color: 'w' | 'b', kind: BotGameKind): '1-0' | '0-1' | '1/2-1/2' {
  if (kind === 'draw') return '1/2-1/2';
  return (kind === 'win') === (color === 'w') ? '1-0' : '0-1';
}

/** PGN de la partida jugada contra un bot, listo para la revisión: nombres, resultado y jugadas UCI. */
export function botGamePgn({
  moves,
  userColor,
  userName,
  botName,
  kind,
}: {
  moves: string[];
  userColor: 'w' | 'b';
  userName: string;
  botName: string;
  kind: BotGameKind;
}): string {
  return pgnFromMoves(moves, { userColor, userName, botName, result: pgnResult(userColor, kind) });
}

/**
 * PGN común a las partidas recién jugadas y a las guardadas: cabeceras, resultado y jugadas UCI. Una jugada ilegal
 * (datos viejos o rotos) corta la partida sin lanzar.
 */
export function pgnFromMoves(
  moves: string[],
  {
    userColor,
    userName,
    botName,
    result,
    date,
  }: { userColor: 'w' | 'b'; userName: string; botName: string; result: '1-0' | '0-1' | '1/2-1/2'; date?: string }
): string {
  const chess = new Chess();
  if (date) {
    chess.setHeader('Event', 'Gradus');
    chess.setHeader('Site', 'Gradus');
    chess.setHeader('Date', date.slice(0, 10).replace(/-/g, '.'));
  }
  chess.setHeader('White', userColor === 'w' ? userName : botName);
  chess.setHeader('Black', userColor === 'b' ? userName : botName);
  chess.setHeader('Result', result);
  for (const uci of moves) {
    try {
      chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] ?? 'q' });
    } catch {
      break;
    }
  }
  return chess.pgn();
}
