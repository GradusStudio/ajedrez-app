import { Chess, Move } from 'chess.js';
import { LC0_MOVES } from './lc0Tables';

// Entrada de la red Maia: los 112 planos "clásicos" de Lc0 (src/neural/encoder.cc,
// INPUT_CLASSICAL_112_PLANE). Todo se ve desde el bando que mueve: "nuestras" piezas primero y,
// si mueven las negras, el tablero dado vuelta (fila 1 ↔ fila 8).
//   - 8 posiciones (la actual y las 7 anteriores) × 13 planos: 6 tipos de pieza nuestros,
//     6 del rival y uno que vale 1 si esa posición ya había aparecido antes en la partida.
//   - 8 auxiliares: enroques (nuestro largo, nuestro corto, del rival largo, del rival corto),
//     mueven las negras, regla de 50 jugadas (en medias jugadas), cero y uno.

/** Lo que recibe el Worker: planos de piezas como bits y las jugadas legales como índices de Lc0. */
export type MaiaInput = {
  /** 104 planos de piezas como pares [casillas a1..h4, casillas a5..h8] (bit = casilla). */
  bits: number[];
  /** 8 planos auxiliares (valor para las 64 casillas). */
  aux: number[];
  /** Índice en la salida de política de cada jugada legal (mismo orden que `legal`). */
  moves: number[];
};

export type MaiaPosition = { input: MaiaInput; legal: string[] };

const PIECES = ['p', 'n', 'b', 'r', 'q', 'k'] as const;
const INDEX = new Map(LC0_MOVES.map((m, i) => [m, i]));
const START = new Chess().fen();

type Snapshot = { board: ReturnType<Chess['board']>; key: string };

/** Clave para repeticiones: piezas, turno, enroques y al paso (sin los relojes). */
const keyOf = (fen: string) => fen.split(' ').slice(0, 4).join(' ');

/** Casilla de Lc0 (a1 = 0, h8 = 63) vista desde `us`. */
function sq(file: number, rank: number, us: 'w' | 'b') {
  return (us === 'b' ? 7 - rank : rank) * 8 + file;
}

function setBit(bits: number[], plane: number, square: number) {
  const i = 2 * plane + (square >= 32 ? 1 : 0);
  bits[i] = (bits[i] | (1 << square % 32)) >>> 0;
}

/** Jugada de chess.js como la entiende Lc0: enroque = rey toma su torre, desde el bando que mueve. */
export function lc0MoveIndex(m: Pick<Move, 'from' | 'to' | 'color' | 'flags' | 'promotion'>): number {
  let to = m.to as string;
  if (m.flags.includes('k')) to = 'h' + m.from[1];
  else if (m.flags.includes('q')) to = 'a' + m.from[1];
  const flip = (s: string) => (m.color === 'b' ? s[0] + (9 - Number(s[1])) : s);
  const promo = m.promotion && m.promotion !== 'n' ? m.promotion : '';
  const idx = INDEX.get(flip(m.from) + flip(to) + promo);
  if (idx === undefined) throw new Error(`jugada sin índice de Lc0: ${m.from}${m.to}`);
  return idx;
}

/**
 * Arma la entrada de Maia para la posición a la que se llega jugando `moves` (UCI) desde `startFen`.
 * La historia importa: Maia se entrenó con partidas completas y mira las 7 posiciones anteriores.
 */
export function encodeMaia(moves: string[], startFen: string = START): MaiaPosition {
  const chess = new Chess(startFen);
  const snaps: Snapshot[] = [{ board: chess.board(), key: keyOf(chess.fen()) }];
  for (const uci of moves) {
    chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
    snaps.push({ board: chess.board(), key: keyOf(chess.fen()) });
  }
  const us = chess.turn();
  const bits = new Array(208).fill(0);

  let last = -1;
  for (let i = 0; i < 8; i++) {
    const idx = snaps.length - 1 - i;
    if (idx < 0) {
      // Antes del comienzo: desde la posición inicial normal no hay nada (Lc0 corta ahí). Si la
      // partida empezó en otra posición, Lc0 repite la primera ("fen_only").
      if (startFen === START || last < 0) break;
      for (let p = 0; p < 13; p++) {
        bits[2 * (i * 13 + p)] = bits[2 * (last * 13 + p)];
        bits[2 * (i * 13 + p) + 1] = bits[2 * (last * 13 + p) + 1];
      }
      continue;
    }
    const { board, key } = snaps[idx];
    const base = i * 13;
    board.forEach((row, r) =>
      row.forEach((cell, f) => {
        if (!cell) return;
        const plane = base + PIECES.indexOf(cell.type) + (cell.color === us ? 0 : 6);
        setBit(bits, plane, sq(f, 7 - r, us));
      })
    );
    if (snaps.slice(0, idx).some((s) => s.key === key)) {
      bits[2 * (base + 12)] = 0xffffffff;
      bits[2 * (base + 12) + 1] = 0xffffffff;
    }
    last = i;
  }

  const them = us === 'w' ? 'b' : 'w';
  const rights = chess.fen().split(' ')[2];
  const can = (c: 'w' | 'b', side: 'k' | 'q') => rights.includes(c === 'w' ? side.toUpperCase() : side);
  const halfmove = Number(chess.fen().split(' ')[4]) || 0;
  const aux = [
    can(us, 'q') ? 1 : 0,
    can(us, 'k') ? 1 : 0,
    can(them, 'q') ? 1 : 0,
    can(them, 'k') ? 1 : 0,
    us === 'b' ? 1 : 0,
    halfmove,
    0,
    1,
  ];

  const legalMoves = chess.moves({ verbose: true });
  return {
    input: { bits, aux, moves: legalMoves.map(lc0MoveIndex) },
    legal: legalMoves.map((m) => m.from + m.to + (m.promotion ?? '')),
  };
}
