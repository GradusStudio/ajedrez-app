import React, { useEffect, useState } from 'react';
import { Animated, Easing, Text, TextProps } from 'react-native';
import { useReducedMotion } from './useReducedMotion';

type Props = {
  value: number;
  /** Duración de la cuenta en ms. */
  duration?: number;
} & Omit<TextProps, 'children'>;

/**
 * Número que sube de 0 a `value` al montarse. Con «reducir movimiento» (o si no hay qué contar)
 * muestra el valor de una. Anidado en un `Text`, hereda su tipografía.
 */
export function CountUp({ value, duration = 700, ...rest }: Props) {
  const reduced = useReducedMotion();
  if (reduced || value <= 0) {
    return <Text {...rest}>{value}</Text>;
  }
  return <AnimatedCount value={value} duration={duration} {...rest} />;
}

/** Parte animada, montada solo cuando hace falta contar. El entero sale de redondear el progreso. */
function AnimatedCount({ value, duration, ...rest }: Props) {
  const [progress] = useState(() => new Animated.Value(0));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    progress.setValue(0);
    const id = progress.addListener(({ value: v }) => setDisplay(Math.round(v * value)));
    Animated.timing(progress, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => progress.removeListener(id);
  }, [value, duration, progress]);

  return <Text {...rest}>{display}</Text>;
}
