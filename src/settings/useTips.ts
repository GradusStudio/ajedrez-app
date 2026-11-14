import { useCallback, useState } from 'react';
import { useSettings } from './SettingsContext';
import { markTipSeen, pendingTips, TipId } from './tips';

/**
 * Cola de consejos de una pantalla. Los ajustes ya están cargados cuando se monta la app, así que la
 * cola se arma una vez. Si la cola queda vacía y hay consejos sin ver (por ejemplo, después de
 * «Volver a ver los consejos» en Ajustes), el actual sale de los pendientes.
 */
export function useTips(ids: readonly TipId[]) {
  const { settings, update } = useSettings();
  const [queue, setQueue] = useState<TipId[]>(() => pendingTips(settings.seenTips, ids));
  const [initialTotal] = useState(() => queue.length);
  const pending = pendingTips(settings.seenTips, ids);
  const current = queue[0] ?? pending[0];
  const total = queue.length > 0 ? initialTotal : pending.length;
  const step = queue.length > 0 ? initialTotal - queue.length + 1 : 1;

  const next = useCallback(() => {
    if (!current) return;
    update({ seenTips: markTipSeen(settings.seenTips, current) });
    setQueue((q) => q.slice(1));
  }, [current, settings.seenTips, update]);

  const close = useCallback(() => {
    const toMark = queue.length > 0 ? queue : pending;
    if (toMark.length === 0) return;
    let seen = settings.seenTips;
    for (const id of toMark) seen = markTipSeen(seen, id);
    update({ seenTips: seen });
    setQueue([]);
  }, [queue, pending, settings.seenTips, update]);

  return { current, step, total, next, close };
}
