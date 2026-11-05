// Detector de tácticas: mira la jugada con chess.js y solo devuelve lo que puede comprobar.
// Ante la duda no devuelve nada (mejor un falso negativo que inventar una táctica).
import { Chess } from 'chess.js';
import type { Color, Square } from 'chess.js';
import type { PieceKind } from './types';

export type TacticKind = 'fork' | 'pin' | 'skewer' | 'discovered' | 'doubleCheck' | 'hanging' | 'backRank';

/** `attacker` es la pieza que ejerce la táctica (en `discovered`, la que quedó descubierta). */
export type Tactic = { kind: TacticKind; attacker: PieceKind; targets: PieceKind[] };

// El rey vale mucho al comparar piezas en línea (clavadas y enfiladas).
const VALUE: Record<PieceKind, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };

const FILES = 'abcdefgh';
const SLIDERS: PieceKind[] = ['b', 'r', 'q'];
const DIRS: Record<string, [number, number][]> = {
  b: [[1, 1], [1, -1], [-1, 1], [-1, -1]],
  r: [[1, 0], [-1, 0], [0, 1], [0, -1]],
  q: [[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]],
};

const sq = (file: number, rank: number) => (FILES[file] + (rank + 1)) as Square;
const allSquares = (): Square[] => {
  const out: Square[] = [];
  for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) out.push(sq(f, r));
  return out;
};
const ALL = allSquares();

type Found = { sq: Square; kind: PieceKind; color: Color };

const found = (game: Chess, s: Square): Found | null => {
  const p = game.get(s);
  return p ? { sq: s, kind: p.type as PieceKind, color: p.color } : null;
};
const kindAt = (game: Chess, s: Square): PieceKind => found(game, s)?.kind ?? 'p';

/** Piezas del bando `color` que `from` ataca (no cuenta casillas vacías). */
function attackedBy(game: Chess, from: Square, color: Color): Found[] {
  const out: Found[] = [];
  for (const s of ALL) {
    const t = found(game, s);
    const me = found(game, from);
    if (t && me && t.color === color && game.attackers(s, me.color).includes(from)) out.push(t);
  }
  return out;
}

/** La pieza movida se puede capturar gratis (sin defensa, o por una pieza de menos valor). */
function capturableForFree(after: Chess, to: Square, mover: Color, opp: Color): boolean {
  const attackers = after.attackers(to, opp);
  if (attackers.length === 0) return false;
  const mine = VALUE[kindAt(after, to)];
  const cheapest = Math.min(...attackers.map((a) => VALUE[kindAt(after, a)]));
  return after.attackers(to, mover).length === 0 || cheapest < mine;
}

/** Recorre el rayo desde `to` y devuelve las dos primeras piezas que encuentra. */
function firstTwo(game: Chess, to: Square, [df, dr]: [number, number]): Found[] {
  const out: Found[] = [];
  let f = FILES.indexOf(to[0]) + df;
  let r = Number(to[1]) - 1 + dr;
  while (f >= 0 && f < 8 && r >= 0 && r < 8 && out.length < 2) {
    const s = sq(f, r);
    const p = found(game, s);
    if (p) out.push(p);
    f += df;
    r += dr;
  }
  return out;
}

export function detectTactics(fenBefore: string, uci: string): Tactic[] {
  let before: Chess;
  let after: Chess;
  let move;
  try {
    before = new Chess(fenBefore);
    after = new Chess(fenBefore);
    move = after.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.slice(4, 5) || undefined });
  } catch {
    return [];
  }
  const mover = move.color;
  const opp: Color = mover === 'w' ? 'b' : 'w';
  const to = move.to;
  const moved = kindAt(after, to);
  const out: Tactic[] = [];
  const safe = !capturableForFree(after, to, mover, opp);

  // Orquilla: la pieza movida ataca a dos o más piezas importantes.
  if (moved !== 'k' && safe) {
    const targets = attackedBy(after, to, opp).filter((t) => t.kind !== 'p');
    const worth = targets.some((t) => VALUE[t.kind] > VALUE[moved] || after.attackers(t.sq, opp).length === 0);
    if (targets.length >= 2 && worth) out.push({ kind: 'fork', attacker: moved, targets: targets.map((t) => t.kind) });
  }

  // Clavada y enfilada: deslizante con dos piezas rivales en fila.
  if (SLIDERS.includes(moved) && safe) {
    for (const dir of DIRS[moved]) {
      const [a, b] = firstTwo(after, to, dir);
      if (!a || !b || a.color !== opp || b.color !== opp) continue;
      if (b.kind === 'k' && a.kind !== 'p') {
        out.push({ kind: 'pin', attacker: moved, targets: [a.kind, b.kind] });
      } else if (a.kind !== 'k' && VALUE[a.kind] >= 3 && VALUE[b.kind] > VALUE[a.kind]) {
        out.push({ kind: 'pin', attacker: moved, targets: [a.kind, b.kind] });
      } else if (VALUE[a.kind] > VALUE[b.kind] && VALUE[b.kind] >= 3) {
        out.push({ kind: 'skewer', attacker: moved, targets: [a.kind, b.kind] });
      }
    }
  }

  // Ataque descubierto: un deslizante propio (no el que se movió) pasa a atacar algo valioso.
  for (const s of ALL) {
    const p = found(after, s);
    if (!p || p.color !== mover || s === to || !SLIDERS.includes(p.kind)) continue;
    const slider = p.kind;
    const newly = attackedBy(after, s, opp).filter((t) => {
      if (t.sq === to) return false;
      if (before.attackers(t.sq, mover).includes(s)) return false;
      const defended = after.attackers(t.sq, opp).length > 0;
      return t.kind === 'k' || (VALUE[t.kind] >= 3 && (!defended || VALUE[t.kind] > VALUE[slider]));
    });
    if (newly.length > 0) out.push({ kind: 'discovered', attacker: slider, targets: newly.map((t) => t.kind) });
  }

  // Jaque doble y mate del pasillo.
  if (after.inCheck()) {
    const king = ALL.find((s) => found(after, s)?.kind === 'k' && found(after, s)?.color === opp);
    if (king && after.attackers(king, mover).length >= 2) out.push({ kind: 'doubleCheck', attacker: moved, targets: ['k'] });
    if (king && after.isCheckmate() && (moved === 'r' || moved === 'q')) {
      const homeRank = opp === 'w' ? '1' : '8';
      const fwd = opp === 'w' ? 1 : -1;
      if (king[1] === homeRank && to[1] === homeRank) {
        const kf = FILES.indexOf(king[0]);
        const cells = [-1, 0, 1].filter((d) => kf + d >= 0 && kf + d < 8).map((d) => sq(kf + d, Number(homeRank) - 1 + fwd));
        const blockers = cells.map((c) => found(after, c));
        if (blockers.every((b) => b?.color === opp) && blockers.some((b) => b?.kind === 'p')) {
          out.push({ kind: 'backRank', attacker: moved, targets: ['k'] });
        }
      }
    }
  }

  // Pieza colgada: se captura algo de valor sin defensores.
  if (move.captured && move.flags.includes('c')) {
    const cap = move.captured as PieceKind;
    if (VALUE[cap] >= 3 && before.attackers(to, opp).length === 0) out.push({ kind: 'hanging', attacker: moved, targets: [cap] });
  }

  return out;
}

/** Mate anunciado por la evaluación (±(10000 − n)); null si `score` no es mate. */
export function mateIn(score: number): { by: 'w' | 'b'; n: number } | null {
  if (Math.abs(score) < 9000) return null;
  return { by: score > 0 ? 'w' : 'b', n: 10000 - Math.abs(score) };
}
