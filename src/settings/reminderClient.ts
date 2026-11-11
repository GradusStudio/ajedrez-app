// Lógica pura del cliente de recordatorios Web Push: plan, credenciales del dispositivo y decodificación de la clave
// pública VAPID. Sin navegador, para probarla con node:test; las llamadas a la API viven en reminders.web.ts.

import type { InstallPlatform } from '../pwa/installPlatform';
import type { PlannedReminder } from './reminderPlan';
import type { ReminderSupport } from './reminderSupport';

export const REMINDER_STORAGE_KEY = 'gradus:recordatorio';

/** Identificador del dispositivo (16 bytes base64url) y secreto (32 bytes base64url), ambos sin relleno. */
export type ReminderCredentials = { deviceId: string; secret: string };

export type ReminderNoticePayload = { dueAt: string; title: string; body: string };

const DEVICE_ID = /^[A-Za-z0-9_-]{22}$/;
const SECRET = /^[A-Za-z0-9_-]{43}$/;

/** El servidor guarda las horas en UTC; el plan las calcula en la hora local elegida. */
export function planToNotices(plan: PlannedReminder[]): ReminderNoticePayload[] {
  return plan.map((r) => ({ dueAt: r.date.toISOString(), title: r.title, body: r.body }));
}

/** Solo acepta lo que el servidor pudo haber emitido: deviceId de 22 y secreto de 43, ambos base64url. */
export function parseReminderCredentials(raw: string | null): ReminderCredentials | null {
  if (!raw) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof value !== 'object' || value === null) return null;
  const { deviceId, secret } = value as { deviceId?: unknown; secret?: unknown };
  if (typeof deviceId !== 'string' || !DEVICE_ID.test(deviceId)) return null;
  if (typeof secret !== 'string' || !SECRET.test(secret)) return null;
  return { deviceId, secret };
}

export function serializeReminderCredentials(c: ReminderCredentials): string {
  return JSON.stringify({ deviceId: c.deviceId, secret: c.secret });
}

/** La clave VAPID viaja en base64url; la API de Push la pide como bytes. Acepta con o sin relleno. */
export function urlBase64ToUint8Array(base64: string): Uint8Array {
  const standard = base64.replace(/-/g, '+').replace(/_/g, '/');
  const padded = standard + '='.repeat((4 - (standard.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Solo se ofrece el recordatorio si el navegador tiene las tres APIs. En iPhone y iPad Web Push solo funciona con la
 * app agregada a la pantalla de inicio, por eso `ios` queda como `ios-needs-install`.
 */
export function detectReminderSupport(input: {
  hasServiceWorker: boolean;
  hasPushManager: boolean;
  hasNotification: boolean;
  platform: InstallPlatform;
}): ReminderSupport {
  if (!input.hasServiceWorker || !input.hasPushManager || !input.hasNotification) return 'unsupported';
  if (input.platform === 'ios') return 'ios-needs-install';
  return 'supported';
}
