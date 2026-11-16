import { PIECE_PATHS, type PieceKey, type PiecePaths, type PathSetId } from './pieceSets';

/**
 * Trazados de las piezas. Los tres sets base viven en pieceSets.ts; Geométrico, Juguete, Madera,
 * Mármol y Magma se cargan aparte (import dinámico) para no engordar el trozo común de la web.
 * Mientras un set no llegó, se usa el Clásico.
 */
type Paths = Record<PieceKey, PiecePaths>;

const loaded = new Map<PathSetId, Paths>();
const pending = new Map<PathSetId, Promise<Paths>>();

const isBase = (set: PathSetId): set is keyof typeof PIECE_PATHS => set in PIECE_PATHS;

export function piecePaths(set: PathSetId, key: PieceKey): PiecePaths {
  const own = loaded.get(set);
  if (own) return own[key];
  return (isBase(set) ? PIECE_PATHS[set] : PIECE_PATHS.clasico)[key];
}

/** Carga (una vez) los trazados de un set; los base ya están y se resuelven al instante. */
export function loadPieceSet(set: PathSetId): Promise<Paths> {
  if (isBase(set)) return Promise.resolve(PIECE_PATHS[set]);
  const cached = loaded.get(set);
  if (cached) return Promise.resolve(cached);
  const running = pending.get(set);
  if (running) return running;
  const load = (async () => {
    let mod: { PATHS: Paths };
    switch (set) {
      case 'minimalista':
        mod = await import('./sets/minimalista');
        break;
      case 'redondeado':
        mod = await import('./sets/redondeado');
        break;
      case 'madera':
        mod = await import('./sets/madera');
        break;
      case 'marmol':
        mod = await import('./sets/marmol');
        break;
      case 'magma':
        mod = await import('./sets/magma');
        break;
      default:
        throw new Error(`set sin módulo: ${String(set)}`);
    }
    loaded.set(set, mod.PATHS);
    pending.delete(set);
    return mod.PATHS;
  })().catch((e) => {
    pending.delete(set);
    throw e;
  });
  pending.set(set, load);
  return load;
}
