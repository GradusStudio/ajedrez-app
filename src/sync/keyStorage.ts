import { isSyncKey } from './syncKey';

// La llave de sincronización vive en el almacenamiento del navegador de cada dispositivo (se recupera desde Drive al activar).
// Todo con try/catch: sin almacenamiento (modo privado, bloqueado) la sincronización sigue esta sesión pero no se recuerda.

export const KEY_STORAGE = 'gradus:syncKey';
/** Bandera de la versión anterior (permiso de Drive por una hora): ya no sirve, se borra al leer. */
export const OLD_FLAG_KEY = 'gradus:driveSync';

/** La llave guardada si es válida; si no hay o el texto no es una llave, null. */
export function readKey(storage: Pick<Storage, 'getItem'> & Partial<Pick<Storage, 'removeItem'>>): string | null {
  try {
    if (storage.getItem(OLD_FLAG_KEY) !== null) storage.removeItem?.(OLD_FLAG_KEY);
  } catch {
    // Sin almacenamiento: no hay nada que limpiar.
  }
  try {
    const value = storage.getItem(KEY_STORAGE);
    return isSyncKey(value) ? value : null;
  } catch {
    return null;
  }
}

/** Guarda la llave; con null la borra. */
export function writeKey(storage: Pick<Storage, 'setItem' | 'removeItem'>, key: string | null): void {
  try {
    if (key === null) storage.removeItem(KEY_STORAGE);
    else storage.setItem(KEY_STORAGE, key);
  } catch {
    // Sin almacenamiento: la sincronización sigue esta sesión pero no se recuerda.
  }
}
