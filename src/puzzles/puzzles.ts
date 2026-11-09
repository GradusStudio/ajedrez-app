import { Chess } from 'chess.js';
import themesRaw from './themes.json';
import { es, MessageKey } from '../i18n/es';

// Puzzles de la base abierta de Lichess (CC0), elegidos por scripts/build-puzzles.js. Ver docs/puzzles.md.

export type Puzzle = {
  id: string;
  /** Posición ANTES de la jugada del rival (formato de Lichess). */
  fen: string;
  /** Jugadas UCI: la primera es del rival; desde la segunda, la solución (alternando). */
  moves: string[];
  rating: number;
  themes: string[];
};

type Raw = [string, string, string, number, string];

type RawFile = { puzzles: Raw[] };

export const parsePuzzles = (raw: RawFile): Puzzle[] =>
  raw.puzzles.map(([id, fen, moves, rating, themes]) => ({ id, fen, moves: moves.split(' '), rating, themes: themes ? themes.split(' ') : [] }));

/**
 * Cargador memorizado: dos llamadas comparten la promesa y, si falla, se olvida para que la siguiente reintente.
 * `importer` se inyecta para poder probarlo sin el archivo real.
 */
export function createPuzzleLoader(importer: () => Promise<{ default: unknown }>): () => Promise<Puzzle[]> {
  let memo: Promise<Puzzle[]> | null = null;
  return () => {
    if (!memo) {
      const attempt = importer().then((m) => parsePuzzles(m.default as RawFile));
      memo = attempt;
      attempt.catch(() => {
        if (memo === attempt) memo = null;
      });
    }
    return memo;
  };
}

export const findPuzzle = (puzzles: Puzzle[], id: string) => puzzles.find((p) => p.id === id);

/** Función de traducción de useI18n().t. Se pasa por parámetro para que este módulo siga siendo puro. */
export type Translate = (key: MessageKey) => string;

const themeData = themesRaw as { practice: string[] };
/** Nombre del tema en el idioma de `translate`; un tema sin nombre se muestra con su clave. */
export const themeName = (t: string, translate: Translate) => {
  const key = `puzzleTheme.${t}`;
  return key in es ? translate(key as MessageKey) : t;
};
export const PRACTICE_THEMES = themeData.practice;

/** Niveles de la práctica (rating de Lichess). El nombre de cada uno es la clave `puzzles.level.<nivel>`. */
export const LEVELS = {
  facil: { min: 0, max: 1200 },
  medio: { min: 1200, max: 1800 },
  dificil: { min: 1800, max: 2500 },
  experto: { min: 2500, max: 4000 },
} as const;
export type Level = keyof typeof LEVELS;

/** Rango para mostrar debajo del nivel: «< 1200», «1200–1800», «2500+». */
export function levelRange(level: Level): string {
  const { min, max } = LEVELS[level];
  if (min === 0) return `< ${max}`;
  if (level === 'experto') return `${min}+`;
  return `${min}–${max}`;
}

/** Color que juega el usuario: el contrario al que mueve en la posición inicial (el rival mueve primero). */
export function userColor(p: Puzzle): 'w' | 'b' {
  return new Chess(p.fen).turn() === 'w' ? 'b' : 'w';
}

/** "Mate en 2" si el puzzle es de mate; si no, "Encuentra la mejor jugada". */
export function puzzleGoal(p: Puzzle, translate: Translate): string {
  const mate = p.themes.find((t) => /^mateIn\d$/.test(t));
  return mate ? themeName(mate, translate) : translate('puzzles.goal.best');
}

/** Temas para mostrar después de resolverlo (los tácticos y de mate, sin "corto", "ventaja", etc.). */
export function displayThemes(p: Puzzle, translate: Translate): string[] {
  const hide = new Set(['short', 'long', 'veryLong', 'oneMove', 'advantage', 'crushing', 'equality', 'mate', 'middlegame', 'opening']);
  return p.themes.filter((t) => !hide.has(t)).map((t) => themeName(t, translate));
}

/** Número de día (días desde 1970, hora local): cambia a medianoche. */
export function dayNumber(now = new Date()): number {
  return Math.floor((now.getTime() - now.getTimezoneOffset() * 60000) / 86400000);
}

/** Puzzle del día: uno de nivel medio (1000–1600), distinto cada día y el mismo para todos. */
export function dailyPuzzle(puzzles: Puzzle[], now = new Date()): Puzzle {
  const pool = puzzles.filter((p) => p.rating >= 1000 && p.rating < 1600);
  // Paso grande y "raro" para que días seguidos no den puzzles parecidos.
  const index = (dayNumber(now) * 7919) % pool.length;
  return pool[index];
}

/**
 * Siguiente puzzle de práctica: del nivel y tema pedidos, que todavía no se haya resuelto ni haya salido en esta
 * sesión (`seen`). Si ya no queda ninguno así, acepta uno repetido (de los que no salieron, si hay).
 */
export function nextPuzzle(
  puzzles: Puzzle[],
  level: Level,
  theme: string | null,
  done: (id: string) => boolean,
  seen: ReadonlySet<string> = new Set()
): Puzzle | undefined {
  const { min, max } = LEVELS[level];
  const pool = puzzles.filter((p) => p.rating >= min && p.rating < max && (!theme || p.themes.includes(theme)));
  return pickPending(pool, done, seen) ?? pickAny(pool, seen);
}

/** Uno al azar que no esté resuelto ni haya salido en esta sesión. */
export function pickPending(list: Puzzle[], done: (id: string) => boolean, seen: ReadonlySet<string>, random = Math.random): Puzzle | undefined {
  const pending = list.filter((p) => !done(p.id) && !seen.has(p.id));
  return pending.length > 0 ? pending[Math.floor(random() * pending.length)] : undefined;
}

/** Uno al azar, repetido si hace falta: primero de los que no salieron en esta sesión. */
export function pickAny(list: Puzzle[], seen: ReadonlySet<string>, random = Math.random): Puzzle | undefined {
  const fresh = list.filter((p) => !seen.has(p.id));
  const from = fresh.length > 0 ? fresh : list;
  return from.length > 0 ? from[Math.floor(random() * from.length)] : undefined;
}

/** Cuántos puzzles hay para un nivel y tema (para mostrar en Práctica). */
export function countPuzzles(puzzles: Puzzle[], level: Level, theme: string | null): number {
  const { min, max } = LEVELS[level];
  return puzzles.filter((p) => p.rating >= min && p.rating < max && (!theme || p.themes.includes(theme))).length;
}
