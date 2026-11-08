import { hasUsableStructure } from './structure';
import { mergeProgress, sameProgress } from './merge';
import { migrate, PROGRESS_VERSION, type Progress, type StoredProgress } from './progressStore';

// Dos pestañas o ventanas de la web (por ejemplo, la app instalada y una pestaña del navegador) comparten el
// mismo progreso guardado. Cuando otra guarda, esta lo combina con lo suyo en vez de pisarlo después
// (useCrossTabSync.web.ts). Función pura, aparte para poder probarla.

/**
 * Lo que esta pestaña tiene que guardar después de ver el progreso que guardó otra (`raw`, el texto de la clave),
 * o null si no hay nada que hacer: la clave se borró, el texto no es un progreso válido o combinar no cambia nada
 * (así una pestaña no le contesta a la otra con lo mismo y el ida y vuelta se corta).
 *
 * `deviceId`: las pestañas son la misma instalación y tienen que escribir con el mismo id. Si en la otra se borró
 * el progreso más tarde (ese borrado gana entero y trae un id nuevo, ver `withReset`), se adopta su id; si no,
 * queda el de esta pestaña, que es el mismo que leyeron las dos al abrir.
 */
export function absorbOtherTab(current: Progress, raw: string | null): Progress | null {
  if (raw === null) return null;
  let merged: Progress;
  let incoming: Progress;
  try {
    const data = JSON.parse(raw) as StoredProgress | null;
    const v = data?.version;
    if (!data || typeof v !== 'number' || !Number.isInteger(v) || v < 1 || v > PROGRESS_VERSION) return null;
    if (!hasUsableStructure(data as unknown as Record<string, unknown>)) return null;
    incoming = migrate(data, current.deviceId);
    merged = mergeProgress(current, incoming);
  } catch {
    return null;
  }
  if (merged.resetAt !== current.resetAt) merged = { ...merged, deviceId: incoming.deviceId };
  return sameProgress(merged, current) ? null : merged;
}
