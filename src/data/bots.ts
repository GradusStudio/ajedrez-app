import botsRaw from './bots.json';

// Tipos de bots.json (copia de docs/bots.json). Ver docs/bots.md.

export type BotStyle = 'tranquilo' | 'equilibrado' | 'agresivo' | 'posicional';

export type BotEngine =
  | {
      type: 'human-like';
      depth: number;
      multipv: number;
      /** Centipeones: cuánto le importa la diferencia entre jugadas (alta = más impreciso). */
      temperature: number;
      /** Probabilidad de cometer un error de verdad en cada jugada. */
      blunderRate: number;
      /** Lo máximo que puede perder un error (centipeones): 300 ≈ una pieza menor, 900 ≈ la dama. */
      maxBlunder: number;
      thinkMs: [number, number];
      bias?: string;
    }
  | { type: 'stockfish-elo'; uciElo: number; multipv: number; thinkMs: [number, number]; bias?: string };

export type Bot = {
  id: string;
  name: string;
  tagline: string;
  elo: number;
  style: BotStyle;
  trait: string;
  teaches: string;
  engine: BotEngine;
  repertoire: { white: string[]; black: string[] };
  book: 'corto' | 'medio' | 'largo';
  lines: { greeting: string; onGoodMove: string; onBlunder: string; onWin: string; onLose: string };
};

export const bots = (botsRaw as unknown as { bots: Bot[] }).bots;

export function findBot(id: string): Bot | undefined {
  return bots.find((b) => b.id === id);
}

/** Bot para practicar una apertura: el de menor nivel que la juega; si ninguno la juega, Don Ramiro. */
export function botForOpening(courseId: string): Bot {
  const users = bots.filter((b) => b.repertoire.white.includes(courseId) || b.repertoire.black.includes(courseId));
  return users.sort((a, b) => a.elo - b.elo)[0] ?? findBot('ramiro') ?? bots[0];
}
