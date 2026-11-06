import type { BotExpression } from '../../components/botFace';
import type { MessageKey } from '../../i18n/I18nContext';
import type { MoveQuality, ReviewPly } from '../../review/types';

export type StyleKey = MoveQuality | 'great' | 'mate';
export type Badge = { label: string; color: string };

/** Una sola tabla para la insignia del tablero, la lista de jugadas, el gráfico y el resumen. */
export const QUALITY_STYLE: Record<StyleKey, Badge> = {
  great: { label: '!', color: '#4FA3E0' },
  best: { label: '★', color: '#81B64C' },
  excellent: { label: '!', color: '#96BC4B' },
  good: { label: '✓', color: '#7A9E5A' },
  book: { label: '≡', color: '#A88865' },
  inaccuracy: { label: '?!', color: '#F7C631' },
  mistake: { label: '?', color: '#E8912D' },
  blunder: { label: '??', color: '#FA412D' },
  mate: { label: '#', color: '#81B64C' },
};

/** Filas del resumen (como chess.com: Genial, Mejor, Excelente…). `great` pesa más que la calidad. */
export const CATS = ['great', 'best', 'excellent', 'good', 'book', 'inaccuracy', 'mistake', 'blunder'] as const;
export type Cat = (typeof CATS)[number];

export const REPLY_ARROW = 'rgba(250, 65, 45, 0.85)';
export const BEST_ARROW = 'rgba(129, 182, 76, 0.95)';

const styleKeyOf = (p: ReviewPly): StyleKey => (p.move.san.endsWith('#') ? 'mate' : p.great ? 'great' : p.quality);

/** Insignia sobre la casilla y en la lista. `good` no lleva. */
export const badgeOf = (p: ReviewPly): Badge | null => {
  const key = styleKeyOf(p);
  return key === 'good' ? null : QUALITY_STYLE[key];
};

export const titleKey = (p: ReviewPly): MessageKey => `review.q.${styleKeyOf(p)}` as MessageKey;

export const countCats = (plies: ReviewPly[], color: 'w' | 'b'): Record<Cat, number> => {
  const r: Record<Cat, number> = { great: 0, best: 0, excellent: 0, good: 0, book: 0, inaccuracy: 0, mistake: 0, blunder: 0 };
  for (const p of plies) if (p.move.color === color) r[p.great ? 'great' : p.quality]++;
  return r;
};

export const faceFor = (p: ReviewPly | undefined, mine: boolean): BotExpression => {
  if (!p) return 'explica';
  if (p.quality === 'blunder' || p.quality === 'mistake') return mine ? 'pista' : 'acierto';
  if (p.quality === 'inaccuracy') return 'piensa';
  return mine ? 'acierto' : 'explica';
};

/** "+0,9", "−2,3", "M3": igual que la barra. */
export function evalLabel(score: number, decimal: string): string {
  if (Math.abs(score) >= 9000) return `${score > 0 ? '' : '−'}M${10000 - Math.abs(score)}`;
  const p = (Math.abs(score) / 100).toFixed(1).replace('.', decimal);
  return score > 0 ? `+${p}` : score < 0 ? `−${p}` : `0${decimal}0`;
}
