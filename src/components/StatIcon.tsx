import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme';

type Props = { name: 'streak' | 'xp'; size?: number; color?: string };

// Íconos de racha (llama) y XP (rayo), en `gold` (mapa-de-pantallas.md, sección 6).
export function StatIcon({ name, size = 18, color = colors.gold }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'streak' ? (
        <Path
          d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-6 1-9.5Z"
          fill={color}
        />
      ) : (
        <Path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" fill={color} />
      )}
    </Svg>
  );
}
