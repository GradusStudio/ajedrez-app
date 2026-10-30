import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../theme';

type Props = { name: 'streak' | 'coin'; size?: number; color?: string };

// Borde y brillo de la moneda, sobre el dorado de `gold`.
const COIN_EDGE = '#B8901C';

// Íconos de racha (llama) y monedas, en `gold` (mapa-de-pantallas.md, sección 6).
export function StatIcon({ name, size = 18, color = colors.gold }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'streak' ? (
        <Path
          d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-6 1-9.5Z"
          fill={color}
        />
      ) : (
        <>
          <Circle cx={12} cy={12} r={10} fill={color} />
          <Circle cx={12} cy={12} r={7} fill="none" stroke={COIN_EDGE} strokeWidth={1.8} />
          <Path d="M10 8.5h4M12 8.5v7M10 15.5h4" stroke={COIN_EDGE} strokeWidth={1.8} strokeLinecap="round" />
        </>
      )}
    </Svg>
  );
}
