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

const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const bool = (x: unknown, fallback: boolean) => (typeof x === 'boolean' ? x : fallback);

/** Mezcla lo guardado con los valores por defecto (por si se agregan ajustes nuevos) y descarta lo que no tiene la forma esperada. */
export function sanitizeSettings(raw: Partial<Settings>): Settings {
  const r: Record<string, unknown> = isObject(raw) ? raw : {};
  const rr: Record<string, unknown> = isObject(r.reminder) ? r.reminder : {};
  const d = defaultSettings;
  const s: Settings = {
    ...d,
    ...(r as Partial<Settings>),
    sound: bool(r.sound, d.sound),
    vibration: bool(r.vibration, d.vibration),
    reminderOffered: bool(r.reminderOffered, d.reminderOffered),
    installOffered: bool(r.installOffered, d.installOffered),
    reminder: {
      enabled: bool(rr.enabled, d.reminder.enabled),
      hour: Number.isInteger(rr.hour) && (rr.hour as number) >= 0 && (rr.hour as number) <= 23 ? (rr.hour as number) : d.reminder.hour,
    },
  };
  // hasOwn: con el operador `in`, claves heredadas como 'constructor' o 'toString' pasarían por temas válidos.
  if (typeof s.boardTheme !== 'string' || !Object.hasOwn(boardThemes, s.boardTheme)) s.boardTheme = d.boardTheme;
  // Un 'es' guardado (ajuste viejo) no se distingue de no haber tocado nada: pasa a 'auto'.
  if (s.notation !== 'en') s.notation = 'auto';
  if (!LANGUAGES.includes(s.language)) s.language = 'auto';
  return s;
}
