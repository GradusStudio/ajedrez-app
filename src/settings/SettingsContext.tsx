import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BoardThemeId, boardThemes } from '../theme';

// Ajustes del usuario (Perfil > Ajustes). Se guardan aparte del progreso: borrar el progreso no los borra.
export type Settings = {
  sound: boolean;
  vibration: boolean;
  notation: 'es' | 'en';
  boardTheme: BoardThemeId;
  /** Recordatorio diario: hora local (0-23). */
  reminder: { enabled: boolean; hour: number };
  /** Ya se ofreció el recordatorio al terminar una lección (no se vuelve a ofrecer). */
  reminderOffered: boolean;
};

export const defaultSettings: Settings = {
  sound: true,
  vibration: true,
  notation: 'es',
  boardTheme: 'verde',
  reminder: { enabled: false, hour: 19 },
  reminderOffered: false,
};

const STORAGE_KEY = '@ajedrez/settings';

type Ctx = { settings: Settings; update: (patch: Partial<Settings>) => void; loaded: boolean };

// Sin Provider (por ejemplo en pruebas) se usan los valores por defecto.
const SettingsContext = createContext<Ctx>({ settings: defaultSettings, update: () => {}, loaded: true });

/** Mezcla lo guardado con los valores por defecto (por si se agregan ajustes nuevos). */
function sanitize(raw: Partial<Settings>): Settings {
  const s = { ...defaultSettings, ...raw, reminder: { ...defaultSettings.reminder, ...raw.reminder } };
  if (!(s.boardTheme in boardThemes)) s.boardTheme = defaultSettings.boardTheme;
  return s;
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v) setSettings(sanitize(JSON.parse(v)));
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo(() => ({ settings, update, loaded }), [settings, update, loaded]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
