import type { SyncStatus } from './syncEngine';

/** Lo que ve la pantalla de Ajustes de la sincronización con Google Drive. `off`: no está activada. */
export type DriveSyncState = SyncStatus | 'off';

export type DriveSyncValue = {
  /** Solo la web sincroniza (en el celular no hay Drive: ver el diseño de la versión web). */
  supported: boolean;
  enabled: boolean;
  status: DriveSyncState;
  /** Con un toque de la persona: pide el permiso a Google y empieza a sincronizar. */
  enable: () => Promise<void>;
  /** Vuelve a pedir el permiso cuando venció. */
  reconnect: () => Promise<void>;
  /** Deja de sincronizar y quita el permiso. El progreso del dispositivo queda. */
  disable: () => Promise<void>;
};

export const NOT_SUPPORTED: DriveSyncValue = {
  supported: false,
  enabled: false,
  status: 'off',
  enable: async () => {},
  reconnect: async () => {},
  disable: async () => {},
};
