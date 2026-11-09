import { mergeProgress, sameProgress } from '../progress/merge';
import { parseProgressFile, progressToFile } from '../progress/progressFile';
import type { Progress } from '../progress/progressStore';
import { createSerializer } from '../settings/serialize';

// Sincronización del progreso con un archivo único en Google Drive (carpeta oculta de la app).
// No sabe nada de Google ni de React: habla con un `DriveClient` y con funciones que le pasa quien lo usa,
// así se prueba entero en `npm test`. Diseño: docs/superpowers/specs/2026-11-07-version-web-design.md, sección 4.

/** Por qué falló una llamada a Drive; quien implementa `DriveClient` traduce los errores de Google a esto. */
export type DriveErrorKind = 'offline' | 'auth' | 'quota' | 'forbidden' | 'other';

export class DriveError extends Error {
  constructor(
    readonly kind: DriveErrorKind,
    message?: string
  ) {
    super(message ?? `Drive: ${kind}`);
    this.name = 'DriveError';
  }
}

/** El único archivo de Gradus en Drive. `read` devuelve null si todavía no existe. */
export type DriveClient = {
  read: () => Promise<string | null>;
  write: (text: string) => Promise<void>;
};

export type SyncStatus =
  | 'idle'
  | 'syncing'
  | 'ok'
  /** Sin conexión: se reintenta cuando vuelve (quien usa el motor llama a `requestSync`). */
  | 'offline'
  /** El permiso de Google venció: el motor se pausa hasta `resume()`. */
  | 'needsAuth'
  /** Drive lleno. */
  | 'quota'
  /** La cuenta no permite guardar (colegio, trabajo o supervisada). */
  | 'blocked'
  /** El archivo de Drive está dañado: no se pisa. */
  | 'corrupt'
  /** El archivo lo escribió una versión más nueva de la app: no se pisa. */
  | 'tooNew'
  | 'error';

export type SyncResult = { status: SyncStatus };

type Deps = {
  client: DriveClient;
  /** Progreso actual de este dispositivo (se pide justo antes de usarlo, no se guarda). */
  getLocal: () => Progress;
  /** Combina lo bajado de Drive con el progreso actual, lo guarda y devuelve el resultado. */
  mergeIntoLocal: (remote: Progress) => Progress;
  onStatus?: (status: SyncStatus) => void;
  /** Agenda una función y devuelve cómo cancelarla (en la app, `setTimeout`). */
  schedule: (fn: () => void, ms: number) => () => void;
  /** Espera para agrupar pedidos seguidos en una sola sincronización. */
  debounceMs: number;
  now?: () => Date;
};

const STATUS_BY_ERROR: Record<DriveErrorKind, SyncStatus> = {
  offline: 'offline',
  auth: 'needsAuth',
  quota: 'quota',
  forbidden: 'blocked',
  other: 'error',
};

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
      const text = await client.read();
      if (text === null) {
        await client.write(progressToFile(getLocal(), now()));
        return report('ok');
      }
      const parsed = parseProgressFile(text);
      if (!parsed.ok) return report(parsed.error === 'tooNew' ? 'tooNew' : 'corrupt');
      const merged = mergeIntoLocal(parsed.progress);
      // Lo que ya está en Drive (normalizado como lo deja la combinación) no se vuelve a subir.
      if (!sameData(merged, mergeProgress(parsed.progress, parsed.progress))) {
        await client.write(progressToFile(merged, now()));
      }
      return report('ok');
    } catch (e) {
      const status = e instanceof DriveError ? STATUS_BY_ERROR[e.kind] : 'error';
      if (status === 'needsAuth') paused = true;
      return report(status);
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

  /** Después de renovar el permiso de Google. */
  function resume(): void {
    paused = false;
    requestSync();
  }

  /** Espera a que termine lo que está en curso (para pruebas y para cerrar). */
  async function idle(): Promise<void> {
    await last.catch(() => {});
  }

  return { syncNow, requestSync, resume, idle, isPaused: () => paused };
}

// Tipos del servidor de sincronización propio (`serverClient.ts`). El motor se reescribe sobre ellos en la tarea 3;
// hasta entonces `DriveError` sigue siendo lo que usan el cliente de Drive y el motor actual.

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
