// Consejos de Pipo (feedback del primer tester, 14-11-2026). Módulo puro: sin React Native.
import type { MessageKey } from '../i18n/es';

export type TipId = 'home.tabs' | 'home.next' | 'home.streak' | 'learn.wheel' | 'learn.rail' | 'shop' | 'coins.first';

/** Todos los consejos, en el orden en que pueden aparecer. */
export const ALL_TIPS: readonly TipId[] = ['home.tabs', 'home.next', 'home.streak', 'learn.wheel', 'learn.rail', 'shop', 'coins.first'];

/** Claves de texto de cada consejo. */
export const TIP_MESSAGES: Record<TipId, { title: MessageKey; text: MessageKey }> = {
  'home.tabs': { title: 'tips.tabs.title', text: 'tips.tabs.text' },
  'home.next': { title: 'tips.home.next.title', text: 'tips.home.next.text' },
  'home.streak': { title: 'tips.home.streak.title', text: 'tips.home.streak.text' },
  'learn.wheel': { title: 'tips.learn.wheel.title', text: 'tips.learn.wheel.text' },
  'learn.rail': { title: 'tips.learn.rail.title', text: 'tips.learn.rail.text' },
  shop: { title: 'tips.shop.title', text: 'tips.shop.text' },
  'coins.first': { title: 'tips.coins.title', text: 'tips.coins.text' },
};

export function isTipSeen(seen: readonly string[], id: TipId): boolean {
  return seen.includes(id);
}

/** Agrega el consejo sin duplicar; devuelve una lista nueva. */
export function markTipSeen(seen: readonly string[], id: TipId): string[] {
  return seen.includes(id) ? [...seen] : [...seen, id];
}

/** Consejos de `ids` que todavía no se vieron, en orden. */
export function pendingTips(seen: readonly string[], ids: readonly TipId[]): TipId[] {
  return ids.filter((id) => !seen.includes(id));
}
