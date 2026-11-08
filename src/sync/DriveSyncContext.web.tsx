import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useProgress } from '../progress/ProgressContext';
import { createDriveRestClient } from './driveRest';
import type { DriveSyncState, DriveSyncValue } from './driveSyncTypes';
import { createGoogleAuth } from './googleAuth.web';
import { createSyncEngine } from './syncEngine';

// Conecta el motor de sincronización con el progreso y con Google (ver docs/superpowers/specs/2026-11-07-version-web-design.md, sección 4).
// Se sincroniza al abrir la app, cuando cambia el progreso, al volver a la pestaña y al recuperar la conexión.
// El permiso de Google dura una hora y vive en memoria: al vencer (o al abrir la app de nuevo), el motor se pausa.
// Nunca se abre una ventana sola: sin un toque de la persona el navegador la bloquea (probado el 8-11-2026 en Chrome
// de PC y de Android). Por eso el primer toque en la app vuelve a pedir el permiso (`signIn`: si ya lo dio y hay una sola
// sesión de Google, la ventana se cierra sola). Si no sale, queda «Reconectar» en Ajustes.

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
  const [status, setStatus] = useState<DriveSyncState>(() => (readFlag() ? 'needsAuth' : 'off')); // al abrir con la copia activada aún no hay permiso
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

  /** Sin permiso vigente: se avisa que hace falta reconectar y se prepara el intento con el próximo toque. */
  const askToReconnect = useCallback(() => setStatus('needsAuth'), []);

  // Un intento por toque; si falla (sin sesión de Google, ventana cerrada) no se repite solo: queda «Reconectar».
  const silentTried = useRef(false);
  const silentFailed = useRef(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!enabled || status !== 'needsAuth' || silentTried.current) return;
    void auth.current!.warm();
    const onTap = () => {
      silentTried.current = true;
      document.removeEventListener('click', onTap, true);
      auth.current!.signIn().then(
        () => {
          engine.resume();
          void engine.syncNow();
        },
        () => {
          silentFailed.current = true;
        }
      );
    };
    document.addEventListener('click', onTap, true);
    return () => document.removeEventListener('click', onTap, true);
  }, [enabled, status, engine, retry]);

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
      else {
        // Si el permiso venció con la app abierta, se vuelve a intentar con el próximo toque (salvo que ya haya fallado).
        if (!silentFailed.current) {
          silentTried.current = false;
          setRetry((n) => n + 1);
        }
        askToReconnect();
      }
    };
    document.addEventListener('visibilitychange', wake);
    window.addEventListener('online', wake);
    return () => {
      document.removeEventListener('visibilitychange', wake);
      window.removeEventListener('online', wake);
    };
  }, [enabled, engine, askToReconnect]);

  const connect = useCallback(async () => {
    try {
      await auth.current!.signIn();
    } catch {
      // Ventana cerrada o permiso no dado: no cambia nada; se puede volver a intentar.
      return;
    }
    silentFailed.current = false; // con un permiso nuevo, el próximo vencimiento vuelve a intentarse con un toque
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
