// En el celular no hay service worker ni instalación: no hace nada.
export function registerServiceWorker(): void {}
export function requestPersistentStorage(): void {}
/** No hay versiones web que aplicar: nunca recarga. */
export function applyUpdate(_force = false): boolean {
  return false;
}
