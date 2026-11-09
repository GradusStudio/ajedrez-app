import { SyncConflict, SyncError, type SyncClient } from './syncEngine';

// Cliente del servidor de sincronización de Gradus (Worker `gradus-sync`, API en workers/sync/handler.ts).
// La llave del usuario viaja como Bearer; el servidor solo guarda su hash. `fetch` entra como parámetro para probarlo.

export const SYNC_URL = 'https://sync.graduschess.com';

type Deps = {
  fetch: typeof fetch;
  baseUrl: string;
  /** Llave de sincronización de este dispositivo; null si no hay (se trata como revocada). */
  getKey: () => string | null;
};

export function createServerClient({ fetch: doFetch, baseUrl, getKey }: Deps): SyncClient {
  async function call(init: RequestInit = {}): Promise<Response> {
    const key = getKey();
    if (!key) throw new SyncError('revoked');
    try {
      return await doFetch(`${baseUrl}/v1/progress`, {
        ...init,
        headers: { ...(init.headers as Record<string, string>), Authorization: `Bearer ${key}` },
      });
    } catch {
      // `fetch` solo rechaza cuando no hay red (o la bloquea el navegador).
      throw new SyncError('offline');
    }
  }

  return {
    async read() {
      const res = await call();
      if (res.status === 404) return null;
      if (res.status === 410) throw new SyncError('revoked');
      if (!res.ok) throw new SyncError('other', `Servidor respondió ${res.status}`);
      const body = (await res.json()) as { version: number; data: string };
      return { version: body.version, text: body.data };
    },

    async write(text, expected) {
      const res = await call({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: expected, data: text }),
      });
      if (res.status === 409) {
        const body = (await res.json()) as { version: number; data: string | null };
        throw new SyncConflict({ version: body.version, text: body.data ?? '' });
      }
      if (res.status === 410) throw new SyncError('revoked');
      if (res.status === 413) throw new SyncError('tooLarge');
      if (!res.ok) throw new SyncError('other', `Servidor respondió ${res.status}`);
      return ((await res.json()) as { version: number }).version;
    },
  };
}
