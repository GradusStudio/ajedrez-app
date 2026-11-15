import type { BotExpression } from './botFace';

/** Poses de cuerpo entero: las cuatro de la lección y las dos del resultado. */
export type BotPose = BotExpression | 'festejo' | 'lamento';

export const BOT_POSES_LIST: readonly BotPose[] = ['explica', 'piensa', 'acierto', 'pista', 'festejo', 'lamento'];

/**
 * Imagen de la pose pedida. Si el bot no la tiene (o no se pidió ninguna), devuelve el cuerpo neutro: las poses se
 * suman de a poco y la app nunca se queda sin imagen.
 */
export function bodySource<T>(
  map: Partial<Record<string, Partial<Record<BotPose, T>>>>,
  botId: string,
  pose: BotPose | undefined,
  fallback: T,
): T {
  if (!pose) return fallback;
  return map[botId]?.[pose] ?? fallback;
}
