import { dayNumber, Level, LEVELS, pickAny, pickPending, Puzzle } from './puzzles';
import { PuzzleSource, PuzzlesUnavailable } from './source';

// Puzzles de la web: la base completa de Lichess partida en trozos de 1.000 (scripts/build-puzzles.js) que se piden
// de a uno. Lógica pura: la red y la caché llegan por `ChunkIO` (puzzleSource.web.ts). Probado en chunks.test.ts.
// Spec: docs/superpowers/specs/2026-11-08-puzzles-por-trozos-design.md.

/** Índice de los trozos (src/puzzles/manifest.json). `levels.<nivel>.<grupo>` = puzzles de cada capa [A, B, C]. */
export type Manifest = {
  version: string;
  base: string;
  chunkSize: number;
  total: number;
  daily: { from: number; to: number };
  themes: string[];
  levels: Record<string, Record<string, number[]>>;
};

/** Fila de un trozo: [id, fen, jugadas, rating, temas como posición en `manifest.themes`]. */
export type Row = [string, string, string, number, number[]];

export const decodeRow = ([id, fen, moves, rating, nums]: Row, themes: string[]): Puzzle => ({
  id,
  fen,
  moves: moves.split(' '),
  rating,
  themes: nums.map((i) => themes[i]).filter((t): t is string => !!t),
});

/** Grupo de un tema de Práctica; sin tema, `todos`. */
export const groupOf = (theme: string | null) => theme ?? 'todos';

export function groupCount(m: Manifest, level: Level, group: string): number {
  return (m.levels[level]?.[group] ?? []).reduce((a, b) => a + b, 0);
}

/** Números de trozo de cada capa de un grupo. Las capas van seguidas: primero los de A, después B y C. */
export function layerChunks(m: Manifest, level: Level, group: string): number[][] {
  let n = 0;
  return (m.levels[level]?.[group] ?? []).map((count) => {
    const chunks = Array.from({ length: Math.ceil(count / m.chunkSize) }, (_, i) => n + i);
    n += chunks.length;
    return chunks;
  });
}

export const chunkPath = (level: Level, group: string, n: number) => `${level}/${group}/${n}.json`;
export const yearPath = (year: number) => `dia/${year}.json`;

/** Año y posición del día dentro del archivo del año, con la fecha local (como dailyPuzzle). */
export function dailyIndex(now = new Date()): { year: number; index: number } {
  const year = now.getFullYear();
  return { year, index: dayNumber(now) - Date.UTC(year, 0, 1) / 86400000 };
}

/** Puzzle del día a partir del archivo del año (`v1/dia/<año>.json`). */
export function dailyFromYear(file: { year: number; puzzles: Row[] }, themes: string[], now = new Date()): Puzzle | undefined {
  const { year, index } = dailyIndex(now);
  const row = file.year === year ? file.puzzles[index] : undefined;
  return row ? decodeRow(row, themes) : undefined;
}

const PATH_RE = /^([a-z]+)\/([A-Za-z0-9]+)\/(\d+)\.json$/;

/**
 * Sin conexión, dónde buscar puzzles entre los trozos guardados: primero los del mismo nivel y grupo; después los de
 * `todos` del mismo nivel, filtrando por el tema (`filter`).
 */
export function offlineOrder(cached: string[], level: Level, group: string): { path: string; filter: string | null }[] {
  const same: string[] = [];
  const all: string[] = [];
  for (const path of cached) {
    const m = PATH_RE.exec(path);
    if (!m || m[1] !== level) continue;
    if (m[2] === group) same.push(path);
    else if (m[2] === 'todos') all.push(path);
  }
  return [...same.map((path) => ({ path, filter: null })), ...all.map((path) => ({ path, filter: group }))];
}

/** Acceso a la red y a la caché, con rutas relativas a `<base><versión>/`. */
export type ChunkIO = {
  /** Pide el archivo (en la web pasa por el service worker, que lo guarda). */
  fetchJson(path: string): Promise<unknown>;
  /** Rutas de los trozos que ya están guardados. */
  cachedPaths(): Promise<string[]>;
  /** Un archivo guardado, sin red; undefined si no está. */
  cachedJson(path: string): Promise<unknown | undefined>;
  online(): boolean;
};

/** Trozos que quedan en memoria (≈ 110 KB cada uno). */
const MAX_MEMORY = 12;
/** Intentos con trozos nuevos antes de aceptar un puzzle repetido. */
const ATTEMPTS = 3;
/** Con menos pendientes que esto en el trozo actual, se pide otro de antemano. */
const PREFETCH_BELOW = 10;

