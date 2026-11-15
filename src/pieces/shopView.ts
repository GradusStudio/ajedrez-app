// Lógica pura de la tienda (spec de la tienda y la barra, sección 3). Sin React Native: probada en shopView.test.ts.
import { boardThemes, type BoardThemeId } from '../theme';
import { PIECE_SET_LIST, type AnyPieceSetId } from './materials';
import { boardThemePrice, isBoardThemeOwned, isPieceSetOwned, pieceSetPrice } from './shop';

export type ShopKind = 'board' | 'set';

export type ShopContext = {
  coins: number;
  boughtBoards: string[];
  boughtSets: string[];
  boardInUse: BoardThemeId;
  setInUse: AnyPieceSetId;
};

export type ShopState =
  | { kind: 'inUse' }
  | { kind: 'owned' }
  | { kind: 'free' }
  | { kind: 'affordable' }
  | { kind: 'short'; missing: number };

export type ShopItem = { kind: 'board'; id: BoardThemeId; price: number; state: ShopState } | { kind: 'set'; id: AnyPieceSetId; price: number; state: ShopState };

export type PreviewAction =
  | { type: 'use' }
  | { type: 'buy'; price: number; left: number }
  | { type: 'short'; missing: number };

const boardIds = (): BoardThemeId[] => Object.keys(boardThemes) as BoardThemeId[];
const setIds = (): AnyPieceSetId[] => PIECE_SET_LIST.map((m) => m.id);

/** Ids de la tienda, en el orden en que se muestran (gratis primero, después los de precio). */
function idsOf(kind: ShopKind): string[] {
  return kind === 'board' ? boardIds() : setIds();
}

const priceOf = (kind: ShopKind, id: string): number =>
  kind === 'board' ? boardThemePrice(id as BoardThemeId) : pieceSetPrice(id as AnyPieceSetId);

const ownedOf = (kind: ShopKind, id: string, ctx: ShopContext): boolean =>
  kind === 'board' ? isBoardThemeOwned(id as BoardThemeId, ctx.boughtBoards) : isPieceSetOwned(id as AnyPieceSetId, ctx.boughtSets);

const inUseOf = (kind: ShopKind, ctx: ShopContext): string => (kind === 'board' ? ctx.boardInUse : ctx.setInUse);

const isValid = (kind: ShopKind, id: string): boolean =>
  kind === 'board' ? Object.hasOwn(boardThemes, id) : PIECE_SET_LIST.some((m) => m.id === id);

/** Estado de cada ítem: en uso, gratis, tuyo, te alcanza o te faltan monedas (con `missing`). */
export function shopItems(kind: ShopKind, ctx: ShopContext): ShopItem[] {
  const inUse = inUseOf(kind, ctx);
  const items: ShopItem[] = idsOf(kind).map((id) => {
    const price = priceOf(kind, id);
    const owned = ownedOf(kind, id, ctx);
    const state: ShopState =
      id === inUse && owned
        ? { kind: 'inUse' }
        : price === 0
          ? { kind: 'free' }
          : owned
            ? { kind: 'owned' }
            : ctx.coins >= price
              ? { kind: 'affordable' }
              : { kind: 'short', missing: price - ctx.coins };
    return kind === 'board'
      ? { kind: 'board', id: id as BoardThemeId, price, state }
      : { kind: 'set', id: id as AnyPieceSetId, price, state };
  });
  return [...items.filter((i) => i.price === 0), ...items.filter((i) => i.price > 0)];
}

/** Combinación de la vista previa: lo elegido más lo que ya se usa del otro tipo. */
export function previewCombo(
  kind: ShopKind,
  selectedId: string | null,
  ctx: ShopContext
): { board: BoardThemeId; set: AnyPieceSetId } {
  if (!selectedId || !isValid(kind, selectedId)) return { board: ctx.boardInUse, set: ctx.setInUse };
  return kind === 'board'
    ? { board: selectedId as BoardThemeId, set: ctx.setInUse }
    : { board: ctx.boardInUse, set: selectedId as AnyPieceSetId };
}

/**
 * Qué puede hacer el usuario con lo elegido: nada si ya está en uso, usarlo si es suyo,
 * comprarlo si le alcanza (con el saldo que queda) o cuánto le falta.
 */
export function previewAction(kind: ShopKind, selectedId: string | null, ctx: ShopContext): PreviewAction | null {
  if (!selectedId || !isValid(kind, selectedId)) return null;
  const owned = ownedOf(kind, selectedId, ctx);
  if (owned) return selectedId === inUseOf(kind, ctx) ? null : { type: 'use' };
  const price = priceOf(kind, selectedId);
  return ctx.coins >= price ? { type: 'buy', price, left: ctx.coins - price } : { type: 'short', missing: price - ctx.coins };
}

/** true si hay algo de pago que todavía no tiene y le alcanza: etiqueta «Te alcanza para algo nuevo». */
export function canAffordSomethingNew(ctx: ShopContext): boolean {
  const affordable = (i: ShopItem) => i.price > 0 && i.state.kind === 'affordable';
  return shopItems('board', ctx).some(affordable) || shopItems('set', ctx).some(affordable);
}
