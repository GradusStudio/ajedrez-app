import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

/** Candado chico para las lecciones y unidades cerradas. */
export function LockIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M7 10V7a5 5 0 0 1 10 0v3" stroke={color} strokeWidth={2.2} fill="none" strokeLinecap="round" />
      <Rect x={4} y={10} width={16} height={11} rx={2.5} fill={color} />
    </Svg>
  );
}
