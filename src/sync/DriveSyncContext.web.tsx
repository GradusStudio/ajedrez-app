import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useProgress } from '../progress/ProgressContext';
import { createDriveRestClient, KEY_FILE_NAME } from './driveRest';
import { DriveKeyLeftError, type DriveSyncState, type DriveSyncValue } from './driveSyncTypes';
import { createGoogleAuth } from './googleAuth.web';
import { clearKeyIf, readKey, writeKey } from './keyStorage';
import { PopupError } from './popupError';
import { createServerClient, SYNC_URL } from './serverClient';
import { createSyncEngine, SyncError, type SyncStatus } from './syncEngine';
import { resolveActiveKey } from './syncKey';

// Conecta el motor de sincronización con el progreso y con Google (ver docs/superpowers/specs/2026-11-09-sincronizacion-con-llave-design.md).
// El progreso vive en el servidor de Gradus y se sincroniza con una llave guardada en este navegador. Google solo se usa
// al activar (una ventana) para guardar o leer esa llave en el Drive de la persona: después nunca vuelve a abrirse una ventana.
// Se sincroniza al abrir la app, a poco de cambiar el progreso, al volver a la pestaña, al recuperar la conexión y,
// al quedar oculta la pestaña, enseguida.

const DEBOUNCE_MS = 1500;
/** Para probar en la PC: EXPO_PUBLIC_SYNC_URL=http://localhost:8790 al compilar (como EXPO_PUBLIC_PUZZLES_URL). */
const BASE_URL = process.env.EXPO_PUBLIC_SYNC_URL || SYNC_URL;

const DriveSyncContext = createContext<DriveSyncValue | null>(null);

const storage = (): Storage | null => {
  try {
    return window.localStorage;
  } catch {
    return null; // algunos navegadores lanzan con solo tocar el almacenamiento
  }
};

