import React, { useEffect, useState } from 'react';
import { Animated, Easing, StyleProp, ViewStyle } from 'react-native';

type Props = {
  children: React.ReactNode;
  /** Distancia (px) desde la que sube el contenido mientras aparece. */
  from?: number;
  delay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Aparece suave: se desvanece hacia adentro y sube un poco. La animación corre al montarse;
 * para repetirla con contenido nuevo, quien lo usa le cambia la `key`.
 */
export function FadeIn({ children, from = 10, delay = 0, duration = 280, style }: Props) {
  const [t] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(t, { toValue: 1, duration, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [t, duration, delay]);
  return (
    <Animated.View
      style={[
        style,
        { opacity: t, transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [from, 0] }) }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}
