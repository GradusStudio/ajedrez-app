import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useProgress } from '../progress/ProgressContext';
import { createDriveRestClient } from './driveRest';
import type { DriveSyncState, DriveSyncValue } from './driveSyncTypes';
import { createGoogleAuth } from './googleAuth.web';
import { createSyncEngine } from './syncEngine';

// Conecta el motor de sincronización con el progreso y con Google (ver docs/superpowers/specs/2026-11-07-version-web-design.md, sección 4).
// Se sincroniza al abrir la app, cuando cambia el progreso, al volver a la pestaña y al recuperar la conexión.
// El permiso de Google dura una hora y vive en memoria: al vencer, el motor se pausa y se vuelve a pedir sin ventana
// (si Google lo permite) o con un toque en Ajustes. Nunca se abre una ventana sola en medio de una lección.

const FLAG_KEY = 'gradus:driveSync';
const DEBOUNCE_MS = 4000;

function readFlag(): boolean {
  try {
    return window.localStorage.getItem(FLAG_KEY) === '1';
  } catch {
    return false;
  }
}

function writeFlag(on: boolean): void {
  try {
    if (on) window.localStorage.setItem(FLAG_KEY, '1');
    else window.localStorage.removeItem(FLAG_KEY);
  } catch {
    // Sin almacenamiento: la sincronización sigue esta sesión pero no se recuerda.
  }
}

const DriveSyncContext = createContext<DriveSyncValue | null>(null);

export function DriveSyncProvider({ children }: { children: React.ReactNode }) {
  const { progress, loaded, getProgress, mergeRemote } = useProgress();
  const [enabled, setEnabled] = useState(readFlag);
  const [status, setStatus] = useState<DriveSyncState>(() => (readFlag() ? 'idle' : 'off'));
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const auth = useRef<ReturnType<typeof createGoogleAuth> | null>(null);
  auth.current ??= createGoogleAuth();

  const engine = useMemo(
    () =>
      createSyncEngine({
        client: createDriveRestClient({ fetch: (...a) => window.fetch(...a), getToken: () => auth.current!.getToken() }),
        getLocal: getProgress,
        mergeIntoLocal: mergeRemote,
        // Si se desactivó mientras corría, no se muestra el resultado.
        onStatus: (s) => enabledRef.current && setStatus(s),
        schedule: (fn, ms) => {
          const id = window.setTimeout(fn, ms);
          return () => window.clearTimeout(id);
        },
        debounceMs: DEBOUNCE_MS,
      }),
    [getProgress, mergeRemote]
  );

  /** Intenta recuperar el permiso sin ventana y, si sale, sigue sincronizando. Devuelve si lo logró. */
  const resumeQuietly = useCallback(async (): Promise<boolean> => {
    try {
      await auth.current!.trySilent();
    } catch {
      return false;
    }
    engine.resume();
    void engine.syncNow();
    return true;
  }, [engine]);

  /** Como `resumeQuietly`, y si no se pudo avisa que hace falta reconectar (un toque en Ajustes). */
  const resumeOrAsk = useCallback(
    () =>
      void resumeQuietly().then((ok) => {
        if (!ok) setStatus('needsAuth');
      }),
    [resumeQuietly]
  );

  // Al abrir la app con la sincronización ya activada.
  useEffect(() => {
    if (loaded && enabled) resumeOrAsk();
    // Solo cuando el progreso termina de cargar: activar o desactivar después lo manejan `enable` y `disable`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  // Cada cambio del progreso pide una sincronización (el motor agrupa los pedidos seguidos).
  useEffect(() => {
    if (loaded && enabled && auth.current!.hasToken()) engine.requestSync();
  }, [progress, loaded, enabled, engine]);

  // Al volver a la pestaña o recuperar la conexión.
  useEffect(() => {
    if (!enabled) return;
    const wake = () => {
      if (document.visibilityState === 'hidden') return;
      if (auth.current!.hasToken()) engine.requestSync();
      else resumeOrAsk();
    };
    document.addEventListener('visibilitychange', wake);
    window.addEventListener('online', wake);
    return () => {
      document.removeEventListener('visibilitychange', wake);
      window.removeEventListener('online', wake);
    };
  }, [enabled, engine, resumeOrAsk]);

  const connect = useCallback(async () => {
    try {
      await auth.current!.signIn();
    } catch {
      // Ventana cerrada o permiso no dado: no cambia nada; se puede volver a intentar.
      return;
    }
    writeFlag(true);
    enabledRef.current = true; // sin esperar al próximo dibujo: el primer estado tiene que verse
    setEnabled(true);
    engine.resume();
    await engine.syncNow();
  }, [engine]);

  const disable = useCallback(async () => {
    writeFlag(false);
    enabledRef.current = false;
    setEnabled(false);
    setStatus('off');
    await auth.current!.revoke();
  }, []);

  const value = useMemo<DriveSyncValue>(
    () => ({ supported: true, enabled, status, enable: connect, reconnect: connect, disable }),
    [enabled, status, connect, disable]
  );
  return <DriveSyncContext.Provider value={value}>{children}</DriveSyncContext.Provider>;
}

export function useDriveSync(): DriveSyncValue {
  const value = useContext(DriveSyncContext);
  if (!value) throw new Error('useDriveSync debe usarse dentro de DriveSyncProvider');
  return value;
}
