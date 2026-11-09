import { autoTarget, countPuzzles, dailyPuzzle, findPuzzle, Level, levelOf, LEVELS, nextPuzzle, pickAny, pickNear, pickPending, Puzzle } from './puzzles';

/**
 * De dónde salen los puzzles. En el celular, de la lista de 50.000 que trae la app (`listSource`); en la web, de la
 * base completa de Lichess por trozos (`createChunkSource`, chunks.ts). Las pantallas solo usan esta interfaz.
 */
export type PuzzleSource = {
  /** Cuántos puzzles hay en total. */
  total: number;
  /** Cuántos hay para un nivel y tema (sin conexión: sale del índice o de la lista). */
  count(level: Level, theme: string | null): number;
  /** Puzzle del día: el mismo para todos y en las dos plataformas. */
  daily(now?: Date): Promise<Puzzle>;
  /** Un puzzle por id (el del día o uno que ya se bajó); undefined si no se encuentra. */
  byId(id: string): Promise<Puzzle | undefined>;
  /** Siguiente de práctica: pendiente y que no haya salido en esta sesión (`seen`); si no queda, uno repetido. */
  next(level: Level, theme: string | null, done: (id: string) => boolean, seen: ReadonlySet<string>): Promise<Puzzle | undefined>;
  /** Práctica automática: uno pendiente cerca de `rating` (el nivel de puzzles); si no hay, el más parecido posible. */
  nextNear(rating: number, theme: string | null, done: (id: string) => boolean, seen: ReadonlySet<string>): Promise<Puzzle | undefined>;
  /** Baja en segundo plano lo necesario para jugar sin conexión (solo en la web). */
  prepareOffline(): void;
};

/** No se pudo conseguir un puzzle; `offline` si fue por falta de conexión (cambia el texto del aviso). */
export class PuzzlesUnavailable extends Error {
  constructor(readonly offline: boolean) {
    super(offline ? 'Sin conexión y sin puzzles guardados' : 'No se pudieron cargar los puzzles');
  }
}

/** Niveles que tienen puzzles (en el celular no hay de Experto: la lista llega a 2500). */
export const levelsWithPuzzles = (source: PuzzleSource): Level[] => (Object.keys(LEVELS) as Level[]).filter((l) => source.count(l, null) > 0);

/** Fuente sobre una lista completa en memoria (los 50.000 de la app nativa). */
export function listSource(puzzles: Puzzle[]): PuzzleSource {
  const counts = new Map<string, number>();
  return {
    total: puzzles.length,
    count(level, theme) {
      const key = `${level}/${theme ?? ''}`;
      if (!counts.has(key)) counts.set(key, countPuzzles(puzzles, level, theme));
      return counts.get(key)!;
    },
    daily: async (now) => dailyPuzzle(puzzles, now),
    byId: async (id) => findPuzzle(puzzles, id),
    next: async (level, theme, done, seen) => nextPuzzle(puzzles, level, theme, done, seen),
    async nextNear(rating, theme, done, seen) {
      // Todos los niveles: en el celular no hay Experto y un nivel de 2600 tiene que dar puzzles de Difícil.
      const pool = theme ? puzzles.filter((p) => p.themes.includes(theme)) : puzzles;
      const target = autoTarget(rating);
      const near = pickNear(pool, target, done, seen);
      if (near) return near;
      // Sin pendientes cerca: el nivel de dificultad más cercano al objetivo que tenga puzzles del tema (como la web).
      const all = Object.keys(LEVELS) as Level[];
      const i = all.indexOf(levelOf(target));
      for (const level of [...all].sort((a, b) => Math.abs(all.indexOf(a) - i) - Math.abs(all.indexOf(b) - i))) {
        const inLevel = pool.filter((p) => p.rating >= LEVELS[level].min && p.rating < LEVELS[level].max);
        if (inLevel.length) return pickPending(inLevel, done, seen) ?? pickAny(inLevel, seen);
      }
      return undefined;
    },
    prepareOffline() {},
  };
}
