export type Haptic = 'success' | 'error' | 'tap';

// Android Chrome vibra; el iPhone no tiene navigator.vibrate y no pasa nada.
export function vibrate(kind: Haptic) {
  try {
    navigator.vibrate?.(kind === 'error' ? [60, 40, 60] : 30);
  } catch {
    // Una vibración que falla no debe romper nada.
  }
}
