// Implementación D1 del almacén de recordatorios y del planificador. Dos tablas: `reminders` (suscripción y hash del
// secreto) y `reminder_notices` (avisos pendientes). Sin claves foráneas: siempre se borran los avisos antes que la fila.

import type { ReminderNoticeInput, ReminderSubscription } from './handler';
import type { DueNotice, ReminderSendStore } from './scheduler';

// Tipos mínimos del binding D1 (evita depender de @cloudflare/workers-types).
type D1Statement = {
  bind(...values: unknown[]): D1Statement;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta: { changes: number } }>;
};
export type D1Like = { prepare(sql: string): D1Statement };

export function createD1ReminderStore(db: D1Like): ReminderSendStore {
  return {
    async createDevice({ id, secretHash, subscription, notices, now }) {
      await insertDevice(db, id, secretHash, subscription, now);
      for (const notice of notices) await insertNotice(db, id, notice);
    },

    async findDevice(id) {
      const row = await db.prepare('SELECT secret_hash FROM reminders WHERE id = ?').bind(id).first<{ secret_hash: string }>();
      return row ? { secretHash: row.secret_hash } : null;
    },

    async replaceNotices(id, notices, now) {
      await db.prepare('DELETE FROM reminder_notices WHERE device_id = ?').bind(id).run();
      for (const notice of notices) await insertNotice(db, id, notice);
      await db.prepare('UPDATE reminders SET updated_at = ? WHERE id = ?').bind(now, id).run();
    },

    async removeDevice(id) {
      await db.prepare('DELETE FROM reminder_notices WHERE device_id = ?').bind(id).run();
      await db.prepare('DELETE FROM reminders WHERE id = ?').bind(id).run();
    },

    async dueNotices(now) {
      const { results } = await db
        .prepare(
          `SELECT n.id AS noticeId, n.device_id AS deviceId, r.endpoint, r.p256dh, r.auth,
                  n.due_at AS dueAt, n.title, n.body
           FROM reminder_notices n JOIN reminders r ON r.id = n.device_id
           WHERE n.due_at <= ?`,
        )
        .bind(now)
        .all<DueNotice>();
      return results;
    },

    async deleteNotices(ids) {
      if (ids.length === 0) return;
      const placeholders = ids.map(() => '?').join(', ');
      await db.prepare(`DELETE FROM reminder_notices WHERE id IN (${placeholders})`).bind(...ids).run();
    },

    async pruneDevices(before) {
      await db
        .prepare('DELETE FROM reminder_notices WHERE device_id IN (SELECT id FROM reminders WHERE updated_at < ?)')
        .bind(before)
        .run();
      await db.prepare('DELETE FROM reminders WHERE updated_at < ?').bind(before).run();
    },
  };
}

async function insertDevice(
  db: D1Like,
  id: string,
  secretHash: string,
  subscription: ReminderSubscription,
  now: string
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO reminders (id, secret_hash, endpoint, p256dh, auth, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, secretHash, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth, now, now)
    .run();
}

async function insertNotice(db: D1Like, deviceId: string, notice: ReminderNoticeInput): Promise<void> {
  await db
    .prepare('INSERT INTO reminder_notices (device_id, due_at, title, body) VALUES (?, ?, ?, ?)')
    .bind(deviceId, notice.dueAt, notice.title, notice.body)
    .run();
}
