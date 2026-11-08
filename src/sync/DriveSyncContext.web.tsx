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
// de PC y de Android). Por eso, con el permiso vencido solo queda «Reconectar» en Ajustes y, cada 3 lecciones o partidas
// terminadas, un cartel con el mismo botón en la pantalla de resultado (`noteCompletion`).

const FLAG_KEY = 'gradus:driveSync';
const COUNT_KEY = 'gradus:syncNudgeCount';
const NUDGE_EVERY = 3;
const DEBOUNCE_MS = 4000;

/** Suma una acción terminada y devuelve el total (por dispositivo, no se sincroniza). */
function bumpCount(): number {
  try {
    const n = (Number(window.localStorage.getItem(COUNT_KEY)) || 0) + 1;
    window.localStorage.setItem(COUNT_KEY, String(n));
    return n;
  } catch {
    return 0; // sin almacenamiento no se puede contar: no se avisa
  }
}

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

  /** Sin permiso vigente: se avisa que hace falta reconectar. */
  const askToReconnect = useCallback(() => setStatus('needsAuth'), []);

  // Con el script de Google ya bajado, la ventana se abre dentro del toque en «Reconectar» y el navegador no la bloquea.
  useEffect(() => {
    if (enabled && status === 'needsAuth') void auth.current!.warm();
  }, [enabled, status]);

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
      else askToReconnect(); // el permiso venció con la app abierta
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

  const noteCompletion = useCallback(() => {
    const n = bumpCount();
    return n > 0 && n % NUDGE_EVERY === 0 && enabledRef.current;
  }, []);

  const value = useMemo<DriveSyncValue>(
    () => ({ supported: true, enabled, status, enable: connect, reconnect: connect, disable, noteCompletion }),
    [enabled, status, connect, disable, noteCompletion]
  );
  return <DriveSyncContext.Provider value={value}>{children}</DriveSyncContext.Provider>;
}

export function useDriveSync(): DriveSyncValue {
  const value = useContext(DriveSyncContext);
  if (!value) throw new Error('useDriveSync debe usarse dentro de DriveSyncProvider');
  return value;
}
