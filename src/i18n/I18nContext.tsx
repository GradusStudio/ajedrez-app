import React, { createContext, useContext, useMemo } from 'react';
import { getLocales } from 'expo-localization';
import { useSettings } from '../settings/SettingsContext';
import { es, MessageKey } from './es';
import { format } from './format';
import { Language, resolveLanguage } from './languages';

export type { MessageKey };

type Values = Record<string, string | number>;
type I18n = { language: Language; t: (key: MessageKey, values?: Values) => string; number: (n: number) => string };

// Catálogos por idioma. Un texto que falte en un idioma se ve en español.
const catalogs: Partial<Record<Language, Partial<Record<MessageKey, string>>>> = { es };

function build(language: Language): I18n {
  const catalog = catalogs[language] ?? es;
  return {
    language,
    t: (key, values) => format(catalog[key] ?? es[key], values),
    number: (n) => n.toLocaleString(language),
  };
}

// Sin Provider (por ejemplo en pruebas) se usa el español.
const I18nContext = createContext<I18n>(build('es'));

/** Da el idioma elegido (Ajustes, o el del teléfono) y la función t() para los textos de pantallas. */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const value = useMemo(() => {
    let device: string | null = null;
    try {
      device = getLocales()[0]?.languageCode ?? null;
    } catch {}
    return build(resolveLanguage(settings.language, device));
  }, [settings.language]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
