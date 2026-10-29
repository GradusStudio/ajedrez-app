// Notación de jugadas. Española: R rey, D dama, T torre, A alfil, C caballo (design.md).
// Inglesa: K, Q, R, B, N (la de chess.js y Lichess). Se elige en Ajustes > Notación.

export type Notation = 'es' | 'en';

const EN_TO_ES: Record<string, string> = { N: 'C', B: 'A', R: 'T', Q: 'D', K: 'R' };
const ES_TO_EN: Record<string, string> = { C: 'N', A: 'B', T: 'R', D: 'Q', R: 'K' };

/** Convierte una jugada SAN de chess.js (inglés) a español: "Nf3" → "Cf3". */
export function toSpanishSan(san: string): string {
  return san.replace(/[NBRQK]/g, (c) => EN_TO_ES[c] ?? c);
}

/** Convierte una jugada SAN en español a inglés: "Cf3" → "Nf3", "e8=D" → "e8=Q". */
export function toEnglishSan(san: string): string {
  // Solo la letra de pieza del principio y la de coronación: en español "R" es el rey, y "a"-"h" son columnas.
  return san.replace(/^[CATDR]/, (c) => ES_TO_EN[c]).replace(/=([CATDR])/, (_, c) => '=' + ES_TO_EN[c]);
}

/** Jugada SAN de chess.js (inglés) en la notación elegida. */
export function sanFromEnglish(san: string, notation: Notation): string {
  return notation === 'es' ? toSpanishSan(san) : san;
}

/** Jugada SAN escrita en español (los datos de las lecciones) en la notación elegida. */
export function sanFromSpanish(san: string, notation: Notation): string {
  return notation === 'es' ? san : toEnglishSan(san);
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
