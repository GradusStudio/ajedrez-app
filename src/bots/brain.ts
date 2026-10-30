import { Chess } from 'chess.js';
import { Bot } from '../data/bots';
import { EngineLine, UciEngine } from '../engine/uci';
import { BOOK_PLIES, bookMove } from './book';

// Cómo elige su jugada un bot (bots.md, sección 3).

export type BotMove = {
  uci: string;
  /** Evaluación (centipeones, para el bot) de la jugada elegida. Sin dato si salió del libro. */
  score?: number;
  fromBook: boolean;
};

export type ThinkOptions = {
  fen: string;
  history: string[]; // jugadas UCI desde la posición inicial
  botColor: 'w' | 'b';
  /** Modo práctica: el libro es la línea de este curso, completa. */
  practiceCourseId?: string;
};

/** Un error de verdad pierde al menos esto frente a la mejor jugada (un peón). */
const MIN_BLUNDER_LOSS = 100;

/**
 * Elige como una persona de ese nivel (bots.md, 4.1):
 * - con probabilidad `blunderRate`, un error: una jugada que pierde entre 1 peón y `maxBlunder`;
 * - si no, al azar entre las candidatas, con más chance cuanto menos pierden. `temperature` (centipeones)
 *   regula cuánto le importa la diferencia: alta = juega "más o menos bien" sin ver los detalles.
 */
export function pickHumanLike(
  lines: EngineLine[],
  params: { temperature: number; blunderRate: number; maxBlunder: number },
  random = Math.random
): EngineLine {
  const best = lines[0];
  const loss = (l: EngineLine) => Math.max(0, best.score - l.score);
  if (random() < params.blunderRate) {
    const blunders = lines.filter((l) => loss(l) >= MIN_BLUNDER_LOSS && loss(l) <= params.maxBlunder);
    if (blunders.length > 0) return blunders[Math.floor(random() * blunders.length)];
  }
  const weights = lines.map((l) => Math.exp(-loss(l) / params.temperature));
  let r = random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lines.length; i++) {
    r -= weights[i];
    if (r <= 0) return lines[i];
  }
  return best;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const between = ([min, max]: [number, number]) => min + Math.random() * (max - min);

export async function thinkMove(engine: UciEngine, bot: Bot, o: ThinkOptions): Promise<BotMove> {
  const started = Date.now();
  const thinkTime = between(bot.engine.thinkMs);
  const finish = async (move: BotMove) => {
    await sleep(Math.max(0, thinkTime - (Date.now() - started))); // que "piense" un rato, como una persona
    return move;
  };

  // 1. Libro: las aperturas de su repertorio (o la del modo práctica).
  const courses = o.practiceCourseId
    ? [o.practiceCourseId]
    : bot.repertoire[o.botColor === 'w' ? 'white' : 'black'];
  const limit = o.practiceCourseId ? Infinity : BOOK_PLIES[bot.book];
  const book = bookMove(courses, o.history, limit);
  if (book) return finish({ uci: book, fromBook: true });

  // 2. Motor.
  try {
    if (bot.engine.type === 'human-like') {
      const { lines } = await engine.search({ fen: o.fen, multipv: bot.engine.multipv, depth: bot.engine.depth });
      if (lines.length === 0) throw new Error('sin jugadas');
      const pick = pickHumanLike(lines, bot.engine);
      return finish({ uci: pick.move, score: pick.score, fromBook: false });
    }
    // stockfish-elo: el propio Stockfish limita su fuerza.
    const { bestmove, lines } = await engine.search({
      fen: o.fen,
      multipv: 1,
      movetime: Math.round(thinkTime * 0.8),
      elo: bot.engine.uciElo,
    });
    if (!bestmove) throw new Error('sin jugadas');
    const chosen = lines.find((l) => l.move === bestmove) ?? lines[0];
    return finish({ uci: bestmove, score: chosen?.score, fromBook: false });
  } catch (e) {
    // Motor caído: la pantalla ofrece reintentar y entonces el bot vuelve a pensar esta jugada.
    if (engine.failed) throw e;
    // Si solo falló esta respuesta, una jugada legal cualquiera: la partida no se traba.
    const moves = new Chess(o.fen).moves({ verbose: true });
    const m = moves[Math.floor(Math.random() * moves.length)];
    return finish({ uci: m.from + m.to + (m.promotion ?? ''), fromBook: false });
  }
}
