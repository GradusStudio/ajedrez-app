import { ChunkIO, createChunkSource, Manifest } from './chunks';
import manifestJson from './manifest.json';
import { PuzzleSource } from './source';

// En la web los puzzles salen de la base completa de Lichess, en trozos de 1.000 que se piden a
// puzzles.graduschess.com (Worker `gradus-puzzles`, ver docs/puzzles.md). El service worker los guarda en la caché
// `gradus-puzzles` (scripts/build-sw.js) para jugar sin conexión con lo ya bajado.

const manifest = manifestJson as unknown as Manifest;
/** Para probar en la PC: EXPO_PUBLIC_PUZZLES_URL=http://localhost:8789/ al compilar (ver docs/puzzles.md). */
const BASE = (process.env.EXPO_PUBLIC_PUZZLES_URL || manifest.base).replace(/\/?$/, '/') + manifest.version + '/';
const CACHE = 'gradus-puzzles';

const hasCaches = () => typeof caches !== 'undefined';

const io: ChunkIO = {
  async fetchJson(path) {
    const res = await fetch(BASE + path);
    if (!res.ok) throw new Error(`HTTP ${res.status} en ${path}`);
    return res.json();
  },
  async cachedPaths() {
    if (!hasCaches()) return [];
    const keys = await (await caches.open(CACHE)).keys();
    return keys.map((r) => r.url).filter((u) => u.startsWith(BASE)).map((u) => u.slice(BASE.length));
  },
  async cachedJson(path) {
    if (!hasCaches()) return undefined;
    const res = await (await caches.open(CACHE)).match(BASE + path);
    return res ? res.json() : undefined;
  },
  online: () => typeof navigator === 'undefined' || navigator.onLine !== false,
};

const source = createChunkSource(manifest, io);

export const getPuzzleSource = (): PuzzleSource | null => source;
export const loadPuzzleSource = (): Promise<PuzzleSource> => Promise.resolve(source);
