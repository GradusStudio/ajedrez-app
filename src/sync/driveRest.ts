import { DriveError, type DriveClient } from './syncEngine';

// Cliente de la API REST de Google Drive para el archivo único de Gradus en la carpeta oculta de la app
// (`appDataFolder`, permiso `drive.appdata`). No sabe de dónde viene el permiso: lo pide con `getToken`.
// Sin React ni navegador: `fetch` entra como parámetro, así que se prueba entero en `npm test`.

export const DRIVE_FILE_NAME = 'gradus-progreso.json';

const FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';

type Deps = {
  fetch: typeof fetch;
  /** Permiso vigente de Google; si no hay, lanza `DriveError('auth')`. */
  getToken: () => Promise<string>;
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
async function toError(res: Response): Promise<DriveError> {
  if (res.status === 401) return new DriveError('auth');
  if (res.status === 403) {
    const why = await reasons(res);
    if (why.includes('storageQuotaExceeded')) return new DriveError('quota');
    if (why.some((r) => r === 'rateLimitExceeded' || r === 'userRateLimitExceeded')) return new DriveError('other');
    return new DriveError('forbidden');
  }
  return new DriveError('other', `Drive respondió ${res.status}`);
}

export function createDriveRestClient({ fetch: doFetch, getToken }: Deps): DriveClient {
  // Id del archivo una vez encontrado o creado: evita buscarlo en cada sincronización.
  let fileId: string | null = null;

  async function call(url: string, init: RequestInit = {}): Promise<Response> {
    const token = await getToken();
    try {
      return await doFetch(url, { ...init, headers: { ...(init.headers as Record<string, string>), Authorization: `Bearer ${token}` } });
    } catch (e) {
      // `fetch` solo rechaza cuando no hay red (o la bloquea el navegador).
      if (e instanceof DriveError) throw e;
      throw new DriveError('offline');
    }
  }

  async function find(): Promise<string | null> {
    if (fileId) return fileId;
    const q = `name='${DRIVE_FILE_NAME}' and trashed=false`;
    const url = `${FILES_URL}?spaces=appDataFolder&q=${encodeURIComponent(q)}&fields=${encodeURIComponent('files(id)')}&pageSize=1`;
    const res = await call(url);
    if (!res.ok) throw await toError(res);
    const data = (await res.json()) as { files?: { id: string }[] };
    fileId = data.files?.[0]?.id ?? null;
    return fileId;
  }

  async function create(text: string): Promise<void> {
    const boundary = `gradus-${Math.random().toString(36).slice(2)}`;
    const meta = JSON.stringify({ name: DRIVE_FILE_NAME, parents: ['appDataFolder'], mimeType: 'application/json' });
    const body =
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n` +
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${text}\r\n--${boundary}--`;
    const res = await call(`${UPLOAD_URL}?uploadType=multipart&fields=id`, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body,
    });
    if (!res.ok) throw await toError(res);
    fileId = ((await res.json()) as { id?: string }).id ?? null;
  }

  const api: DriveClient = {
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
  };
  return api;
}
