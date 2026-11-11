// Envío de Web Push desde el Worker (RFC 8291/8292). La suscripción la guarda la API de `handler.ts`; aquí solo se
// cifra el aviso con VAPID y se hace POST al endpoint. `build` y `fetch` entran como parámetros para probarlo sin red.

import { buildPushPayload } from '@block65/webcrypto-web-push';
import type { PushSender, ReminderSubscription } from './handler';

export type PushEnv = { VAPID_SUBJECT: string; VAPID_PUBLIC_KEY: string; VAPID_PRIVATE_KEY: string };

export type BuildPushPayload = (
  message: { data: string; options: { ttl: number } },
  subscription: { endpoint: string; expirationTime: null; keys: { p256dh: string; auth: string } },
  vapid: { subject: string; publicKey: string; privateKey: string }
) => Promise<RequestInit>;

/**
 * Arma el emisor de avisos. Un `404`/`410` significa que la suscripción ya no existe (`gone`); cualquier respuesta
 * correcta es `ok`; un error del servicio, un fallo de red o de cifrado es `retry` (la próxima pasada lo reintenta).
 */
export function createPushSender(
  fetchImpl: typeof fetch,
  env: PushEnv,
  build: BuildPushPayload = buildPushPayload
): PushSender {
  return {
    async send(sub: ReminderSubscription, payload: string) {
      try {
        const init = await build(
          { data: payload, options: { ttl: 3600 } },
          { endpoint: sub.endpoint, expirationTime: null, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } },
          { subject: env.VAPID_SUBJECT, publicKey: env.VAPID_PUBLIC_KEY, privateKey: env.VAPID_PRIVATE_KEY }
        );
        const res = await fetchImpl(sub.endpoint, init);
        if (res.status === 404 || res.status === 410) return 'gone';
        return res.ok ? 'ok' : 'retry';
      } catch {
        return 'retry';
      }
    },
  };
}
