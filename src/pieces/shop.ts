import { PieceSetId } from './pieceSets';

// Tienda de sets de piezas. `pieceSets.ts` es generado, por eso los precios viven aquí.
// Un set sin precio (o con 0) es gratis. Para vender un set nuevo, basta con agregarlo con su precio.
export const PIECE_SET_PRICES: Partial<Record<PieceSetId, number>> = {};

export const pieceSetPrice = (id: PieceSetId): number => PIECE_SET_PRICES[id] ?? 0;

/** true si el set es gratis o ya se compró. */
export const isPieceSetOwned = (id: PieceSetId, bought: string[]): boolean => pieceSetPrice(id) === 0 || bought.includes(id);
