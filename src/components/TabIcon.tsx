import React from 'react';
import { ColorValue } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type TabIconName = 'learn' | 'openings' | 'puzzles' | 'bots' | 'analysis' | 'profile';

type Props = { name: TabIconName; color: ColorValue; size?: number };

// Íconos propios de la barra de pestañas (evita sumar una librería de íconos).
export function TabIcon({ name, color, size = 24 }: Props) {
  const line = { fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'learn' && (
        // Libro abierto
        <>
          <Path d="M12 6.5C10 5 7 4.5 3 5v13c4-.5 7 0 9 1.5 2-1.5 5-2 9-1.5V5c-4-.5-7 0-9 1.5Z" {...line} />
          <Path d="M12 6.5v13" {...line} />
        </>
      )}
      {name === 'openings' && (
        // Ramas: una línea principal que se abre en variantes
        <>
          <Circle cx={6} cy={5} r={2} {...line} />
          <Circle cx={6} cy={19} r={2} {...line} />
          <Circle cx={18} cy={8} r={2} {...line} />
          <Path d="M6 7v10M18 10c0 4-6 3-11 7" {...line} />
        </>
      )}
      {name === 'puzzles' && (
        // Pieza de rompecabezas
        <Path d="M3 7h5a2 2 0 1 1 4 0h5v4a2 2 0 1 1 0 4v5H3Z" {...line} />
      )}
      {name === 'bots' && (
        // Cara de robot
        <>
          <Rect x={4} y={8} width={16} height={12} rx={3} {...line} />
          <Path d="M12 8V5" {...line} />
          <Circle cx={12} cy={4} r={1.5} fill={color} />
          <Circle cx={9} cy={14} r={1.5} fill={color} />
          <Circle cx={15} cy={14} r={1.5} fill={color} />
        </>
      )}
      {name === 'analysis' && (
        // Tablero 2×2
        <>
          <Rect x={3} y={3} width={18} height={18} rx={3} {...line} />
          <Rect x={3} y={3} width={9} height={9} rx={1} fill={color} />
          <Rect x={12} y={12} width={9} height={9} rx={1} fill={color} />
        </>
      )}
      {name === 'profile' && (
        // Persona
        <>
          <Circle cx={12} cy={8} r={4} {...line} />
          <Path d="M4 21c0-4 4-6 8-6s8 2 8 6" {...line} />
        </>
      )}
    </Svg>
  );
}
