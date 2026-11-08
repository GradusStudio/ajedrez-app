import { DRIVE_SCOPE, GOOGLE_CLIENT_ID } from './googleConfig';
import { DriveError } from './syncEngine';

// Permiso de Google para la web, con Google Identity Services (modelo de token). El script de Google se baja
// solo cuando hace falta (al activar la sincronización o al abrir la app con ella ya activada), y el permiso
// vive solo en memoria: nunca se guarda en localStorage ni en ningún otro lado. Dura una hora.

type TokenResponse = { access_token?: string; expires_in?: number; scope?: string; error?: string };
type TokenClient = { requestAccessToken: (overrides?: { prompt?: string }) => void };
type Gis = {
  accounts: {
    oauth2: {
      initTokenClient: (cfg: {
        client_id: string;
        scope: string;
        prompt?: string;
        callback: (r: TokenResponse) => void;
        error_callback?: (e: { type?: string }) => void;
      }) => TokenClient;
      revoke: (token: string, done?: () => void) => void;
    };
  };
};

const GIS_SRC = 'https://accounts.google.com/gsi/client';
const SAFETY_MS = 60_000;

let loading: Promise<Gis> | null = null;

function loadGis(): Promise<Gis> {
  const ready = (window as unknown as { google?: Gis }).google;
  if (ready?.accounts?.oauth2) return Promise.resolve(ready);
  loading ??= new Promise<Gis>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.onload = () => resolve((window as unknown as { google: Gis }).google);
    // Sin red (o bloqueado): se puede volver a intentar más tarde.
    script.onerror = () => {
      loading = null;
      script.remove();
      reject(new DriveError('offline'));
    };
    document.head.appendChild(script);
  });
  return loading;
}

export function createGoogleAuth() {
  let token: { value: string; expiresAt: number } | null = null;

  const hasToken = () => !!token && Date.now() < token.expiresAt - SAFETY_MS;

  /**
   * Pide el permiso a Google. Abre su ventana, así que solo se llama desde un toque de la persona.
   * `prompt` queda en '' (Google decide): si ya se dio el permiso y hay una sola sesión, devuelve el token y la ventana
   * se cierra sola; si no, muestra el ingreso o el permiso. Con 'none' (probado el 8-11-2026) Google cierra la ventana
   * sin devolver nada (`popup_closed`), así que no sirve para renovar.
   */
  async function request(): Promise<void> {
    const gis = await loadGis();
    await new Promise<void>((resolve, reject) => {
      const client = gis.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: DRIVE_SCOPE,
        prompt: '',
        callback: (r) => {
          // La persona puede aceptar el ingreso pero no marcar el permiso de Drive.
          if (!r.access_token || r.error || !(r.scope ?? '').split(' ').includes(DRIVE_SCOPE)) {
            console.warn('[gradus-sync] Google no dio el permiso', { error: r.error, scope: r.scope, token: !!r.access_token });
            return reject(new DriveError('auth'));
          }
          token = { value: r.access_token, expiresAt: Date.now() + (r.expires_in ?? 3600) * 1000 };
          resolve();
        },
        // Ventana cerrada, bloqueada por el navegador o sin sesión de Google.
        error_callback: (e) => {
          console.warn('[gradus-sync] la ventana de Google fallo', { type: e?.type });
          reject(new DriveError('auth'));
        },
      });
      client.requestAccessToken();
    });
  }

  return {
    hasToken,
    /** Para el cliente de Drive: el permiso vigente o `auth` si venció o no hay. */
    async getToken(): Promise<string> {
      if (token && hasToken()) return token.value;
      throw new DriveError('auth');
    },
    /** Con un toque de la persona: para activar, reconectar o renovar (si ya lo dio, la ventana se cierra sola). */
    signIn: request,
    /** Baja el script de Google por adelantado, para que la ventana se abra a tiempo dentro del toque. */
    warm: () => loadGis().then(() => undefined, () => undefined),
    /** Quita el permiso en Google y olvida el que había en memoria. */
    async revoke(): Promise<void> {
      const old = token?.value;
      token = null;
      if (!old) return;
      try {
        const gis = await loadGis();
        await new Promise<void>((resolve) => gis.accounts.oauth2.revoke(old, resolve));
      } catch {
        // Sin red no se puede avisar a Google: el permiso vence solo en una hora.
      }
    },
  };
}
