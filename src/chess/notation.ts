// Notación de jugadas. Española: R rey, D dama, T torre, A alfil, C caballo (design.md).
// Inglesa: K, Q, R, B, N (la de chess.js y Lichess). Cada idioma tiene la suya (tabla PIECES).
// Ajustes > Notación ofrece «Automática» (la del idioma) e «Inglesa»; resolveNotation lo pasa a un idioma.
import { Language } from '../i18n/languages';

export type Notation = Language;

/** Letra de cada pieza (rey, dama, torre, alfil, caballo), en el orden de PIECE_ORDER. */
const PIECES: Record<Notation, string> = { es: 'RDTAC', en: 'KQRBN', de: 'KDTLS', it: 'RDTAC', fr: 'RDTFC' };
const PIECE_ORDER = 'KQRBN';

/** 'auto' sigue el idioma de la app; 'en' fuerza la inglesa. */
export function resolveNotation(setting: 'auto' | 'en', language: Language): Notation {
  return setting === 'en' ? 'en' : language;
}

/** Cambia las letras de pieza de `san`: `from` y `to` son tablas de PIECES. `all`: en todo el texto o solo al principio y en la coronación. */
function convert(san: string, from: string, to: string, all: boolean): string {
  const map = (c: string) => to[from.indexOf(c)];
  if (all) return san.replace(new RegExp(`[${from}]`, 'g'), map);
  // En español "R" es el rey y "a"-"h" son columnas: solo la letra de pieza del principio y la de coronación.
  return san.replace(new RegExp(`^[${from}]`), map).replace(new RegExp(`=([${from}])`), (_, c) => '=' + map(c));
}

/** Convierte una jugada SAN de chess.js (inglés) a español: "Nf3" → "Cf3". */
export function toSpanishSan(san: string): string {
  return convert(san, PIECES.en, PIECES.es, true);
}

/** Convierte una jugada SAN en español a inglés: "Cf3" → "Nf3", "e8=D" → "e8=Q". */
export function toEnglishSan(san: string): string {
  return convert(san, PIECES.es, PIECES.en, false);
}

/** Jugada SAN de chess.js (inglés) en la notación elegida. */
export function sanFromEnglish(san: string, notation: Notation): string {
  return notation === 'en' ? san : convert(san, PIECE_ORDER, PIECES[notation], true);
}

/** Jugada SAN escrita en español (los datos de las lecciones) en la notación elegida. */
export function sanFromSpanish(san: string, notation: Notation): string {
  return notation === 'es' ? san : convert(san, PIECES.es, PIECES[notation], false);
}

/**
 * Jugadas numeradas: "1. e4 e5 2. Cf3 Cc6". `sans` en inglés (chess.js).
 * Con `last`, muestra solo las últimas N jugadas completas.
 */
export function movesText(sans: string[], last?: number, notation: Notation = 'es'): string {
  if (sans.length === 0) return 'Aún no hay jugadas';
  const s = (x: string) => sanFromEnglish(x, notation);
  const parts: string[] = [];
  for (let i = 0; i < sans.length; i += 2) {
    parts.push(`${i / 2 + 1}. ${s(sans[i])}${sans[i + 1] ? ' ' + s(sans[i + 1]) : ''}`);
  }
  if (!last || parts.length <= last) return parts.join('   ');
  return '… ' + parts.slice(-last).join('   ');
}
