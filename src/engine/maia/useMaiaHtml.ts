import { useEffect, useState } from 'react';
import { buildMaiaHtml } from './maiaHtml';
import { loadNetBase64, MaiaNetId } from './nets';

// La página lleva la red adentro (~1,8 MB): se arma una vez por red.
const cache = new Map<MaiaNetId, string>();

/** La página de Maia para esa red, o null mientras se carga la red. Si falla, avisa con onError. */
export function useMaiaHtml(net: MaiaNetId, onError: (message: string) => void): string | null {
  const [, setBuilt] = useState(0);

  useEffect(() => {
    if (cache.has(net)) return;
    let alive = true;
    loadNetBase64(net).then(
      (b64) => {
        cache.set(net, buildMaiaHtml(b64));
        if (alive) setBuilt((n) => n + 1);
      },
      (e) => {
        if (alive) onError(`no se pudo cargar la red: ${e instanceof Error ? e.message : String(e)}`);
      }
    );
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [net]);

  return cache.get(net) ?? null;
}
