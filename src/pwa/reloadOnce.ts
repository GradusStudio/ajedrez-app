// En el nativo no hay trozos de la web que recargar: el mismo módulo existe para compartir las importaciones.
export function readChunkReloadMark(): number | null {
  return null;
}

export function reloadOnceForChunk(): boolean {
  return false;
}

export function reloadPage(): void {}
