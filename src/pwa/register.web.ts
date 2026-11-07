// Registra el service worker (solo en la versión publicada) y pide almacenamiento persistente si la app está instalada.
export function registerServiceWorker(): void {
  try {
    if (process.env.NODE_ENV !== 'production') return;
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  } catch {
    // Sin service worker la app funciona igual, solo que no abre sin internet.
  }
}

function isInstalled(): boolean {
  try {
    const standalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
    return standalone || window.matchMedia('(display-mode: standalone)').matches;
  } catch {
    return false;
  }
}

export function requestPersistentStorage(): void {
  try {
    if (!isInstalled()) return;
    navigator.storage?.persist?.().catch(() => {});
  } catch {
    // Es una mejora: si el navegador no lo permite, se sigue sin ella.
  }
}
