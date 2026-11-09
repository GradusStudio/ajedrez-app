import { SyncError } from './syncEngine';

// Cliente de la API REST de Google Drive para un archivo de Gradus (hoy, la llave de sincronización) en la carpeta oculta de la app
// (`appDataFolder`, permiso `drive.appdata`). No sabe de dónde viene el permiso: lo pide con `getToken`.
// Sin React ni navegador: `fetch` entra como parámetro, así que se prueba entero en `npm test`.

export const KEY_FILE_NAME = 'gradus-llave.json';

const FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';

/** Un archivo en Drive. `read` devuelve null si todavía no existe; `remove` sin archivo no hace nada. */
export type DriveFile = {
  read: () => Promise<string | null>;
  write: (text: string) => Promise<void>;
  remove: () => Promise<void>;
};

type Deps = {
  fetch: typeof fetch;
  /** Permiso vigente de Google; si no hay, lanza `SyncError('other')`. */
  getToken: () => Promise<string>;
  /** Nombre del archivo en la carpeta oculta (p. ej. `KEY_FILE_NAME`). */
  fileName: string;
};

/** Motivos de un error de la API de Google (`error.errors[].reason`), o [] si la respuesta no los trae. */
async function reasons(res: Response): Promise<string[]> {
  try {
    const data = (await res.json()) as { error?: { errors?: { reason?: string }[] } };
    return (data.error?.errors ?? []).map((e) => e.reason ?? '').filter(Boolean);
  } catch {
    return [];
  }
}

/** Traduce una respuesta que no fue buena al tipo de error que entiende el motor de sincronización. */
async function toError(res: Response): Promise<SyncError> {
  if (res.status === 401) return new SyncError('other', 'Google: el permiso venció o falta');
  if (res.status === 403) {
    const why = await reasons(res);
    if (why.includes('storageQuotaExceeded')) return new SyncError('other', 'Drive lleno');
    if (why.some((r) => r === 'rateLimitExceeded' || r === 'userRateLimitExceeded')) return new SyncError('other');
    return new SyncError('other', 'La cuenta de Google no permite guardar en Drive');
  }
  return new SyncError('other', `Drive respondió ${res.status}`);
}

export function createDriveRestClient({ fetch: doFetch, getToken, fileName }: Deps): DriveFile {
  // Id del archivo una vez encontrado o creado: evita buscarlo en cada sincronización.
  let fileId: string | null = null;

  async function call(url: string, init: RequestInit = {}): Promise<Response> {
    const token = await getToken();
    try {
      return await doFetch(url, { ...init, headers: { ...(init.headers as Record<string, string>), Authorization: `Bearer ${token}` } });
    } catch (e) {
      // `fetch` solo rechaza cuando no hay red (o la bloquea el navegador).
      if (e instanceof SyncError) throw e;
      throw new SyncError('offline');
    }
  }

  async function find(): Promise<string | null> {
    if (fileId) return fileId;
    const escaped = fileName.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    // El más antiguo: si dos dispositivos crearon el archivo a la vez, todos convergen en el mismo.
    const q = `name='${escaped}' and trashed=false`;
    const url = `${FILES_URL}?spaces=appDataFolder&q=${encodeURIComponent(q)}&fields=${encodeURIComponent('files(id)')}&orderBy=createdTime&pageSize=1`;
    const res = await call(url);
    if (!res.ok) throw await toError(res);
    const data = (await res.json()) as { files?: { id: string }[] };
    fileId = data.files?.[0]?.id ?? null;
    return fileId;
  }

  async function create(text: string): Promise<void> {
    const boundary = `gradus-${Math.random().toString(36).slice(2)}`;
    const meta = JSON.stringify({ name: fileName, parents: ['appDataFolder'], mimeType: 'application/json' });
    const body =
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n` +
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${text}\r\n--${boundary}--`;
    const res = await call(`${UPLOAD_URL}?uploadType=multipart&fields=id`, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body,
    });
    if (!res.ok) throw await toError(res);
    // No se recuerda el id recién creado: la próxima vez se busca y se elige el más antiguo.
    await res.body?.cancel?.().catch(() => {});
    fileId = null;
  }

  const api: DriveFile = {
    async read() {
      const id = await find();
      if (!id) return null;
      const res = await call(`${FILES_URL}/${id}?alt=media`);
      if (res.status === 404) {
        fileId = null;
        return null;
      }
      if (!res.ok) throw await toError(res);
      return res.text();
    },

    async write(text) {
      const id = await find();
      if (!id) return create(text);
      const res = await call(`${UPLOAD_URL}/${id}?uploadType=media`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: text,
      });
      if (res.status === 404) {
        // Lo borraron desde otro lado: se busca de nuevo y, si no está, se crea.
        fileId = null;
        const again = await find();
        if (again) return api.write(text);
        return create(text);
      }
      if (!res.ok) throw await toError(res);
    },

    async remove() {
      const id = await find();
      if (!id) return;
      const res = await call(`${FILES_URL}/${id}`, { method: 'DELETE' });
      fileId = null;
      // 404: ya no estaba, que es lo que se quería.
      if (!res.ok && res.status !== 404) throw await toError(res);
    },
  };
  return api;
}
