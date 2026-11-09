import type { DriveFile } from './driveRest';

// La llave de sincronización: 32 bytes al azar en base64url (43 caracteres). Vive en la carpeta oculta de
// Drive del usuario; quien la tiene puede leer y escribir el progreso en el servidor, así que no se muestra.
// Sin Buffer ni React: corre igual en el navegador y en `npm test`.

const KEY_RE = /^[A-Za-z0-9_-]{43}$/;

const defaultRandom = (bytes: Uint8Array): Uint8Array => {
  crypto.getRandomValues(bytes as Uint8Array<ArrayBuffer>);
  return bytes;
};

export function newSyncKey(random: (bytes: Uint8Array) => Uint8Array = defaultRandom): string {
  const bytes = random(new Uint8Array(32));
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function isSyncKey(s: unknown): s is string {
  return typeof s === 'string' && KEY_RE.test(s);
}

export function keyToFile(key: string): string {
  return JSON.stringify({ gradus: 'llave', v: 1, key });
}

/** La llave guardada en el archivo, o null si el texto no es de Gradus o está dañado. */
export function keyFromFile(text: string): string | null {
  try {
    const data = JSON.parse(text) as { gradus?: unknown; key?: unknown };
    if (data?.gradus !== 'llave') return null;
    return isSyncKey(data.key) ? data.key : null;
  } catch {
    return null;
  }
}

/**
 * La llave de Drive si es válida; si no hay archivo o está dañado, crea una, la guarda y la devuelve.
 * Si dos dispositivos crean el archivo a la vez, el cliente de Drive siempre elige el más antiguo, así que
 * la relectura tras escribir converge en la misma llave. Un dispositivo que ya devolvió la suya en ese mismo
 * instante podría quedar con otra hasta volver a activarse.
 */
export async function fetchOrCreateKey(file: DriveFile, make: () => string = () => newSyncKey()): Promise<string> {
  const text = await file.read();
  const existing = text === null ? null : keyFromFile(text);
  if (existing) return existing;
  const key = make();
  await file.write(keyToFile(key));
  try {
    const after = await file.read();
    return (after === null ? null : keyFromFile(after)) ?? key;
  } catch {
    return key;
  }
}
