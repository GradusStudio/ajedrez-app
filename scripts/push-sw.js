// Avisos Web Push de Gradus. Workbox importa este script clásico (sin módulos) al sw.js generado por
// scripts/build-sw.js. La marca local de práctica la escribe src/progress/practiceMark.web.ts con las mismas
// constantes de src/progress/practiceMarkLogic.ts.
//
// Si la persona ya practicó hoy en este dispositivo, la marca tiene la fecha local de hoy y no se muestra el aviso:
// así la práctica sin conexión también suprime el recordatorio, aunque el servidor todavía crea que falta.

const PRACTICE_CACHE = 'gradus-practica';
const PRACTICE_KEY = '/app/practica-hoy';
const APP_URL = '/app/';

/** Día local en formato 2026-10-27, igual que todayKey() de src/progress/streak.ts. */
function todayKey() {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${m}-${d}`;
}

/** true si la marca de práctica existe y es la fecha de hoy. Si Cache Storage falla, no se suprime el aviso. */
async function practicedToday() {
  try {
    const mark = await caches.match(PRACTICE_KEY, { cacheName: PRACTICE_CACHE });
    return !!mark && (await mark.text()) === todayKey();
  } catch {
    return false;
  }
}

/** Título, texto y URL del aviso. Si el payload falta o no es JSON, se usan textos por defecto. */
function payloadOf(event) {
  try {
    const data = event.data && event.data.json();
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
}

async function showReminder(event) {
  if (await practicedToday()) return;
  const data = payloadOf(event);
  const title = typeof data.title === 'string' && data.title ? data.title : 'Gradus';
  const body = typeof data.body === 'string' && data.body ? data.body : 'Es hora de practicar';
  const url = typeof data.url === 'string' && data.url ? data.url : APP_URL;
  await self.registration.showNotification(title, {
    body,
    icon: '/app/icons/icon-192.png',
    badge: '/app/icons/icon-192.png',
    data: { url },
  });
}

self.addEventListener('push', (event) => {
  event.waitUntil(showReminder(event));
});

/** Enfoca una ventana que ya esté en /app/; si no hay, abre la URL del aviso. */
async function openApp(url) {
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  const appWindow = windows.find((client) => new URL(client.url).pathname.startsWith(APP_URL));
  if (appWindow) return appWindow.focus();
  return self.clients.openWindow(url);
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || APP_URL;
  event.waitUntil(openApp(url));
});
