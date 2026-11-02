// Tablas de la salida de política de Lc0 (Leela Chess Zero, GPL v3: https://github.com/LeelaChessZero/lc0).
// Se calculan acá en vez de copiarlas. Se comprobó que coinciden con las de Lc0
// (src/neural/encoder.cc, kMoveStrs, y src/neural/tables/policy_map.h, kConvPolicyMap); maia.test.ts
// revisa algunas jugadas conocidas.

const FILES = 'abcdefgh';
const name = (sq: number) => FILES[sq % 8] + (Math.floor(sq / 8) + 1);
const onBoard = (file: number, rank: number) => file >= 0 && file < 8 && rank >= 0 && rank < 8;

// Direcciones como (columnas, filas): norte, noreste, este, sureste, sur, suroeste, oeste, noroeste.
const DIRS = [[0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1]];
const KNIGHT = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];

/**
 * Las 1858 jugadas de la salida de política, vistas desde el bando que mueve (blancas abajo):
 * para cada casilla de origen (a1, b1, …, h8), las de dama y caballo ordenadas por destino; después las
 * promociones desde la fila 7 a dama, torre y alfil. La promoción a caballo es la jugada sin letra.
 */
export const LC0_MOVES: string[] = (() => {
  const out: string[] = [];
  for (let from = 0; from < 64; from++) {
    const f = from % 8;
    const r = Math.floor(from / 8);
    const to = new Set<number>();
    for (const [df, dr] of DIRS)
      for (let d = 1; d < 8 && onBoard(f + df * d, r + dr * d); d++) to.add((r + dr * d) * 8 + f + df * d);
    for (const [df, dr] of KNIGHT) if (onBoard(f + df, r + dr)) to.add((r + dr) * 8 + f + df);
    [...to].sort((a, b) => a - b).forEach((t) => out.push(name(from) + name(t)));
  }
  for (let f = 0; f < 8; f++)
    for (const df of [-1, 0, 1]) if (onBoard(f + df, 7)) for (const p of 'qrb') out.push(name(48 + f) + name(56 + f + df) + p);
  return out;
})();

/**
 * De las 73 × 64 salidas de la cabeza convolucional (plano × casilla de origen) a las 1858 jugadas;
 * -1 = jugada fuera del tablero. Planos 0-55: 8 direcciones × 1 a 7 casillas; 56-63: caballo;
 * 64-72: promoción hacia la izquierda, recta y a la derecha, a torre, alfil y dama.
 */
export const LC0_CONV_POLICY_MAP: number[] = (() => {
  const index = new Map(LC0_MOVES.map((m, i) => [m, i]));
  const out: number[] = [];
  for (let plane = 0; plane < 73; plane++)
    for (let from = 0; from < 64; from++) {
      const f = from % 8;
      const r = Math.floor(from / 8);
      let df: number;
      let dr: number;
      let promo = '';
      if (plane < 56) {
        const d = (plane % 7) + 1;
        df = DIRS[Math.floor(plane / 7)][0] * d;
        dr = DIRS[Math.floor(plane / 7)][1] * d;
      } else if (plane < 64) {
        [df, dr] = KNIGHT[plane - 56];
      } else {
        df = Math.floor((plane - 64) / 3) - 1;
        dr = 1;
        promo = 'rbq'[(plane - 64) % 3];
        if (r !== 6) {
          out.push(-1);
          continue;
        }
      }
      out.push(onBoard(f + df, r + dr) ? (index.get(name(from) + name((r + dr) * 8 + f + df) + promo) ?? -1) : -1);
    }
  return out;
})();
