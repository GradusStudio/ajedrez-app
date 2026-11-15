/**
 * Errores de carga de un trozo de código (chunk) de la web. Pasan cuando la página corre una versión vieja y el
 * servidor ya publicó otra: el trozo que pide ya no existe. La salida es recargar una vez para tomar la versión
 * nueva; si vuelve a fallar, el aviso de error queda en pantalla. Módulo puro y probado.
 */

// El mensaje lo arma Metro, el navegador o WebKit según el caso: se comparan todos los conocidos.
const PATTERNS = [
  /ChunkLoadError/i,
  /Loading chunk [\w.-]+ failed/i,
  /Failed to fetch dynamically imported module/i,
  /error loading dynamically imported module/i,
  /Importing a module script failed/i,
];

/**
 * Tiempo mínimo entre dos recargas automáticas por trozo. Sin esta ventana, un trozo roto de la ruta actual haría
 * un bucle sin fin: la app carga, borraba la marca, el trozo vuelve a fallar y recarga otra vez. La marca guarda la
 * hora de la última recarga y solo se ignora cuando venció.
 */
export const CHUNK_RELOAD_WINDOW_MS = 5 * 60_000;

/** true si el error es de carga de un trozo de código (no un error de la pantalla). */
export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? `${error.name}: ${error.message}` : typeof error === 'string' ? error : '';
  return PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Recargar solo si es un error de trozo y no se recargó por lo mismo hace menos de `CHUNK_RELOAD_WINDOW_MS`.
 * `lastReloadAt` es la hora guardada de la última recarga (null si no hubo). Un reloj atrasado también queda
 * dentro de la ventana: es preferible mostrar el aviso de error a entrar en un bucle.
 */
export function shouldReloadForChunk(error: unknown, lastReloadAt: number | null, now: number): boolean {
  if (!isChunkLoadError(error)) return false;
  if (lastReloadAt === null) return true;
  return now - lastReloadAt >= CHUNK_RELOAD_WINDOW_MS;
}
