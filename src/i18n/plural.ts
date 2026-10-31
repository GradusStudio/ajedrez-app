import type { Language } from './languages';

/** Forma de plural que toca para `n` en cada idioma: en francés el 0 y el 1 van en singular. */
export function pluralCategory(language: Language, n: number): 'one' | 'other' {
  if (language === 'fr') return n >= 0 && n < 2 ? 'one' : 'other';
  return n === 1 ? 'one' : 'other';
}
