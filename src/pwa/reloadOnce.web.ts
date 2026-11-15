// Recarga de la web cuando un trozo de código no carga (ver chunkError.ts).
import { CHUNK_RELOAD_WINDOW_MS } from './chunkError';

// La marca guarda la hora de la última recarga, no un «sí»: así un trozo roto no recarga sin fin.
const KEY = 'gradus:recarga-por-trozo';

/** Hora de la última recarga automática por trozo, o null si no hubo. */
export function readChunkReloadMark(): number | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const at = Number(raw);
    return Number.isFinite(at) ? at : null;
  } catch {
    return null;
  }
}

/**
 * Recarga la página para tomar la versión publicada. Devuelve true si recargó. No recarga si ya lo hizo hace menos
 * de `CHUNK_RELOAD_WINDOW_MS`: el aviso de error queda en pantalla con «Recargar la app».
 */
export function reloadOnceForChunk(now = Date.now()): boolean {
  try {
    const last = readChunkReloadMark();
    if (last !== null && now - last < CHUNK_RELOAD_WINDOW_MS) return false;
    sessionStorage.setItem(KEY, String(now));
    window.location.reload();
    return true;
  } catch {
    return false;
  }
}

/** El botón «Recargar la app» del aviso de error: recarga sin condiciones. */
export function reloadPage(): void {
  window.location.reload();
}
