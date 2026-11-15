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

/** true si el error es de carga de un trozo de código (no un error de la pantalla). */
export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? `${error.name}: ${error.message}` : typeof error === 'string' ? error : '';
  return PATTERNS.some((pattern) => pattern.test(message));
}

/** Recargar solo si es un error de trozo y no se recargó ya por lo mismo (evita un bucle de recargas). */
export function shouldReloadForChunk(error: unknown, alreadyReloaded: boolean): boolean {
  return !alreadyReloaded && isChunkLoadError(error);
}
