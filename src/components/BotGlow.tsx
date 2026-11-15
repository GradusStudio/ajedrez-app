import React, { useId } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

type Props = {
  /** Lado del cuadrado del brillo, en px. */
  size: number;
  /** Color del brillo (el estilo del bot). */
  color: string;
  /** Opacidad del centro. */
  intensity?: number;
};

/**
 * Brillo redondo difuminado detrás del cuerpo de un bot (tarea 37): gradiente radial con el color del estilo,
 * sin borde duro. Reemplaza a los círculos planos de la ficha del bot y lo usa la capa del resultado.
 */
export function BotGlow({ size, color, intensity = 0.3 }: Props) {
  // El id del gradiente tiene que ser único: puede haber dos brillos en pantalla y los `<defs>` son globales.
  const id = `glow-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <Svg width={size} height={size} style={StyleSheet.absoluteFill} pointerEvents="none" aria-hidden>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={color} stopOpacity={intensity} />
          <Stop offset="0.5" stopColor={color} stopOpacity={intensity * 0.55} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={size} height={size} fill={`url(#${id})`} />
    </Svg>
  );
}
