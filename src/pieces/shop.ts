import type { BoardThemeId } from '../theme';
import type { AnyPieceSetId } from './materials';

// Tienda de sets de piezas y de tableros. `pieceSets.ts` es generado, por eso los precios viven aquí.
// Algo sin precio (o con 0) es gratis. Para vender un set o un tablero nuevo, basta con agregarlo con su precio.
export const PIECE_SET_PRICES: Partial<Record<AnyPieceSetId, number>> = { madera: 200, marmol: 200, hielo: 200, magma: 200 };
export const BOARD_THEME_PRICES: Partial<Record<BoardThemeId, number>> = { madera: 200, marmol: 200, hielo: 200, magma: 200 };

export const pieceSetPrice = (id: AnyPieceSetId): number => PIECE_SET_PRICES[id] ?? 0;
export const boardThemePrice = (id: BoardThemeId): number => BOARD_THEME_PRICES[id] ?? 0;

/** true si el set es gratis o ya se compró. */
export const isPieceSetOwned = (id: AnyPieceSetId, bought: string[]): boolean => pieceSetPrice(id) === 0 || bought.includes(id);
/** true si el tablero es gratis o ya se compró. */
export const isBoardThemeOwned = (id: BoardThemeId, bought: string[]): boolean => boardThemePrice(id) === 0 || bought.includes(id);
