// Lógica pura del servidor de sincronización: solo APIs web (Request, Response, crypto.subtle), así corre igual en el
// Worker y en las pruebas. El servidor guarda el SHA-256 de la llave (nunca la llave), el texto del progreso, la versión
// y la fecha. Sin correo, nombre ni token.

export type StoredProgress = { version: number; data: string | null; deleted: boolean };

export type ProgressStore = {
  get(id: string): Promise<StoredProgress | null>;
  put(id: string, expected: number, data: string, now: string): Promise<'ok' | 'conflict' | 'deleted'>;
  remove(id: string, now: string): Promise<void>;
};

import { isProgressFile } from './progressMarker';

/** Límite de creaciones por IP (binding de Workers Rate Limiting, opcional: no existe en pruebas ni en `wrangler dev` sin él). */
export type CreateLimiter = { limit(options: { key: string }): Promise<{ success: boolean }> };

const KEY_FORMAT = /^[A-Za-z0-9_-]{43}$/;
const MAX_DATA_BYTES = 512 * 1024;
// Tope del cuerpo entero (el JSON escapa comillas y suma las claves): se mira el Content-Length antes de leer nada.
const MAX_BODY_BYTES = 2 * MAX_DATA_BYTES;
const ALLOWED_ORIGINS = ['https://graduschess.com', 'http://localhost:8081', 'http://localhost:8788'];

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin');
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (origin && ALLOWED_ORIGINS.includes(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function handle(
  req: Request,
  store: ProgressStore,
  now: () => Date = () => new Date(),
  limiter?: CreateLimiter
): Promise<Response> {
  const cors = corsHeaders(req);
  const reply = (status: number, body?: unknown) =>
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: body === undefined ? cors : { ...cors, 'Content-Type': 'application/json' },
    });

  if (req.method === 'OPTIONS') return reply(204);
  if (new URL(req.url).pathname !== '/v1/progress') return reply(404);

  const match = /^Bearer (.+)$/.exec(req.headers.get('Authorization') ?? '');
  if (!match || !KEY_FORMAT.test(match[1])) return reply(400, { error: 'llave inválida' });
  const id = await sha256Hex(match[1]);

  // Un fallo del almacén responde 500 con las cabeceras CORS: sin ellas el navegador lo mostraría como un fallo opaco de red.
  try {
    return await route(req, store, id, now, reply, limiter);
  } catch {
    return reply(500, { error: 'error del servidor' });
  }
}

async function route(
  req: Request,
  store: ProgressStore,
  id: string,
  now: () => Date,
  reply: (status: number, body?: unknown) => Response,
  limiter?: CreateLimiter
): Promise<Response> {
  if (req.method === 'GET') {
    const row = await store.get(id);
    if (!row) return reply(404);
    if (row.deleted) return reply(410);
    return reply(200, { version: row.version, data: row.data });
  }

  if (req.method === 'PUT') {
    // Sin leer el cuerpo si ya anuncia de más. Los cuerpos sin Content-Length (chunked) o con uno falso se frenan al medir `data`.
    const declared = Number(req.headers.get('Content-Length'));
    if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return reply(413);
    let body: { version?: unknown; data?: unknown };
    try {
      body = await req.json();
    } catch {
      return reply(400, { error: 'cuerpo inválido' });
    }
    const { version, data } = body ?? {};
    if (typeof version !== 'number' || !Number.isInteger(version) || version < 0 || typeof data !== 'string') {
      return reply(400, { error: 'cuerpo inválido' });
    }
    if (new TextEncoder().encode(data).length > MAX_DATA_BYTES) return reply(413);
    // Solo se guardan archivos de progreso de Gradus: sin esto la base se llenaría con texto cualquiera.
    if (!isProgressFile(data)) return reply(400, { error: 'no es un progreso de Gradus' });
    // Crear filas nuevas es lo que llena la base: se limita por IP. Actualizar una fila existente no cuenta.
    if (version === 0 && limiter) {
      const { success } = await limiter.limit({ key: req.headers.get('CF-Connecting-IP') ?? 'unknown' });
      if (!success) return reply(429, { error: 'demasiadas altas, prueba más tarde' });
    }
    const result = await store.put(id, version, data, now().toISOString());
    if (result === 'ok') return reply(200, { version: version + 1 });
    if (result === 'deleted') return reply(410);
    const current = await store.get(id);
    if (current?.deleted) return reply(410);
    return reply(409, { version: current?.version ?? 0, data: current?.data ?? null });
  }

  if (req.method === 'DELETE') {
    await store.remove(id, now().toISOString());
    return reply(204);
  }

  return reply(404);
}
