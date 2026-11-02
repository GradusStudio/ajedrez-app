import { Chess } from 'chess.js';
import { Bot } from '../data/bots';
import { encodeMaia } from '../engine/maia/encode';
import { MaiaEngine, wdlToCentipawns } from '../engine/maia/maiaEngine';
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

/** Motores con los que piensa un bot: Maia (los bots "maia") y Stockfish. */
export type BotEngines = { maia?: MaiaEngine | null; stockfish?: UciEngine | null };

/**
 * Qué motores necesita un bot. Los bots Maia también usan Stockfish: para evaluar sus jugadas (las frases
 * y las tablas dependen de esa evaluación; la de la propia Maia es poco confiable) y, los fuertes, como seguro.
 */
export function enginesFor(bot: Bot): { maia: boolean; stockfish: boolean } {
  return { maia: bot.engine.type === 'maia', stockfish: true };
}

/** Profundidad de Stockfish para evaluar la jugada de un bot Maia (rápida: es solo para las frases). */
const EVAL_DEPTH = 8;

/** Un error de verdad pierde al menos esto frente a la mejor jugada (un peón). */
const MIN_BLUNDER_LOSS = 100;

/**
 * Bots "human-like" con Stockfish (los de antes de Maia, bots.md, 4.1):
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

/** Probabilidades de Maia (softmax de los logits). */
export function softmax(logits: number[], temperature = 1): number[] {
  const t = Math.max(temperature, 1e-6);
  const m = Math.max(...logits);
  const e = logits.map((l) => Math.exp((l - m) / t));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((x) => x / s);
}

/**
 * Orden en que un bot Maia considera las jugadas: sorteadas según la probabilidad de que una persona
 * de ese nivel las juegue (`temperature` 1 = tal cual; menos = más fiel a la favorita; más = más
 * dispersa, más errores; 0 = siempre la favorita). Las que casi nadie jugaría (menos de `minProb`,
 * con la temperatura 1) quedan afuera, salvo la favorita. Devuelve índices de `logits`.
 */
export function maiaOrder(
  logits: number[],
  params: { temperature: number; minProb?: number },
  random = Math.random
): number[] {
  const raw = softmax(logits);
  const best = raw.indexOf(Math.max(...raw));
  const keep = raw.map((p, i) => i === best || p >= (params.minProb ?? 0));
  if (params.temperature <= 0) {
    return raw
      .map((p, i) => [p, i] as const)
      .filter(([, i]) => keep[i])
      .sort((a, b) => b[0] - a[0])
      .map(([, i]) => i);
  }
  const p = softmax(logits, params.temperature).map((x, i) => (keep[i] ? x : 0));
  const order: number[] = [];
  const left = p.map((_, i) => i).filter((i) => p[i] > 0);
  while (left.length > 0) {
    let r = random() * left.reduce((a, i) => a + p[i], 0);
    let k = left.length - 1;
    for (let j = 0; j < left.length; j++) {
      r -= p[left[j]];
      if (r <= 0) {
        k = j;
        break;
      }
    }
    order.push(left.splice(k, 1)[0]);
  }
  return order;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const between = ([min, max]: [number, number]) => min + Math.random() * (max - min);

/**
 * Seguro de Stockfish para los bots fuertes: de las candidatas de Maia (en su orden), la primera que no
 * pierde más de `maxLoss` centipeones frente a la mejor. Si ninguna de las primeras `tries` sirve,
 * la mejor de Stockfish. Así juegan "como humanos" pero sin regalar piezas.
 */
/** Evaluación (centipeones, para el que juega `move`) de la posición después de `move`. */
async function moveScore(stockfish: UciEngine, fen: string, move: string, depth: number): Promise<number | undefined> {
  const after = new Chess(fen);
  after.move({ from: move.slice(0, 2), to: move.slice(2, 4), promotion: move[4] });
  if (after.isCheckmate()) return 10000;
  if (after.isGameOver()) return 0;
  const reply = await stockfish.search({ fen: after.fen(), multipv: 1, depth });
  return reply.lines.length > 0 ? -reply.lines[0].score : undefined;
}

async function safeChoice(
  stockfish: UciEngine,
  fen: string,
  candidates: string[],
  safety: { maxLoss: number; depth: number; tries?: number }
): Promise<{ move: string; score?: number }> {
  const { lines } = await stockfish.search({ fen, multipv: 5, depth: safety.depth });
  if (lines.length === 0) return { move: candidates[0] };
  const best = lines[0].score;
  for (const move of candidates.slice(0, safety.tries ?? 4)) {
    const score = lines.find((l) => l.move === move)?.score ?? (await moveScore(stockfish, fen, move, Math.max(1, safety.depth - 1)));
    if (score === undefined) continue;
    if (best - score <= safety.maxLoss) return { move, score };
  }
  return { move: lines[0].move, score: best };
}

export async function thinkMove(engines: BotEngines, bot: Bot, o: ThinkOptions): Promise<BotMove> {
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
  const e = bot.engine;
  const down = () => engines.stockfish?.failed || (e.type === 'maia' && engines.maia?.failed);
  try {
    if (e.type === 'maia') {
      const maia = engines.maia;
      if (!maia) throw new Error('sin Maia');
      const pos = encodeMaia(o.history);
      if (pos.legal.length === 0) throw new Error('sin jugadas');
      const { logits, wdl } = await maia.evaluate(pos.input);
      const order = maiaOrder(logits, e).map((i) => pos.legal[i]);
      const sf = engines.stockfish;
      const pick: { move: string; score?: number } =
        e.safety && sf ? await safeChoice(sf, o.fen, order, e.safety) : { move: order[0] };
      // Evaluación para las frases y las tablas: la de Stockfish (si no está, la de Maia antes de mover).
      const score = pick.score ?? (sf ? await moveScore(sf, o.fen, pick.move, EVAL_DEPTH) : undefined) ?? wdlToCentipawns(wdl);
      return finish({ uci: pick.move, score, fromBook: false });
    }
    const engine = engines.stockfish;
    if (!engine) throw new Error('sin Stockfish');
    if (e.type === 'human-like') {
      const { lines } = await engine.search({ fen: o.fen, multipv: e.multipv, depth: e.depth });
      if (lines.length === 0) throw new Error('sin jugadas');
      const pick = pickHumanLike(lines, e);
      return finish({ uci: pick.move, score: pick.score, fromBook: false });
    }
    // stockfish-elo: el propio Stockfish limita su fuerza.
    const { bestmove, lines } = await engine.search({
      fen: o.fen,
      multipv: 1,
      movetime: Math.round(thinkTime * 0.8),
      elo: e.uciElo,
    });
    if (!bestmove) throw new Error('sin jugadas');
    const chosen = lines.find((l) => l.move === bestmove) ?? lines[0];
    return finish({ uci: bestmove, score: chosen?.score, fromBook: false });
  } catch (err) {
    // Motor caído: la pantalla ofrece reintentar y entonces el bot vuelve a pensar esta jugada.
    if (down()) throw err;
    // Si solo falló esta respuesta, una jugada legal cualquiera: la partida no se traba.
    const moves = new Chess(o.fen).moves({ verbose: true });
    const m = moves[Math.floor(Math.random() * moves.length)];
    return finish({ uci: m.from + m.to + (m.promotion ?? ''), fromBook: false });
  }
}
