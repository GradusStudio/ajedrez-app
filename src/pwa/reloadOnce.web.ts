// Recarga de la web cuando un trozo de código no carga (ver chunkError.ts).
const KEY = 'gradus:recarga-por-trozo';

/**
 * Recarga la página una sola vez por pestaña para tomar la versión publicada. Devuelve true si recargó; si ya se
 * intentó antes en esta pestaña, no recarga (el aviso de error queda en pantalla con «Recargar la app»).
 */
export function reloadOnceForChunk(): boolean {
  try {
    if (sessionStorage.getItem(KEY)) return false;
    sessionStorage.setItem(KEY, '1');
    window.location.reload();
    return true;
  } catch {
    return false;
  }
}

/** La app ya cargó bien: la próxima actualización puede volver a recargar una vez. */
export function clearChunkReloadMark(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Sin sessionStorage (modo privado) no hay marca que limpiar.
  }
}

/** El botón «Recargar la app» del aviso de error: recarga sin condiciones. */
export function reloadPage(): void {
  window.location.reload();
}
