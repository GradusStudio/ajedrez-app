// Expresiones de los bots (sin React Native, para poder probarlas con npm test).
export type BotExpression = 'explica' | 'piensa' | 'acierto' | 'pista';

export const BOT_EXPRESSIONS_LIST: readonly BotExpression[] = ['explica', 'piensa', 'acierto', 'pista'];

/** Imagen de la expresión pedida; si el bot no la tiene (o no se pidió ninguna), el avatar de siempre. */
export function expressionSource<T>(
  map: Partial<Record<string, Partial<Record<BotExpression, T>>>>,
  botId: string,
  expression: BotExpression | undefined,
  fallback: T,
): T {
  if (!expression) return fallback;
  return map[botId]?.[expression] ?? fallback;
}
