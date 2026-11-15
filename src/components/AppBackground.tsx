import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '../theme';

/**
 * Fondo de toda la app (feedback del tester, 14-11-2026): luz cálida arriba a la izquierda, viñeta en los
 * bordes y una base con degradé vertical. Va fijo detrás de las pantallas, que son transparentes, y se ve
 * igual en la web y en el celular (react-native-svg, sin dependencias nuevas). Diseño:
 * docs/superpowers/specs/2026-11-14-feedback-tester-2-design.md, sección 1.
 */
export function AppBackground() {
  const { width, height } = useWindowDimensions();

  return (
    <Svg style={StyleSheet.absoluteFill} width={width} height={height} pointerEvents="none" aria-hidden>
      <Defs>
        <LinearGradient id="gradus-bg-base" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.bgTop} />
          <Stop offset="1" stopColor={colors.bgBottom} />
        </LinearGradient>
        {/* Viñeta: un Rect a pantalla completa con el gradiente más allá de los bordes, sin arcos. */}
        <RadialGradient id="gradus-bg-vignette" cx="40%" cy="30%" r="0.75">
          <Stop offset="0.45" stopColor="#000000" stopOpacity={0} />
          <Stop offset="1" stopColor="#000000" stopOpacity={1} />
        </RadialGradient>
        {/* Luz: elipse de 70vmax × 55vmax centrada en 30 % 20 %, también a pantalla completa. */}
        <RadialGradient id="gradus-bg-lamp" cx="30%" cy="20%" r="0.8">
          <Stop offset="0" stopColor="#FFC480" stopOpacity={0.13} />
          <Stop offset="0.55" stopColor="#FFC480" stopOpacity={0.04} />
          <Stop offset="0.8" stopColor="#FFC480" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={width} height={height} fill="url(#gradus-bg-base)" />
      <Rect width={width} height={height} fill="url(#gradus-bg-vignette)" />
      <Rect width={width} height={height} fill="url(#gradus-bg-lamp)" />
    </Svg>
  );
}
