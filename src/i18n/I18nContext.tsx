import React, { createContext, useContext, useMemo } from 'react';
import { getLocales } from 'expo-localization';
import { useSettings } from '../settings/SettingsContext';
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

// Catálogos por idioma. Un texto que falte en un idioma se ve en español.
const catalogs: Partial<Record<Language, Partial<Record<MessageKey, string>>>> = { es };

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
