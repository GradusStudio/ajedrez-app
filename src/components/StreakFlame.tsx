import React, { useEffect, useId, useState } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
import { colors } from '../theme';
import { useReducedMotion } from './useReducedMotion';

/** Los cuatro estados de la llama, según `StreakStatus.kind`. */
export type FlameState = 'lit' | 'ember' | 'recovering' | 'none';

const OUTER =
  'M12 1.6c.7 3 2.7 4.8 4.4 6.9 1.4 1.8 2.5 3.7 2.5 6.2a6.9 6.9 0 0 1-13.8 0c0-2.7 1.3-4.6 2.7-6 .2 1.7 1 2.9 2.1 3.4-.4-3.8.3-7.5 2.1-10.5Z';
const CORE =
  'M12 10.6c.5 1.6 1.6 2.5 2.4 3.6.5.7.9 1.5.9 2.4a3.3 3.3 0 0 1-6.6 0c0-1.3.6-2.2 1.4-3 .1.8.5 1.4 1.1 1.6-.2-1.7.1-3.3.8-4.6Z';

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

type Props = {
  state: FlameState;
  size?: number;
  /** Latido de la brasa: solo en tamaños de 40 px o más y con movimiento permitido. */
  pulse?: boolean;
};

/**
 * Llama de racha: cuerpo dorado con núcleo claro cuando está encendida, brasa cuando falta
 * practicar y contorno cuando no hay racha. Los degradés usan un id único por instancia.
 */
export function StreakFlame({ state, size = 24, pulse = true }: Props) {
  const reduced = useReducedMotion();
  // `useId` trae caracteres que no van en un `url(#...)` de SVG.
  const id = `sf${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const [glow] = useState(() => new Animated.Value(1));
  const animateEmber = pulse && !reduced && size >= 40 && (state === 'ember' || state === 'recovering');

  useEffect(() => {
    if (!animateEmber) {
      glow.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 0.55, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(glow, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [animateEmber, glow]);

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <LinearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.gold} />
          <Stop offset="0.55" stopColor={colors.flame} />
          <Stop offset="1" stopColor="#EF6A2A" />
        </LinearGradient>
        <RadialGradient id={`${id}e`} cx="0.5" cy="0.7" r="0.6">
          <Stop offset="0" stopColor="#FFD27A" />
          <Stop offset="0.5" stopColor={colors.flame} />
          <Stop offset="1" stopColor={colors.danger} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Path
        d={OUTER}
        fill={state === 'lit' ? `url(#${id}g)` : state === 'none' ? 'none' : colors.surfaceRaised}
        stroke={state === 'lit' ? 'none' : colors.outline}
        strokeWidth={state === 'lit' ? 0 : state === 'none' ? 1.6 : 1.2}
        strokeLinejoin="round"
      />
      {state === 'lit' && (
        <>
          <Path d={CORE} fill="#FFF1B0" />
          <Path
            d="M9.2 13.4c-.6.9-.9 1.8-.8 2.9"
            stroke="#FFF6D6"
            strokeWidth={1.1}
            strokeLinecap="round"
            fill="none"
            opacity={0.7}
          />
        </>
      )}
      {(state === 'ember' || state === 'recovering') && (
        <AnimatedEllipse
          cx={12}
          cy={18.4}
          rx={state === 'recovering' ? 3.6 : 3.2}
          ry={2.4}
          fill={`url(#${id}e)`}
          opacity={glow}
        />
      )}
    </Svg>
  );
}

/** Estado de la llama a partir del estado de la racha. */
export function flameStateOf(kind: 'none' | 'active' | 'safe' | 'recovering'): FlameState {
  return kind === 'safe' ? 'lit' : kind === 'active' ? 'ember' : kind === 'recovering' ? 'recovering' : 'none';
}
