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
  const chess = new Chess();
  for (const m of moves) chess.move({ from: m.slice(0, 2), to: m.slice(2, 4), promotion: m[4] });
  chess.setHeader('White', userColor === 'w' ? userName : botName);
  chess.setHeader('Black', userColor === 'b' ? userName : botName);
  chess.setHeader('Result', pgnResult(userColor, kind));
  return chess.pgn();
}
