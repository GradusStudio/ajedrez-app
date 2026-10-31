// Español: es la referencia. Define las claves; los demás idiomas tienen el mismo tipo.
export const es = {
  'settings.language': 'Idioma',
  'settings.language.auto': 'Automático',
  'settings.notation': 'Notación de las jugadas',
  'settings.notation.auto': 'Automática',
  'settings.notation.english': 'Inglesa',
} as const;

export type MessageKey = keyof typeof es;
