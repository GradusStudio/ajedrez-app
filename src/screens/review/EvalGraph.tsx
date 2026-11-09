import React from 'react';
import { Pressable, useWindowDimensions } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { whiteShare } from '../../engine/evalFormat';
import { useI18n } from '../../i18n/I18nContext';
import type { Review } from '../../review/types';
import { boardHighlight } from '../../theme';
import { boardPixels } from '../../components/boardSize';
import { badgeOf, QUALITY_STYLE } from './quality';
import { styles } from './reviewStyles';

const HEIGHT = 64;

type Props = {
  review: Review;
  idx: number;
  /** Con la revisión empezada se marca la jugada actual. */
  showCursor: boolean;
  onSelect: (ply: number) => void;
  /** Ancho en px; si no se indica, el del tablero en el celular. */
  width?: number;
};

/** Gráfico de ventaja: el área blanca es la ventaja de las blancas. Tocarlo salta a esa jugada. */
export function EvalGraph({ review, idx, showCursor, onSelect, width: fixedWidth }: Props) {
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const w = fixedWidth ?? boardPixels(width);
  const n = review.plies.length;
  const x = (i: number) => (n === 0 ? 0 : (i / n) * w);
  const y = (score: number) => HEIGHT - whiteShare(score) * HEIGHT;
  const area = `M0 ${HEIGHT} ` + review.scores.map((s, i) => `L${x(i).toFixed(1)} ${y(s).toFixed(1)}`).join(' ') + ` L${w} ${HEIGHT} Z`;

  return (
    <Pressable
      onPress={(e) => onSelect(n === 0 ? 0 : Math.round((e.nativeEvent.locationX / w) * n))}
      accessibilityRole="adjustable"
      accessibilityLabel={t('review.graph')}
      style={[styles.graph, { width: w, height: HEIGHT }]}
    >
      <Svg width={w} height={HEIGHT} pointerEvents="none">
        <Path d={area} fill="#E9E9E9" />
        <Line x1={0} y1={HEIGHT / 2} x2={w} y2={HEIGHT / 2} stroke="#7A7773" strokeWidth={1} />
        {review.plies.map((p, i) =>
          p.highlight ? (
            <Circle key={i} cx={x(i + 1)} cy={y(p.scoreAfter)} r={3.5} fill={(badgeOf(p) ?? QUALITY_STYLE.best).color} stroke="#262421" strokeWidth={1} />
          ) : null
        )}
        {showCursor && <Line x1={x(idx)} y1={0} x2={x(idx)} y2={HEIGHT} stroke={boardHighlight.markBorder} strokeWidth={2} />}
      </Svg>
    </Pressable>
  );
}
