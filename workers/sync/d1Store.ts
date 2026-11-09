import type { ProgressStore } from './handler';

// Tipos mínimos del binding D1 (evita depender de @cloudflare/workers-types).
type D1Statement = {
  bind(...values: unknown[]): D1Statement;
  first<T>(): Promise<T | null>;
  run(): Promise<{ meta: { changes: number } }>;
};
export type D1Like = { prepare(sql: string): D1Statement };

type Row = { version: number; data: string | null; deleted: number };

export function createD1Store(db: D1Like): ProgressStore {
  async function get(id: string) {
    const row = await db.prepare('SELECT version, data, deleted FROM progress WHERE id = ?').bind(id).first<Row>();
    return row ? { version: row.version, data: row.data, deleted: row.deleted === 1 } : null;
  }

  return {
    get,
    async put(id, expected, data, now) {
      // Solo expected = 0 puede crear la fila (versión 1); si ya existe, no cambia nada. Con expected > 0 solo se
      // actualiza una fila existente cuya versión coincida y no esté borrada: sin fila no se inventa una (conflicto).
      const res =
        expected === 0
          ? await db
              .prepare(
                `INSERT INTO progress (id, version, data, deleted, updated_at) VALUES (?1, 1, ?2, 0, ?3)
                 ON CONFLICT(id) DO NOTHING`,
              )
              .bind(id, data, now)
              .run()
          : await db
              .prepare(
                `UPDATE progress SET version = version + 1, data = ?3, updated_at = ?4
                 WHERE id = ?1 AND version = ?2 AND deleted = 0`,
              )
              .bind(id, expected, data, now)
              .run();
      if (res.meta.changes > 0) return 'ok';
      const row = await get(id);
      return row?.deleted ? 'deleted' : 'conflict';
    },
    async remove(id, now) {
      await db
        .prepare(
          `INSERT INTO progress (id, version, data, deleted, updated_at) VALUES (?1, 0, NULL, 1, ?2)
           ON CONFLICT(id) DO UPDATE SET data = NULL, deleted = 1, updated_at = excluded.updated_at`,
        )
        .bind(id, now)
        .run();
    },
  };
}
