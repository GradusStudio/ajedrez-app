import { migrate, type Progress, type StoredProgress } from './progressStore';

// Archivo de copia del progreso: lo que el usuario guarda y vuelve a cargar a mano (Ajustes > Datos).

export type ProgressFileError = 'notJson' | 'notGradus' | 'tooNew';
export type ProgressFileResult = { ok: true; progress: Progress } | { ok: false; error: ProgressFileError };

/** Versión del progreso que esta app entiende (Progress.version). */
const CURRENT_VERSION = 4;
/** Id fijo con el que se migra un archivo de las versiones 1 a 3: importarlo dos veces no suma dos veces. */
const LEGACY_DEVICE_ID = 'legacy';

export function progressToFile(p: Progress, now: Date): string {
  return JSON.stringify({ app: 'gradus', kind: 'progress', exportedAt: now.toISOString(), progress: p });
}

const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const isCount = (x: unknown) => typeof x === 'number' && Number.isFinite(x) && x >= 0;

/** Un archivo se puede editar a mano o llegar dañado: solo se acepta una estructura que el resto de la app pueda usar. */
function hasUsableStructure(p: Record<string, unknown>): boolean {
  for (const k of ['lessons', 'puzzles', 'drafts']) {
    if (k in p && !isObject(p[k])) return false;
  }
  for (const k of ['mistakes', 'games', 'pieceSets', 'boardThemes', 'turningPoints']) {
    if (k in p && !Array.isArray(p[k])) return false;
  }
  if ('coinLedger' in p) {
    if (!isObject(p.coinLedger)) return false;
    for (const c of Object.values(p.coinLedger)) {
      if (!isObject(c) || !isCount(c.earned) || !isCount(c.spent)) return false;
    }
  }
  const s = p.streak;
  return isObject(s) && typeof s.current === 'number' && Number.isFinite(s.current) && typeof s.best === 'number' && Number.isFinite(s.best);
}

export function parseProgressFile(text: string): ProgressFileResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'notJson' };
  }
  if (!isObject(data) || data.app !== 'gradus' || data.kind !== 'progress' || !isObject(data.progress)) {
    return { ok: false, error: 'notGradus' };
  }
  const p = data.progress;
  const v = p.version;
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 1) return { ok: false, error: 'notGradus' };
  if (v > CURRENT_VERSION) return { ok: false, error: 'tooNew' };
  if (!hasUsableStructure(p)) return { ok: false, error: 'notGradus' };
  return { ok: true, progress: migrate(p as unknown as StoredProgress, LEGACY_DEVICE_ID) };
}
