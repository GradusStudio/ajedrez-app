import type { Language } from '../i18n/languages';
import { bots } from './bots';
import { openings } from './openings';
import { units } from './units';
import { buildContent, type Content, type LanguageFiles } from './translate';

// Contenido (unidades, aperturas y bots) en el idioma elegido. Sin imports de React Native.

const spanish: Content = { units, openings, bots };

/**
 * Archivos de texto de un idioma. Cada caso lleva su propio `require` estático (Metro lo empaqueta)
 * y solo se ejecuta si ese idioma se elige. Aún no hay traducciones: todo idioma da el español.
 * Para sumar uno: `case 'en': return require('./i18n/en') as LanguageFiles;`
 */
export function languageFiles(language: Language): LanguageFiles | undefined {
  switch (language) {
    default:
      return undefined;
  }
}

const cache = new Map<Language, Content>();

/** Contenido del idioma, con memoria. En español devuelve los mismos objetos originales. */
export function localizedContent(language: Language): Content {
  if (language === 'es') return spanish;
  let content = cache.get(language);
  if (!content) {
    content = buildContent(spanish, languageFiles(language));
    cache.set(language, content);
  }
  return content;
}
