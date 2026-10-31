import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { defaultSettings, sanitizeSettings, Settings } from './sanitize';

// Ajustes del usuario (Perfil > Ajustes). Se guardan aparte del progreso: borrar el progreso no los borra.
// El tipo y la mezcla con los valores por defecto viven en sanitize.ts (módulo puro, con pruebas).
export type { Settings };
export { defaultSettings };

const STORAGE_KEY = '@ajedrez/settings';

type Ctx = { settings: Settings; update: (patch: Partial<Settings>) => void; loaded: boolean };

// Sin Provider (por ejemplo en pruebas) se usan los valores por defecto.
const SettingsContext = createContext<Ctx>({ settings: defaultSettings, update: () => {}, loaded: true });

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v) setSettings(sanitizeSettings(JSON.parse(v)));
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
