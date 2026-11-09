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
      // Con expected = 0 y sin fila inserta con version 1; si la fila existe, solo actualiza si la versión coincide
      // y no está borrada. (Con expected = 0 y fila existente la condición falla: la versión mínima guardada es 1.)
      const res = await db
        .prepare(
          `INSERT INTO progress (id, version, data, deleted, updated_at) VALUES (?1, ?2 + 1, ?3, 0, ?4)
           ON CONFLICT(id) DO UPDATE SET version = progress.version + 1, data = excluded.data, updated_at = excluded.updated_at
           WHERE progress.version = ?2 AND progress.deleted = 0`,
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
