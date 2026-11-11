// Planificador del cron: agrupa los avisos vencidos por dispositivo, envía solo el más reciente y borra los demás.
// Un envío fallido se queda para el próximo ciclo mientras no cumpla una hora; un 404/410 borra el dispositivo.

import type { PushSender, ReminderStore, ReminderSubscription } from './handler';

export type DueNotice = {
  noticeId: number;
  deviceId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  dueAt: string;
  title: string;
  body: string;
};

export type ReminderSendStore = ReminderStore & {
  dueNotices(now: string): Promise<DueNotice[]>;
  deleteNotices(ids: number[]): Promise<void>;
  pruneDevices(before: string): Promise<void>;
};

const HOUR_MS = 60 * 60 * 1000;
const INACTIVE_MS = 30 * 24 * HOUR_MS;

/**
 * Envía los avisos que ya vencieron. `dropped` cuenta los avisos borrados sin enviar: los superados por otro más
 * reciente del mismo dispositivo y el que ya tiene más de una hora.
 */
export async function sendDueReminders(
  store: ReminderSendStore,
  sender: PushSender,
  now: Date
): Promise<{ sent: number; gone: number; dropped: number }> {
  await store.pruneDevices(new Date(now.getTime() - INACTIVE_MS).toISOString());

  const groups = new Map<string, DueNotice[]>();
  for (const notice of await store.dueNotices(now.toISOString())) {
    const group = groups.get(notice.deviceId);
    if (group) group.push(notice);
    else groups.set(notice.deviceId, [notice]);
  }

  const counts = { sent: 0, gone: 0, dropped: 0 };
  for (const [deviceId, notices] of groups) {
    // Las fechas se guardan como ISO 8601 en UTC, así que el orden alfabético es el cronológico.
    const ordered = [...notices].sort((a, b) =>
      a.dueAt < b.dueAt ? 1 : a.dueAt > b.dueAt ? -1 : b.noticeId - a.noticeId
    );
    const newest = ordered[0];

    const older = ordered.slice(1).map((notice) => notice.noticeId);
    if (older.length > 0) {
      await store.deleteNotices(older);
      counts.dropped += older.length;
    }

    if (new Date(newest.dueAt).getTime() < now.getTime() - HOUR_MS) {
      await store.deleteNotices([newest.noticeId]);
      counts.dropped += 1;
      continue;
    }

    const subscription: ReminderSubscription = {
      endpoint: newest.endpoint,
      keys: { p256dh: newest.p256dh, auth: newest.auth },
    };
    let result: 'ok' | 'gone' | 'retry';
    try {
      result = await sender.send(subscription, JSON.stringify({ title: newest.title, body: newest.body, url: '/app/' }));
    } catch {
      result = 'retry';
    }

    if (result === 'ok') {
      await store.deleteNotices([newest.noticeId]);
      counts.sent += 1;
    } else if (result === 'gone') {
      await store.removeDevice(deviceId);
      counts.gone += 1;
    }
  }

  return counts;
}
