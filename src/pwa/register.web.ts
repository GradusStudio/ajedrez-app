import { isStandalone } from './standalone.web';
import { isInsideActivity } from './updatePolicy';

// Service worker (solo en la versión publicada) y actualizaciones.
//
// El service worker de cada versión nueva queda en espera (`waiting`) y no toma el control solo (skipWaiting y
// clientsClaim en false, scripts/build-sw.js). La app lo activa en un momento seguro, fuera de una lección, un
// puzzle, una partida, una revisión, el quiz o el análisis libre (updatePolicy.ts), y recarga una sola vez para
// pasar a la versión nueva. Momentos seguros: al abrir la app (incluido cuando termina de instalarse la versión
// nueva encontrada al abrir), al volver a la pestaña y al tocar «Reintentar» si no cargan los puzzles.

let registration: ServiceWorkerRegistration | null = null;
/** Ya se pidió la recarga en esta carga de la página: nunca se recarga dos veces. */
let reloading = false;
/** El service worker que controla la página cambió después de abrirla: la página corre la versión vieja. */
let controllerChanged = false;

function reloadOnce(): void {
  if (reloading) return;
  reloading = true;
  window.location.reload();
}

/**
 * Aplica la versión nueva si hay una: recarga si el control ya pasó a otra versión o, si hay un service worker en
 * espera, le pide que se active (la recarga llega con `controllerchange`). Sin `force`, no hace nada dentro de
 * una actividad. Devuelve true si la página se va a recargar.
 */
export function applyUpdate(force = false): boolean {
  try {
    if (reloading) return true;
    if (!force && isInsideActivity(window.location.pathname)) return false;
    if (controllerChanged) {
      reloadOnce();
      return true;
    }
    const waiting = registration?.waiting;
    if (!waiting) return false;
    waiting.postMessage({ type: 'SKIP_WAITING' });
    // Sin service worker que controle la página (primera visita), la página ya corre lo último: no recarga.
    return !!navigator.serviceWorker.controller;
  } catch {
    return false;
  }
}

/** Cuando termina de instalarse una versión nueva, es otro momento para aplicarla. */
function watchInstalling(reg: ServiceWorkerRegistration): void {
  const worker = reg.installing;
  if (!worker) return;
  worker.addEventListener('statechange', () => {
    if (worker.state === 'installed') applyUpdate();
  });
}

export function registerServiceWorker(): void {
  try {
    if (process.env.NODE_ENV !== 'production') return;
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    const sw = navigator.serviceWorker;
    // En la primera instalación no hay versión vieja que reemplazar: ese cambio de control no recarga.
    const hadController = !!sw.controller;
    sw.addEventListener('controllerchange', () => {
      if (!hadController) return;
      controllerChanged = true;
      applyUpdate();
    });
    sw.register('/sw.js')
      .then((reg) => {
        registration = reg;
        watchInstalling(reg);
        reg.addEventListener('updatefound', () => watchInstalling(reg));
        applyUpdate();
      })
      .catch(() => {});
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return;
      if (!applyUpdate()) registration?.update().catch(() => {});
    });
  } catch {
    // Sin service worker la app funciona igual, solo que no abre sin internet.
  }
}

export function requestPersistentStorage(): void {
  try {
    if (!isStandalone()) return;
    navigator.storage?.persist?.().catch(() => {});
  } catch {
    // Es una mejora: si el navegador no lo permite, se sigue sin ella.
  }
}
