/**
 * true si la web se abrió como app instalada (pantalla de inicio o ventana propia): la señal de Safari en iPhone
 * (`navigator.standalone`) o el modo de pantalla `standalone`. Ante cualquier error, false.
 */
export function isStandalone(): boolean {
  try {
    if ((navigator as Navigator & { standalone?: boolean }).standalone === true) return true;
    return window.matchMedia('(display-mode: standalone)').matches;
  } catch {
    return false;
  }
}
