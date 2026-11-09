import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * true si el sistema pide reducir el movimiento (Android: «Quitar animaciones»; en la web, prefers-reduced-motion).
 * Las animaciones decorativas del tablero (inclinación, vaivén, caída del rey) se saltean y se muestra el estado final.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => alive && setReduced(v))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      alive = false;
      sub?.remove?.();
    };
  }, []);
  return reduced;
}
