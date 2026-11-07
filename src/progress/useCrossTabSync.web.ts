import { useEffect, type RefObject } from 'react';
import { absorbOtherTab } from './crossTab';
import { PROGRESS_KEY, type Progress } from './progressStore';

/**
 * Dos pestañas o ventanas (la app instalada y el navegador, por ejemplo) guardan en el mismo localStorage.
 * Cuando otra guarda el progreso, esta lo combina con lo suyo (crossTab.ts) y guarda el resultado; si no cambia
 * nada, no guarda, y así el ida y vuelta entre pestañas se corta. Al volver a la pestaña se relee una vez, por si
 * se perdió un aviso. Se activa recién con el progreso cargado.
 */
export function useCrossTabSync(enabled: boolean, current: RefObject<Progress>, commit: (next: Progress) => void): void {
  useEffect(() => {
    if (!enabled) return;
    const absorb = (raw: string | null) => {
      const next = absorbOtherTab(current.current, raw);
      if (next) commit(next);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === PROGRESS_KEY) absorb(e.newValue);
    };
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      let raw: string | null;
      try {
        raw = window.localStorage.getItem(PROGRESS_KEY);
      } catch {
        return;
      }
      absorb(raw);
    };
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [enabled, current, commit]);
}