export function DriveSyncProvider({ children }: { children: React.ReactNode }) {
  const { progress, loaded, getProgress, mergeRemote } = useProgress();
  const keyRef = useRef<string | null>(null);
  const [enabled, setEnabled] = useState(() => {
    const s = storage();
    keyRef.current = s ? readKey(s) : null;
    return keyRef.current !== null;
  });
  const [status, setStatus] = useState<DriveSyncState>(enabled ? 'idle' : 'off');

  const auth = useRef<ReturnType<typeof createGoogleAuth> | null>(null);
  auth.current ??= createGoogleAuth();

  const drive = useMemo(
    () => createDriveRestClient({ fetch: (...a) => window.fetch(...a), getToken: () => auth.current!.getToken(), fileName: KEY_FILE_NAME }),
    []
  );
  const server = useMemo(
    () => createServerClient({ fetch: (...a) => window.fetch(...a), baseUrl: BASE_URL, getKey: () => keyRef.current }),
    []
  );

  /**
   * Deja este dispositivo sin llave: no sincroniza más y no recuerda nada. Con `onlyIfStored` (la llave que usaba esta
   * pestaña) solo se borra el almacenamiento si sigue siendo esa: otra pestaña pudo haber guardado una nueva.
   */
  const forgetKey = useCallback((onlyIfStored?: string) => {
    keyRef.current = null;
    const s = storage();
    if (s) {
      if (onlyIfStored) clearKeyIf(s, onlyIfStored);
      else writeKey(s, null);
    }
    setEnabled(false);
  }, []);

  // Mientras `enable` arma el estado, lo que diga el motor sobre la llave vieja no debe borrarlo.
  const activating = useRef(false);

  const onStatus = useCallback(
    (s: SyncStatus) => {
      if (activating.current) return;
      // Sin llave (se desactivó mientras corría una sincronización) no se muestra el resultado.
      if (keyRef.current === null) return;
      if (s === 'revoked') forgetKey(keyRef.current); // se borraron los datos desde otro dispositivo: queda el aviso hasta activar de nuevo
      setStatus(s);
    },
    [forgetKey]
  );

  const engine = useMemo(
    () =>
      createSyncEngine({
        client: server,
        getLocal: getProgress,
        mergeIntoLocal: mergeRemote,
        onStatus,
        schedule: (fn, ms) => {
          const id = window.setTimeout(fn, ms);
          return () => window.clearTimeout(id);
        },
        debounceMs: DEBOUNCE_MS,
      }),
    [server, getProgress, mergeRemote, onStatus]
  );

  // Cada cambio del progreso pide una sincronización (el motor agrupa los pedidos seguidos).
  useEffect(() => {
    if (loaded && enabled) engine.requestSync();
  }, [progress, loaded, enabled, engine]);

  // Al volver a la pestaña o recuperar la conexión se pide una; al ocultarla o cerrarla se sincroniza sin esperar.
  useEffect(() => {
    if (!enabled) return;
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') void engine.flush();
      else engine.requestSync();
    };
    const onHide = () => void engine.flush();
    const onOnline = () => engine.requestSync();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onHide);
    window.addEventListener('online', onOnline);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onHide);
      window.removeEventListener('online', onOnline);
    };
  }, [enabled, engine]);

  // Con el script de Google ya bajado, la ventana se abre dentro del toque y el navegador no la bloquea.
  // Ajustes lo pide al mostrar la sección: quien no mira ahí no carga nada de Google.
  const prepare = useCallback(() => {
    void auth.current!.warm();
  }, []);

  const enable = useCallback(async () => {
    // Lo primero que pasa en el toque es abrir la ventana de Google: después de un await de red el navegador la bloquea.
    setStatus('off'); // un fallo anterior no queda pegado
    try {
      await auth.current!.signIn();
    } catch {
      throw new PopupError(); // ventana cerrada o bloqueada: no cambia nada; Ajustes avisa y se puede volver a intentar
    }
    let key: string;
    activating.current = true;
    try {
      // Antes de quedarse con la llave de Drive se comprueba con el servidor: si ya la dio por borrada (el borrado de
      // los datos llegó al servidor pero no a Drive) se crea una nueva en vez de caer siempre en «revocada».
      key = await resolveActiveKey(drive, async (k) => {
        keyRef.current = k;
        try {
          await server.read();
          return 'ok';
        } catch (e) {
          if (e instanceof SyncError && e.kind === 'revoked') return 'revoked';
          throw e;
        } finally {
          keyRef.current = null;
        }
      });
    } catch {
      activating.current = false;
      setStatus('error'); // Drive o servidor sin conexión, Drive lleno o sin permiso: no cambia nada más; el próximo intento lo limpia
      await auth.current!.revoke().catch(() => {});
      return;
    }
    const s = storage();
    if (s) writeKey(s, key);
    keyRef.current = key;
    setEnabled(true);
    setStatus('syncing');
    // El permiso de Drive ya no hace falta: con la llave se sincroniza sin volver a pedirle nada a Google.
    await auth.current!.revoke().catch(() => {});
    activating.current = false;
    engine.resume();
    await engine.syncNow();
  }, [drive, server, engine]);

  const disable = useCallback(async () => {
    forgetKey();
    setStatus('off');
  }, [forgetKey]);

  const deleteServerData = useCallback(async () => {
    // Igual que en `enable`: la ventana de Google primero, antes de cualquier espera de red.
    try {
      await auth.current!.signIn();
    } catch {
      throw new PopupError(); // ventana cerrada o bloqueada: no se borra nada y Ajustes avisa
    }
    try {
      // Si el servidor falla (por ejemplo sin conexión) no cambia nada y se puede repetir: el DELETE se puede repetir sin problema.
      await server.deleteProgress();
    } catch (e) {
      await auth.current!.revoke().catch(() => {});
      throw e;
    }
    // Desde acá el servidor ya no reconoce la llave. Si Drive falla, no se deja el estado a medias: este dispositivo
    // se queda sin llave, y al activar de nuevo `enable` ve que el servidor rechaza la de Drive y crea otra.
    try {
      await drive.remove();
    } catch {
      await auth.current!.revoke().catch(() => {});
      forgetKey();
      setStatus('off');
      throw new DriveKeyLeftError();
    }
    await auth.current!.revoke().catch(() => {});
    forgetKey();
    setStatus('off');
  }, [server, drive, forgetKey]);

  const value = useMemo<DriveSyncValue>(
    () => ({ supported: true, enabled, status, prepare, enable, disable, deleteServerData }),
    [enabled, status, prepare, enable, disable, deleteServerData]
  );
  return <DriveSyncContext.Provider value={value}>{children}</DriveSyncContext.Provider>;
}

export function useDriveSync(): DriveSyncValue {
  const value = useContext(DriveSyncContext);
  if (!value) throw new Error('useDriveSync debe usarse dentro de DriveSyncProvider');
  return value;
}