export function createChunkSource(m: Manifest, io: ChunkIO, random = Math.random): PuzzleSource {
  const memory = new Map<string, Puzzle[]>(); // ruta → puzzles; el orden de inserción hace de «menos usado»
  const inflight = new Map<string, Promise<Puzzle[]>>();
  const years = new Map<number, Promise<Puzzle[]>>();
  const exhausted = new Set<string>(); // trozos sin pendientes en esta sesión
  let prepared = false;

  const decodeList = (raw: unknown) => (raw as Row[]).map((r) => decodeRow(r, m.themes));
  const remember = (path: string, list: Puzzle[]) => {
    memory.delete(path);
    memory.set(path, list);
    while (memory.size > MAX_MEMORY) memory.delete(memory.keys().next().value!);
  };

  /** De la red; si falla, de la caché; si tampoco está, el error de la red. */
  async function getJson(path: string): Promise<unknown> {
    try {
      return await io.fetchJson(path);
    } catch (e) {
      const cached = await io.cachedJson(path).catch(() => undefined);
      if (cached === undefined) throw e;
      return cached;
    }
  }

  function loadChunk(path: string): Promise<Puzzle[]> {
    const hit = memory.get(path);
    if (hit) return Promise.resolve(hit);
    let p = inflight.get(path);
    if (!p) {
      p = getJson(path)
        .then((raw) => {
          const list = decodeList(raw);
          remember(path, list);
          return list;
        })
        .finally(() => inflight.delete(path));
      inflight.set(path, p);
    }
    return p;
  }

  function loadYear(year: number): Promise<Puzzle[]> {
    let p = years.get(year);
    if (!p) {
      if (year < m.daily.from || year > m.daily.to) return Promise.reject(new PuzzlesUnavailable(false));
      p = getJson(yearPath(year)).then((raw) => decodeList((raw as { puzzles: Row[] }).puzzles));
      years.set(year, p);
      p.catch(() => years.delete(year));
    }
    return p;
  }

  const pickFrom = <T>(list: T[]) => list[Math.floor(random() * list.length)];

  /** Un trozo que todavía no se probó, de la primera capa que tenga. */
  function freshPath(level: Level, group: string): string | undefined {
    for (const layer of layerChunks(m, level, group)) {
      const options = layer.map((n) => chunkPath(level, group, n)).filter((p) => !exhausted.has(p) && !memory.has(p) && !inflight.has(p));
      if (options.length) return pickFrom(options);
    }
    return undefined;
  }

  function prefetch(level: Level, group: string, list: Puzzle[], done: (id: string) => boolean, seen: ReadonlySet<string>, picked: string) {
    const left = list.filter((p) => p.id !== picked && !done(p.id) && !seen.has(p.id)).length;
    if (left >= PREFETCH_BELOW) return;
    const path = freshPath(level, group);
    if (path) loadChunk(path).catch(() => {});
  }

  async function offline(level: Level, group: string, done: (id: string) => boolean, seen: ReadonlySet<string>): Promise<Puzzle> {
    const order = offlineOrder(await io.cachedPaths().catch(() => []), level, group);
    let fallback: Puzzle[] = [];
    for (const { path, filter } of order) {
      let list = memory.get(path);
      if (!list) {
        const raw = await io.cachedJson(path).catch(() => undefined);
        if (raw === undefined) continue;
        list = decodeList(raw);
        remember(path, list);
      }
      if (filter) list = list.filter((p) => p.themes.includes(filter));
      const p = pickPending(list, done, seen, random);
      if (p) return p;
      if (!fallback.length) fallback = list;
    }
    const p = pickAny(fallback, seen, random);
    if (p) return p;
    throw new PuzzlesUnavailable(!io.online());
  }

  return {
    total: m.total,
    count: (level, theme) => groupCount(m, level, groupOf(theme)),

    async daily(now = new Date()) {
      const { year, index } = dailyIndex(now);
      try {
        const p = (await loadYear(year))[index];
        if (p) return p;
      } catch {}
      throw new PuzzlesUnavailable(!io.online());
    },

    async byId(id) {
      for (const list of memory.values()) {
        const p = list.find((x) => x.id === id);
        if (p) return p;
      }
      const year = new Date().getFullYear();
      // El año anterior y el siguiente, por si el enlace se abrió cerca de medianoche del 31 de diciembre.
      for (const y of [year, year - 1, year + 1]) {
        try {
          const p = (await loadYear(y)).find((x) => x.id === id);
          if (p) return p;
        } catch {}
      }
      return undefined;
    },

    async next(level, theme, done, seen) {
      const group = groupOf(theme);
      if (groupCount(m, level, group) === 0) return undefined;
      const prefix = `${level}/${group}/`;
      const pick = (list: Puzzle[]) => {
        const p = pickPending(list, done, seen, random);
        if (p) prefetch(level, group, list, done, seen, p.id);
        return p;
      };

      // 1. Los trozos que ya están en memoria.
      for (const [path, list] of [...memory]) {
        if (!path.startsWith(prefix) || exhausted.has(path)) continue;
        const p = pick(list);
        if (p) return p;
        exhausted.add(path);
      }
      // 2. Trozos nuevos, de la mejor capa con trozos sin probar.
      let last: Puzzle[] | undefined;
      try {
        for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
          const path = freshPath(level, group);
          if (!path) break;
          last = await loadChunk(path);
          const p = pick(last);
          if (p) return p;
          exhausted.add(path);
        }
        // 3. Sin pendientes a mano: uno repetido.
        let pool = last ?? [...memory].filter(([path]) => path.startsWith(prefix)).flatMap(([, list]) => list);
        if (!pool.length) {
          const all = layerChunks(m, level, group).flat();
          pool = await loadChunk(chunkPath(level, group, pickFrom(all)));
        }
        return pickAny(pool, seen, random);
      } catch {
        return offline(level, group, done, seen);
      }
    },

    prepareOffline() {
      if (prepared || !io.online()) return;
      prepared = true;
      const now = new Date();
      loadYear(now.getFullYear()).catch(() => {});
      if (now.getMonth() === 11) loadYear(now.getFullYear() + 1).catch(() => {});
      io.cachedPaths()
        .catch(() => [] as string[])
        .then((cached) => {
          for (const level of Object.keys(LEVELS) as Level[]) {
            if (cached.some((p) => p.startsWith(`${level}/todos/`))) continue;
            const first = layerChunks(m, level, 'todos').find((layer) => layer.length > 0);
            if (first) loadChunk(chunkPath(level, 'todos', pickFrom(first))).catch(() => {});
          }
        });
    },
  };
}
