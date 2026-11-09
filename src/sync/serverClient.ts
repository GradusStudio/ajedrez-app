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

/**
 * Lee el cuerpo JSON de una respuesta. Un cuerpo que no es JSON (portal cautivo, proxy) es `other`; un fallo al leerlo
 * (corte de red a mitad de la respuesta) es `offline`.
 */
async function readJson(res: Response): Promise<Record<string, unknown>> {
  let body: unknown;
  try {
    body = await res.json();
  } catch (e) {
    throw e instanceof SyntaxError ? new SyncError('other', 'Respuesta que no es JSON') : new SyncError('offline');
  }
  if (typeof body !== 'object' || body === null) throw new SyncError('other', 'Respuesta inesperada');
  return body as Record<string, unknown>;
}

const isVersion = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;

/** El cliente de sincronización más el borrado de todo lo guardado con la llave (lo usa Ajustes > Borrar mis datos). */
export type ServerClient = SyncClient & { deleteProgress: () => Promise<void> };

export function createServerClient({ fetch: doFetch, baseUrl, getKey }: Deps): ServerClient {
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
    /** Borra el progreso del servidor. 204 es lo normal; 410 (ya borrado) deja todo como se quería. */
    async deleteProgress() {
      const res = await call({ method: 'DELETE' });
      if (res.status === 410) return;
      if (!res.ok) throw new SyncError('other', `Servidor respondió ${res.status}`);
    },

    async read() {
      const res = await call();
      if (res.status === 404) return null;
      if (res.status === 410) throw new SyncError('revoked');
      if (!res.ok) throw new SyncError('other', `Servidor respondió ${res.status}`);
      const body = await readJson(res);
      if (!isVersion(body.version) || typeof body.data !== 'string') throw new SyncError('other', 'Respuesta inesperada');
      return { version: body.version, text: body.data };
    },

    async write(text, expected) {
      const res = await call({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: expected, data: text }),
      });
      if (res.status === 409) {
        const body = await readJson(res);
        if (!isVersion(body.version) || (body.data !== null && typeof body.data !== 'string')) {
          throw new SyncError('other', 'Respuesta inesperada');
        }
        throw new SyncConflict({ version: body.version, text: body.data ?? '' });
      }
      if (res.status === 410) throw new SyncError('revoked');
      if (res.status === 413) throw new SyncError('tooLarge');
      if (!res.ok) throw new SyncError('other', `Servidor respondió ${res.status}`);
      const body = await readJson(res);
      if (!isVersion(body.version)) throw new SyncError('other', 'Respuesta inesperada');
      return body.version;
    },
  };
}
