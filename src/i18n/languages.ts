// Idiomas de la app. Módulo puro (sin React Native) para poder probarlo con npm test.

export type Language = 'es' | 'en' | 'de' | 'it' | 'fr';

/** Idiomas completos: solo estos aparecen en Ajustes y en la elección automática. */
export const AVAILABLE_LANGUAGES: Language[] = ['es', 'en'];

/** Cada idioma escrito en su propio idioma. */
export const LANGUAGE_NAMES: Record<Language, string> = {
  es: 'Español',
  en: 'English',
  de: 'Deutsch',
  it: 'Italiano',
  fr: 'Français',
};

/**
 * Idioma que se usa. `deviceLanguage` es el código del teléfono ("de-AT", "pt"), o null si no se conoce.
 * Si el idioma pedido no está disponible, se usa inglés, o español si tampoco hay inglés.
 */
export function resolveLanguage(
  setting: 'auto' | Language,
  deviceLanguage: string | null,
  available: Language[] = AVAILABLE_LANGUAGES
): Language {
  const fallback: Language = available.includes('en') ? 'en' : 'es';
  const wanted = setting === 'auto' ? (deviceLanguage ?? '').toLowerCase().split(/[-_]/)[0] : setting;
  return (available as string[]).includes(wanted) ? (wanted as Language) : fallback;
}
