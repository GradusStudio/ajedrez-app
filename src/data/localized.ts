import type { Language } from '../i18n/languages';
import { bots } from './bots';
import { openings } from './openings';
import { units } from './units';
import { buildContent, type Content, type LanguageFiles } from './translate';

// Contenido (unidades, aperturas y bots) en el idioma elegido. Sin imports de React Native.

const spanish: Content = { units, openings, bots };

/**
 * Archivos de texto de un idioma, con import dinámico. Metro los separa del trozo común y solo se
 * descargan cuando se elige ese idioma (las aperturas traducidas son lo que más pesa).
 * Un idioma sin archivos da el español.
 */
export async function languageFiles(language: Language): Promise<LanguageFiles | undefined> {
  switch (language) {
    case 'en':
      return (await import('./i18n/en')).files;
    case 'de':
      return (await import('./i18n/de')).files;
    case 'it':
      return (await import('./i18n/it')).files;
    case 'fr':
      return (await import('./i18n/fr')).files;
    default:
      return undefined;
  }
}

const cache = new Map<Language, Content>();
const listeners = new Set<() => void>();

/** useSyncExternalStore: avisa cuando llega el contenido de un idioma. */
export function subscribeLocalized(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Contenido ya cargado del idioma; si todavía no llegó, el español. */
export function localizedContent(language: Language): Content {
  if (language === 'es') return spanish;
  return cache.get(language) ?? spanish;
}

/** Carga (una vez) el contenido del idioma. Los idiomas ya cargados salen de la memoria. */
export async function loadLocalizedContent(language: Language): Promise<Content> {
  if (language === 'es') return spanish;
  const cached = cache.get(language);
  if (cached) return cached;
  const files = await languageFiles(language);
  const content = files ? buildContent(spanish, files) : spanish;
  cache.set(language, content);
  listeners.forEach((listener) => listener());
  return content;
}
