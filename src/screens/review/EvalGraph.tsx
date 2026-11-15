import React from 'react';
import { Pressable } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { whiteShare } from '../../engine/evalFormat';
import { useI18n } from '../../i18n/I18nContext';
import type { Review } from '../../review/types';
import { boardHighlight } from '../../theme';
import { useBoardSide } from '../../components/BoardSizeContext';
import { badgeOf, QUALITY_STYLE } from './quality';
import { styles } from './reviewStyles';

const HEIGHT = 74;

type Props = {
  review: Review;
  idx: number;
  /** Con la revisión empezada se marca la jugada actual. */
  showCursor: boolean;
  onSelect: (ply: number) => void;
};

/** Gráfico de ventaja: el área blanca es la ventaja de las blancas. Tocarlo salta a esa jugada. */
export function EvalGraph({ review, idx, showCursor, onSelect }: Props) {
  const { t } = useI18n();
  const w = useBoardSide();
  const n = review.plies.length;
  const x = (i: number) => (n === 0 ? 0 : (i / n) * w);
  const y = (score: number) => HEIGHT - whiteShare(score) * HEIGHT;
  const area = `M0 ${HEIGHT} ` + review.scores.map((s, i) => `L${x(i).toFixed(1)} ${y(s).toFixed(1)}`).join(' ') + ` L${w} ${HEIGHT} Z`;

  const select = (i: number) => onSelect(Math.max(0, Math.min(n, Math.round(i))));

  return (
    <Pressable
      onPress={(e) => {
        // En la web, activar un Pressable con Enter llama a onPress con el evento de teclado, sin locationX.
        if (n === 0) return onSelect(0);
        const x = (e?.nativeEvent as { locationX?: unknown } | undefined)?.locationX;
        if (typeof x !== 'number' || !Number.isFinite(x) || w <= 0) return;
        select((x / w) * n);
      }}
      accessibilityRole="adjustable"
      accessibilityLabel={t('review.graph')}
      accessibilityValue={{ min: 0, max: n, now: Math.max(0, Math.min(n, idx)) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => select(idx + (e.nativeEvent.actionName === 'increment' ? 1 : -1))}
      style={[styles.graph, { width: w, height: HEIGHT }]}
    >
      <Svg width={w} height={HEIGHT} pointerEvents="none">
        <Path d={area} fill="#E9E9E9" />
        <Line x1={0} y1={HEIGHT / 2} x2={w} y2={HEIGHT / 2} stroke="#7A7773" strokeWidth={1} />
        {review.plies.map((p, i) => {
          const mark = p.great || p.quality === 'excellent' || p.quality === 'inaccuracy' || p.quality === 'mistake' || p.quality === 'blunder';
          const badge = badgeOf(p) ?? QUALITY_STYLE.best;
          return mark ? <Circle key={i} cx={x(i + 1)} cy={y(p.scoreAfter)} r={3.5} fill={badge.color} stroke="#262421" strokeWidth={1} /> : null;
        })}
        {showCursor && <Line x1={x(idx)} y1={0} x2={x(idx)} y2={HEIGHT} stroke={boardHighlight.markBorder} strokeWidth={3} />}
      </Svg>
    </Pressable>
  );
}
