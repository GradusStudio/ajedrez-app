import type { Bot } from '../data/bots';
import type { Streak } from '../progress/streak';
import { detectInstallPlatform } from '../pwa/installPlatform';
import { isStandalone } from '../pwa/standalone.web';
import { SYNC_URL } from '../sync/serverClient';
import { VAPID_PUBLIC_KEY } from './pushConfig';
import {
  detectReminderSupport,
  parseReminderCredentials,
  planToNotices,
  REMINDER_STORAGE_KEY,
  serializeReminderCredentials,
  urlBase64ToUint8Array,
  type ReminderNoticePayload,
} from './reminderClient';
import { planReminders } from './reminderPlan';
import type { ReminderSupport } from './reminderSupport';
import { createSerializer } from './serialize';

// Recordatorio diario en la web con Web Push: el servidor guarda la suscripción y el plan de 7 días y envía cada aviso
// aunque la app esté cerrada. La app nativa usa notificaciones locales (reminders.ts).

const BASE_URL = process.env.EXPO_PUBLIC_SYNC_URL || SYNC_URL;

// Dos sincronizaciones superpuestas no deben crear dos dispositivos: van de a una, como en el módulo nativo.
const enqueue = createSerializer();

function currentSupport(): ReminderSupport {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return 'unsupported';
  return detectReminderSupport({
    hasServiceWorker: 'serviceWorker' in navigator,
    hasPushManager: 'PushManager' in window,
    hasNotification: 'Notification' in window,
    platform: detectInstallPlatform(navigator.userAgent ?? '', isStandalone(), navigator.maxTouchPoints ?? 0),
  });
}

export const REMINDER_SUPPORT: ReminderSupport = currentSupport();
export const REMINDERS_SUPPORTED = REMINDER_SUPPORT === 'supported';

/**
 * Pide permiso y crea la suscripción Push. Solo desde un toque de la persona (la oferta o el interruptor de Ajustes).
 * Sin las APIs necesarias, en iPhone sin instalar o sin la clave VAPID configurada, no hace nada y devuelve false.
 */
export async function ensureReminderPermission(_channelName: string): Promise<boolean> {
  if (REMINDER_SUPPORT !== 'supported' || VAPID_PUBLIC_KEY === 'REEMPLAZAR') return false;
  try {
    if (Notification.permission === 'default') await Notification.requestPermission();
    if (Notification.permission !== 'granted') return false;
    // En desarrollo no se registra el service worker y `ready` nunca resolvería: sin registro no hay nada que esperar.
    // Con registro, `ready` espera a que se active uno que se está instalando.
    if (!(await navigator.serviceWorker.getRegistration('/app/'))) return false;
    const registration = await navigator.serviceWorker.ready;
    await registration.pushManager.subscribe({
      userVisibleOnly: true,
      // Copia a un Uint8Array sobre ArrayBuffer: `applicationServerKey` no acepta el tipo genérico ArrayBufferLike.
      applicationServerKey: new Uint8Array(urlBase64ToUint8Array(VAPID_PUBLIC_KEY)),
    });
    return true;
  } catch {
    return false;
  }
}

/** Registra el dispositivo en el servidor y guarda las credenciales para poder actualizarlo o borrarlo después. */
async function registerDevice(sub: PushSubscription, notices: ReminderNoticePayload[]): Promise<void> {
  const res = await fetch(`${BASE_URL}/v1/reminders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription: sub.toJSON(), notices }),
  });
  if (!res.ok) return;
  const credentials = parseReminderCredentials(JSON.stringify(await res.json()));
  if (credentials) localStorage.setItem(REMINDER_STORAGE_KEY, serializeReminderCredentials(credentials));
}

/**
 * Mantiene el plan de los próximos 7 días en el servidor. Sin suscripción no hay a quién avisar. Si el servidor ya no
 * conoce el dispositivo (404, o el secreto dejó de servir: 401/403), lo registra de nuevo. Sin conexión se ignora: se
 * reintenta al abrir la app.
 */
async function doSync(s: Streak, hour: number, bots: Bot[], _channelName: string): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.getSubscription();
    if (!sub) return;
    const notices = planToNotices(planReminders(s, hour, new Date(), bots));
    const credentials = parseReminderCredentials(localStorage.getItem(REMINDER_STORAGE_KEY));
    if (!credentials) {
      await registerDevice(sub, notices);
      return;
    }
    const res = await fetch(`${BASE_URL}/v1/reminders/${credentials.deviceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${credentials.secret}` },
      body: JSON.stringify({ notices }),
    });
    if (res.status === 404 || res.status === 401 || res.status === 403) await registerDevice(sub, notices);
  } catch {
    // Sin conexión (o sin service worker) queda el plan anterior; se reintenta al abrir la app.
  }
}

export function syncReminders(s: Streak, hour: number, bots: Bot[], channelName: string): Promise<void> {
  return enqueue(() => doSync(s, hour, bots, channelName));
}

/** Da de baja el dispositivo y la suscripción. Cada paso se intenta aunque el anterior falle. */
export async function cancelDailyReminder(): Promise<void> {
  try {
    const credentials = parseReminderCredentials(localStorage.getItem(REMINDER_STORAGE_KEY));
    if (credentials) {
      await fetch(`${BASE_URL}/v1/reminders/${credentials.deviceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${credentials.secret}` },
      });
    }
  } catch {
    // Sin conexión el servidor borrará el dispositivo a los 30 días o cuando el Push responda 404/410.
  }
  try {
    localStorage.removeItem(REMINDER_STORAGE_KEY);
  } catch {
    // Sin almacenamiento local no hay credenciales que borrar.
  }
  try {
    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.getSubscription();
    await sub?.unsubscribe();
  } catch {
    // Sin suscripción no hay nada que dar de baja.
  }
}

/**
 * Comprueba si el recordatorio puede seguir activo: permiso concedido y suscripción existente. Si no, lo desactiva
 * (borra el servidor y la suscripción); `useReminderSync` apaga el ajuste para que no quede un interruptor sin efecto.
 */
export async function reminderIsUsable(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.getSubscription();
    if (Notification.permission !== 'granted' || !sub) {
      await cancelDailyReminder();
      return false;
    }
    return true;
  } catch {
    await cancelDailyReminder();
    return false;
  }
}
