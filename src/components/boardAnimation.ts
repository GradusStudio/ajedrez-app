import { Chess } from 'chess.js';
import type { PieceColor, PieceType } from './Piece';

// Cálculo de la animación del tablero: qué piezas se movieron, desde dónde, y cuál fue capturada.
// Separado de Board.tsx para poder probarlo solo.

export type Grid = ReturnType<Chess['board']>;
/** Desplazamiento, en casillas (columnas y filas en pantalla), desde donde "viene" cada pieza que se movió. */
export type Offsets = Record<string, { dc: number; dr: number }>;
/** Pieza que desapareció (capturada), con su casilla en la cuadrícula ("fila columna"). */
export type Captured = { cell: string; type: PieceType; color: PieceColor } | null;

/** Compara la posición anterior con la nueva: qué piezas se movieron, desde dónde, y cuál fue capturada. */
export function computeMove(prev: Grid, grid: Grid, orientation: 'w' | 'b'): { offsets: Offsets; captured: Captured } {
  const none = { offsets: {}, captured: null };
  const key = (c: { color: string; type: string } | null) => (c ? c.color + c.type : '');
  const changedNew: { cell: string; k: string }[] = [];
  const changedOld: { cell: string; k: string; type: PieceType; color: PieceColor }[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const a = prev[r][c];
      const b = grid[r][c];
      if (key(a) === key(b)) continue;
      if (b) changedNew.push({ cell: `${r}${c}`, k: key(b) });
      if (a) changedOld.push({ cell: `${r}${c}`, k: key(a), type: a.type, color: a.color });
    }
  }
  // Una jugada cambia como mucho 2 piezas de lugar y vacía como mucho 2 casillas (captura, enroque,
  // captura al paso). Si cambia más, es otra posición (no una jugada): sin animación.
  if (changedNew.length === 0 || changedNew.length > 2 || changedOld.length > 2) return none;
  const pos = (id: string) => {
    const br = Number(id[0]);
    const bc = Number(id[1]);
    return { col: orientation === 'w' ? bc : 7 - bc, row: orientation === 'w' ? br : 7 - br };
  };
  const offsets: Offsets = {};
  const used = new Set<string>();
  for (const n of changedNew) {
    let best: string | null = null;
    let bestDist = Infinity;
    for (const o of changedOld) {
      if (o.k !== n.k || used.has(o.cell)) continue;
      const a = pos(o.cell);
      const b = pos(n.cell);
      const d = Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
      if (d < bestDist) {
        bestDist = d;
        best = o.cell;
      }
    }
    if (best) {
      used.add(best);
      const a = pos(best);
      const b = pos(n.cell);
      offsets[n.cell] = { dc: a.col - b.col, dr: a.row - b.row };
    }
  }
  // La pieza vieja que no "se fue" a ningún lado es la capturada (también en la captura al paso).
  const gone = changedOld.find((o) => !used.has(o.cell));
  return { offsets, captured: gone ? { cell: gone.cell, type: gone.type, color: gone.color } : null };
}
