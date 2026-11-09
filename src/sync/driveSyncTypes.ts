import type { SyncStatus } from './syncEngine';

/** Lo que ve la pantalla de Ajustes de la sincronización. `off`: no está activada. */
export type DriveSyncState = SyncStatus | 'off';

export type DriveSyncValue = {
  /** Solo la web sincroniza (en el celular no hay sincronización: ver el diseño de la versión web). */
  supported: boolean;
  enabled: boolean;
  status: DriveSyncState;
  /** Baja por adelantado el script de Google (solo si la persona está en Ajustes y no activó): así la ventana se abre dentro del toque. Sin esto la web no le pide nada a Google. */
  prepare: () => void;
  /** Con un toque de la persona: Google pide el permiso (la única ventana), se obtiene la llave y empieza a sincronizar. Lanza `PopupError` si la ventana no se abrió. */
  enable: () => Promise<void>;
  /** Este dispositivo deja de sincronizar y olvida la llave. El progreso del dispositivo y el del servidor quedan. */
  disable: () => Promise<void>;
  /** Con un toque, después de confirmar: borra el progreso del servidor y la llave de Drive. Si no se pudo, lanza (`PopupError` si la ventana no se abrió) y no cambia nada. */
  deleteServerData: () => Promise<void>;
};

/** El servidor ya borró los datos pero la llave de Drive no se pudo quitar: este dispositivo quedó sin llave y al activar de nuevo se crea una nueva. */
export class DriveKeyLeftError extends Error {
  constructor() {
    super('Drive: no se pudo quitar la llave');
    this.name = 'DriveKeyLeftError';
  }
}

export const NOT_SUPPORTED: DriveSyncValue = {
  supported: false,
  enabled: false,
  status: 'off',
  prepare: () => {},
  enable: async () => {},
  disable: async () => {},
  deleteServerData: async () => {},
};
