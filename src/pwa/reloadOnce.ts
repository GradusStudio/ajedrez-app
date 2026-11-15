// En el celular no hay trozos de la web: la app ya está entera en el paquete. El aviso de error basta.
export function reloadOnceForChunk(): boolean {
  return false;
}

export function clearChunkReloadMark(): void {}

/** Recarga la app; en el celular no hace nada (el límite de errores ofrece reintentar). */
export function reloadPage(): void {}
