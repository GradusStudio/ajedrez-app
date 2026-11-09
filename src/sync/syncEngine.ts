import { mergeProgress, sameProgress } from '../progress/merge';
import { parseProgressFile, progressToFile } from '../progress/progressFile';
import type { Progress } from '../progress/progressStore';
import { createSerializer } from '../settings/serialize';

// Sincronización del progreso con el servidor propio de Gradus (un texto con versión por llave).
// No sabe nada de HTTP ni de React: habla con un `SyncClient` y con funciones que le pasa quien lo usa,
// así se prueba entero en `npm test`. Diseño: docs/superpowers/specs/2026-11-09-sincronizacion-con-llave-design.md.

/** Por qué falló una llamada al servidor de sincronización. */
export type SyncErrorKind = 'offline' | 'revoked' | 'tooLarge' | 'other';

export class SyncError extends Error {
  constructor(
    readonly kind: SyncErrorKind,
    message?: string
  ) {
    super(message ?? `Sync: ${kind}`);
    this.name = 'SyncError';
  }
}

/** Otro dispositivo guardó antes: trae la versión y el texto que hay en el servidor. */
export class SyncConflict extends Error {
  constructor(readonly remote: { version: number; text: string }) {
    super('Sync: conflicto de versión');
    this.name = 'SyncConflict';
  }
}

/** El progreso en el servidor. `read` devuelve null si todavía no hay nada; `write` devuelve la versión nueva. */
export type SyncClient = {
  read: () => Promise<{ version: number; text: string } | null>;
  write: (text: string, expected: number) => Promise<number>;
};

export type SyncStatus =
  | 'idle'
  | 'syncing'
  | 'ok'
  /** Sin conexión: se reintenta cuando vuelve (quien usa el motor llama a `requestSync`). */
  | 'offline'
  /** El servidor ya no reconoce la llave: el motor se pausa hasta `resume()`. */
  | 'revoked'
  /** El texto del servidor está dañado: no se pisa. */
  | 'corrupt'
  /** Lo escribió una versión más nueva de la app: no se pisa. */
  | 'tooNew'
  | 'error';

export type SyncResult = { status: SyncStatus };

type Deps = {
  client: SyncClient;
  /** Progreso actual de este dispositivo (se pide justo antes de usarlo, no se guarda). */
  getLocal: () => Progress;
  /** Combina lo bajado del servidor con el progreso actual, lo guarda y devuelve el resultado. */
  mergeIntoLocal: (remote: Progress) => Progress;
  onStatus?: (status: SyncStatus) => void;
  /** Agenda una función y devuelve cómo cancelarla (en la app, `setTimeout`). */
  schedule: (fn: () => void, ms: number) => () => void;
  /** Espera para agrupar pedidos seguidos en una sola sincronización. */
  debounceMs: number;
  now?: () => Date;
};

/** Cuántos conflictos seguidos se resuelven antes de rendirse hasta el próximo pedido. */
const MAX_CONFLICTS = 3;

/** Dos progresos con los mismos datos, sin mirar de qué dispositivo es cada uno. */
const sameData = (a: Progress, b: Progress) => sameProgress({ ...a, deviceId: '' }, { ...b, deviceId: '' });

export function createSyncEngine(deps: Deps) {
  const { client, getLocal, mergeIntoLocal, onStatus, schedule, debounceMs } = deps;
  const now = deps.now ?? (() => new Date());
  const run = createSerializer();

  let paused = false;
  let inFlight = 0;
  let dirty = false;
  let cancelTimer: (() => void) | null = null;
  let last: Promise<unknown> = Promise.resolve();

  function report(status: SyncStatus): SyncResult {
    onStatus?.(status);
    return { status };
  }

  async function sync(): Promise<SyncResult> {
    report('syncing');
    try {
      let remote = await client.read();
      for (let conflicts = 0; ; conflicts++) {
        if (remote === null) {
          await client.write(progressToFile(getLocal(), now()), 0);
          return report('ok');
        }
        const parsed = parseProgressFile(remote.text);
        if (!parsed.ok) return report(parsed.error === 'tooNew' ? 'tooNew' : 'corrupt');
        const merged = mergeIntoLocal(parsed.progress);
        try {
          // Lo que ya está en el servidor (normalizado como lo deja la combinación) no se vuelve a subir.
          if (!sameData(merged, mergeProgress(parsed.progress, parsed.progress))) {
            await client.write(progressToFile(merged, now()), remote.version);
          }
          return report('ok');
        } catch (e) {
          // Otro dispositivo guardó antes: se combina con lo que trae el conflicto, sin volver a leer.
          if (!(e instanceof SyncConflict)) throw e;
          if (conflicts + 1 >= MAX_CONFLICTS) return report('error');
          remote = e.remote;
        }
      }
    } catch (e) {
      if (e instanceof SyncError) {
        if (e.kind === 'offline') return report('offline');
        if (e.kind === 'revoked') {
          paused = true;
          return report('revoked');
        }
      }
      return report('error');
    }
  }

  function syncNow(): Promise<SyncResult> {
    inFlight++;
    const result = run(sync).finally(() => {
      inFlight--;
      // Algo cambió mientras se sincronizaba: queda una más para juntarlo.
      if (inFlight === 0 && dirty) {
        dirty = false;
        requestSync();
      }
    });
    last = result;
    return result;
  }

  /** Pide sincronizar pronto: varios pedidos seguidos se agrupan en uno. */
  function requestSync(): void {
    if (paused) return;
    if (inFlight > 0) {
      dirty = true;
      return;
    }
    cancelTimer?.();
    cancelTimer = schedule(() => {
      cancelTimer = null;
      void syncNow();
    }, debounceMs);
  }

  /** Sincroniza ya: cancela la espera del pedido agrupado (por ejemplo al cerrar o al volver a la app). */
  function flush(): Promise<SyncResult> {
    cancelTimer?.();
    cancelTimer = null;
    return syncNow();
  }

  /** Después de volver a vincular con una llave nueva. */
  function resume(): void {
    paused = false;
    requestSync();
  }

  /** Espera a que termine lo que está en curso (para pruebas y para cerrar). */
  async function idle(): Promise<void> {
    await last.catch(() => {});
  }

  return { syncNow, flush, requestSync, resume, idle, isPaused: () => paused };
}
