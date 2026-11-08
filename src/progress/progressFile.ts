import { hasUsableStructure } from './structure';
import { migrate, PROGRESS_VERSION, type Progress, type StoredProgress } from './progressStore';

// Archivo de copia del progreso: lo que el usuario guarda y vuelve a cargar a mano (Ajustes > Datos).

export type ProgressFileError = 'notJson' | 'notGradus' | 'tooNew';
export type ProgressFileResult = { ok: true; progress: Progress } | { ok: false; error: ProgressFileError };

/** Id fijo con el que se migra un archivo de las versiones 1 a 3: importarlo dos veces no suma dos veces. */
const LEGACY_DEVICE_ID = 'legacy';

export function progressToFile(p: Progress, now: Date): string {
  return JSON.stringify({ app: 'gradus', kind: 'progress', exportedAt: now.toISOString(), progress: p });
}

const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
/** Tope del texto de un archivo: la copia de un progreso real pesa unos cientos de KB; más allá no es de la app. */
const MAX_FILE_CHARS = 5_000_000;

export function parseProgressFile(text: string): ProgressFileResult {
  if (text.length > MAX_FILE_CHARS) return { ok: false, error: 'notGradus' };
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
  if (v > PROGRESS_VERSION) return { ok: false, error: 'tooNew' };
  if (!hasUsableStructure(p)) return { ok: false, error: 'notGradus' };
  return { ok: true, progress: migrate(p as unknown as StoredProgress, LEGACY_DEVICE_ID) };
}
