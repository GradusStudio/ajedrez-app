// Mezcla lo guardado con los valores por defecto. Módulo puro (sin React Native) para poder probarlo.
import { Language } from '../i18n/languages';
import { BoardThemeId, boardThemes } from '../theme';

export type Settings = {
  sound: boolean;
  vibration: boolean;
  /** Idioma de la app: 'auto' sigue el del teléfono. */
  language: 'auto' | Language;
  /** Notación de las jugadas: 'auto' sigue el idioma; 'en' fuerza la inglesa. */
  notation: 'auto' | 'en';
  boardTheme: BoardThemeId;
  /** Recordatorio diario: hora local (0-23). */
  reminder: { enabled: boolean; hour: number };
  /** Ya se ofreció el recordatorio al terminar una lección (no se vuelve a ofrecer). */
  reminderOffered: boolean;
  /** Ya se mostró la tarjeta de instalar Gradus al terminar una lección (web; no se repite). */
  installOffered: boolean;
};

export const defaultSettings: Settings = {
  sound: true,
  vibration: true,
  language: 'auto',
  notation: 'auto',
  boardTheme: 'verde',
  reminder: { enabled: false, hour: 19 },
  reminderOffered: false,
  installOffered: false,
};

const LANGUAGES = ['auto', 'es', 'en', 'de', 'it', 'fr'];

/** Mezcla lo guardado con los valores por defecto (por si se agregan ajustes nuevos). */
export function sanitizeSettings(raw: Partial<Settings>): Settings {
  const s = { ...defaultSettings, ...raw, reminder: { ...defaultSettings.reminder, ...raw.reminder } };
  if (!(s.boardTheme in boardThemes)) s.boardTheme = defaultSettings.boardTheme;
  // Un 'es' guardado (ajuste viejo) no se distingue de no haber tocado nada: pasa a 'auto'.
  if (s.notation !== 'en') s.notation = 'auto';
  if (!LANGUAGES.includes(s.language)) s.language = 'auto';
  return s;
}
