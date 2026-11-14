export type TapPoint = { time: number; x: number; y: number };
export const DOUBLE_TAP_MS = 300;
export const DOUBLE_TAP_PX = 30;

export function isDoubleTap(previous: TapPoint | null, next: TapPoint): boolean {
  if (!previous) return false;
  return (
    next.time - previous.time <= DOUBLE_TAP_MS &&
    Math.hypot(next.x - previous.x, next.y - previous.y) <= DOUBLE_TAP_PX
  );
}
