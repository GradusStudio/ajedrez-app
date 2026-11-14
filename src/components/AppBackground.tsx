import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '../theme';

/**
 * Fondo de toda la app (feedback del tester, 14-11-2026): luz cálida arriba a la izquierda, viñeta en los
 * bordes y una base con degradé vertical. Va fijo detrás de las pantallas, que son transparentes, y se ve
 * igual en la web y en el celular (react-native-svg, sin dependencias nuevas). Diseño:
 * docs/superpowers/specs/2026-11-14-feedback-tester-2-design.md, sección 1.
 */
export function AppBackground() {
  const { width, height } = useWindowDimensions();
  const vmax = Math.max(width, height);

  return (
    <Svg style={StyleSheet.absoluteFill} width={width} height={height} pointerEvents="none" aria-hidden>
      <Defs>
        <LinearGradient id="gradus-bg-base" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.bgTop} />
          <Stop offset="1" stopColor={colors.bgBottom} />
        </LinearGradient>
        {/* Viñeta: elipse de 130 % × 110 % centrada en 40 % 30 %, transparente hasta la mitad y negra al borde. */}
        <RadialGradient id="gradus-bg-vignette" cx="50%" cy="50%" r="50%">
          <Stop offset="0.5" stopColor="#000000" stopOpacity={0} />
          <Stop offset="1" stopColor="#000000" stopOpacity={0.45} />
        </RadialGradient>
        {/* Luz: elipse de 70vmax × 55vmax centrada en 30 % 20 %. */}
        <RadialGradient id="gradus-bg-lamp" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#FFC480" stopOpacity={0.13} />
          <Stop offset="0.55" stopColor="#FFC480" stopOpacity={0.04} />
          <Stop offset="0.8" stopColor="#FFC480" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={width} height={height} fill="url(#gradus-bg-base)" />
      <Ellipse
        cx={width * 0.4}
        cy={height * 0.3}
        rx={width * 0.65}
        ry={height * 0.55}
        fill="url(#gradus-bg-vignette)"
      />
      <Ellipse
        cx={width * 0.3}
        cy={height * 0.2}
        rx={vmax * 0.35}
        ry={vmax * 0.275}
        fill="url(#gradus-bg-lamp)"
      />
    </Svg>
  );
}
