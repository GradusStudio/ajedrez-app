import { formatScore, isMate } from '../engine/evalFormat';
import type { Bot } from '../data/bots';
import type { MessageKey } from '../i18n/I18nContext';
import { badgeOf, catOf, qualityColor, qualityNameKey, QUALITY_TEXT_LIGHT, type Badge } from './quality';
import { moveNumber, plyLabel } from './bestLine';
import { coachLang } from './coachText';
import { coachTake } from './coachTake';
import type { Review, ReviewPly } from './types';

/** Una fila de «Momentos clave» del resumen, ya con los textos traducidos. Módulo puro: sin React Native. */
export type SummaryMoment = {
  /** Índice en `review.plies` (0 = primera jugada). */
  index: number;
  /** La jugada con su número («6.Ac4», «1...e5»), como en el prototipo. */
  label: string;
  badge: Badge | null;
  color: string;
  /** Variante clara del color, para texto pequeño sobre la tarjeta oscura. */
  textColor: string;
  quality: string;
  text: string;
  /** Diferencia desde quien jugó («+1,7», «−M», «±M»). */
  diff: string;
  aria: string;
};

type Translate = (key: MessageKey, values?: Record<string, string | number>) => string;

type Options = {
  /** Idioma de la app (es, en, de, it, fr). */
  language: string;
  fmt: (san: string) => string;
  decimal: string;
  t: Translate;
};

/**
 * Diferencia de una jugada en la perspectiva de quien la jugó, que es la de su calidad. Usa el par profundo con el
 * que se calificó la jugada cuando existe, para no mezclarlo con la línea superficial del gráfico.
 */
export function momentDiff(p: ReviewPly, review: Review, decimal: string): string {
  const before = p.ratedBefore ?? review.scores[p.ply - 1];
  const after = p.ratedAfter ?? p.scoreAfter;
  const side = p.move.color === 'w' ? 1 : -1;
  // El mate se detecta por la jugada o por las evaluaciones, no por la diferencia (un mate en 1 apenas cambia el número).
  if (p.move.san.endsWith('#')) return side > 0 ? '+M' : '−M';
  if (isMate(after)) {
    // Una jugada que permite mate es negativa para quien la jugó, aunque la evaluación sea del otro lado.
    const mateSide = after > 0 ? 1 : -1;
    return side * mateSide > 0 ? '+M' : '−M';
  }
  if (isMate(before)) return '±M';
  return formatScore(side * (after - before), decimal);
}

/** La primera oración de un párrafo, para la fila; si no hay punto, el párrafo entero. */
export function firstSentence(text: string): string {
  const m = text.match(/^[^.]+\./);
  return m ? m[0] : text;
}

/**
 * Hasta 5 momentos clave del resumen: jugada, calidad (con el mate como tal), primera frase del comentarista,
 * diferencia desde quien jugó y etiqueta accesible con el número de jugada leído del FEN.
 */
export function summaryMoments(review: Review, me: 'w' | 'b' | null, coach: Bot, o: Options): SummaryMoment[] {
  const lang = coachLang(o.language);
  return review.highlights.slice(0, 5).map((index) => {
    const p = review.plies[index];
    const san = o.fmt(p.move.san);
    const subject = me && p.move.color === me ? 'you' : 'opponent';
    const { voice, details } = coachTake({ ply: p, coach, lang, subject, san, fmt: o.fmt });
    const text = firstSentence(details[0] ?? voice) || san;
    const quality = o.t(qualityNameKey(p));
    const n = moveNumber(p.move.fenBefore);
    const label = plyLabel(p.move, o.fmt);
    const aria = o.t('review.momentLabel', {
      n,
      color: o.t(p.move.color === 'w' ? 'common.white' : 'common.black'),
      move: san,
      quality,
      text,
    });
    return {
      index,
      label,
      badge: badgeOf(p),
      color: qualityColor(p),
      textColor: QUALITY_TEXT_LIGHT[catOf(p)],
      quality,
      text,
      diff: momentDiff(p, review, o.decimal),
      aria,
    };
  });
}
