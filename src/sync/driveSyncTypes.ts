import type { SyncStatus } from './syncEngine';

/** Lo que ve la pantalla de Ajustes de la sincronización. `off`: no está activada. */
export type DriveSyncState = SyncStatus | 'off';

export type DriveSyncValue = {
  /** Solo la web sincroniza (en el celular no hay sincronización: ver el diseño de la versión web). */
  supported: boolean;
  enabled: boolean;
  status: DriveSyncState;
  /** Con un toque de la persona: Google pide el permiso (la única ventana), se obtiene la llave y empieza a sincronizar. Lanza `PopupError` si la ventana no se abrió. */
  enable: () => Promise<void>;
  /** Este dispositivo deja de sincronizar y olvida la llave. El progreso del dispositivo y el del servidor quedan. */
  disable: () => Promise<void>;
  /** Con un toque, después de confirmar: borra el progreso del servidor y la llave de Drive. Si no se pudo, lanza (`PopupError` si la ventana no se abrió) y no cambia nada. */
  deleteServerData: () => Promise<void>;
};

export const NOT_SUPPORTED: DriveSyncValue = {
  supported: false,
  enabled: false,
  status: 'off',
  enable: async () => {},
  disable: async () => {},
  deleteServerData: async () => {},
};
