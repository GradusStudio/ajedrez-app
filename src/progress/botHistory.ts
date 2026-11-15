import type { GameRecord } from './progressStore';

// Historial contra un bot para la capa del resultado (tarea 37, spec «resultado de partida»). Solo partidas
// reales (la práctica de aperturas no cuenta) y solo con 2 o más: con una sola no hay historial que mostrar.

export type BotHistory = {
  wins: number;
  losses: number;
  draws: number;
  total: number;
  /** Últimas 4 partidas con ese bot, la más reciente primero. */
  last4: ('win' | 'loss' | 'draw')[];
};

/** Historial contra `botId`, o null si hay menos de 2 partidas. */
export function botHistory(games: GameRecord[], botId: string): BotHistory | null {
  const list = games.filter((g) => g.botId === botId && !g.practiceCourseId);
  if (list.length < 2) return null;
  return {
    wins: list.filter((g) => g.result === 'win').length,
    losses: list.filter((g) => g.result === 'loss').length,
    draws: list.filter((g) => g.result === 'draw').length,
    total: list.length,
    last4: list.slice(0, 4).map((g) => g.result),
  };
}

/** Nota corta debajo del marcador: cómo vienen las últimas partidas. */
export type HistoryNote =
  | { kind: 'wonLast'; wins: number; total: number }
  | { kind: 'draws'; draws: number }
  | { kind: 'review' };

export function historyNote(history: BotHistory): HistoryNote {
  const wins = history.last4.filter((r) => r === 'win').length;
  if (wins >= 3) return { kind: 'wonLast', wins, total: history.last4.length };
  if (history.draws > 0 && history.wins === 0) return { kind: 'draws', draws: history.draws };
  return { kind: 'review' };
}
