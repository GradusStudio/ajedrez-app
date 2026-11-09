// Service worker que se borra solo (8-11-2026).
//
// Hasta el 8-11-2026 la app vivía en la raíz y su service worker era /sw.js, con alcance en todo el sitio. Al pasar
// la app a /app (su service worker ahora es /app/sw.js), los navegadores que ya la habían abierto seguían controlados
// por el /sw.js viejo: respondía /app/ con la app vieja guardada, que mostraba «Esta página no existe», y los puzzles
// no cargaban. Un service worker instalado no se va solo cuando su archivo da 404.
//
// Al buscar una actualización del viejo, el navegador encuentra este archivo, lo instala y lo activa sin esperar.
// Borra solo la copia de la app vieja (la caché de Workbox con alcance en la raíz), se da de baja y recarga las
// pestañas, que vuelven a pedir la página al servidor. No toca `gradus-heavy` ni la caché de /app/: son de la app nueva.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const rootScope = self.registration.scope;
      for (const name of await caches.keys()) {
        if (name.startsWith('workbox-precache') && name.endsWith(rootScope)) await caches.delete(name);
      }
      await self.registration.unregister();
      const tabs = await self.clients.matchAll({ type: 'window' });
      for (const tab of tabs) tab.navigate(tab.url);
    })(),
  );
});
