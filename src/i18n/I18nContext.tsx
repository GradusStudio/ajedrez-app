import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { getLocales } from 'expo-localization';
import { useSettings } from '../settings/SettingsContext';
import { de } from './de';
import { en } from './en';
import { es, MessageKey, PluralKey } from './es';
import { format } from './format';
import { Language, resolveLanguage } from './languages';
import { pluralCategory } from './plural';

export type { MessageKey, PluralKey };

type Values = Record<string, string | number>;
type I18n = {
  language: Language;
  t: (key: MessageKey, values?: Values) => string;
  /** Texto con plural: usa la clave `<base>.one` o `<base>.other` según `n`, y `{n}` vale `n`. */
  tn: (base: PluralKey, n: number, values?: Values) => string;
  number: (n: number) => string;
};

// Catálogos por idioma. Cada uno tiene que traer todas las claves de es.ts (lo exige TypeScript).
const catalogs: Partial<Record<Language, Record<MessageKey, string>>> = { es, en, de };

function build(language: Language): I18n {
  const catalog = catalogs[language] ?? es;
  const t: I18n['t'] = (key, values) => format(catalog[key] ?? es[key], values);
  return {
    language,
    t,
    tn: (base, n, values) => t(`${base}.${pluralCategory(language, n)}` as MessageKey, { n, ...values }),
    number: (n) => n.toLocaleString(language),
  };
}

// Sin Provider (por ejemplo en pruebas) se usa el español.
const I18nContext = createContext<I18n>(build('es'));

function readDeviceLanguage(): string | null {
  try {
    return getLocales()[0]?.languageCode ?? null;
  } catch {
    return null;
  }
}

/** Da el idioma elegido (Ajustes, o el del teléfono) y la función t() para los textos de pantallas. */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  // El idioma del teléfono puede cambiar con la app abierta: se vuelve a leer al volver a primer plano.
  const [device, setDevice] = useState<string | null>(readDeviceLanguage);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setDevice(readDeviceLanguage());
    });
    return () => sub.remove();
  }, []);
  const value = useMemo(() => build(resolveLanguage(settings.language, device)), [settings.language, device]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
