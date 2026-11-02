import { Chess } from 'chess.js';
import { openings } from '../data/openings';

// Posiciones de «teoría»: todas las que aparecen en las líneas de los cursos de aperturas de la app.
// Sin React Native.

/** Clave de posición sin los contadores de jugadas (dos posiciones iguales por transposición coinciden). */
export const positionKey = (fen: string) => fen.split(' ').slice(0, 4).join(' ');

let cache: Set<string> | null = null;

/** Se arma la primera vez que se pide (reproduce todas las líneas) y queda guardado. */
export function bookPositions(): Set<string> {
  if (cache) return cache;
  const set = new Set<string>();
  const seen = new Set<string>();
  for (const course of openings)
    for (const lesson of course.lessons)
      for (const step of lesson.steps) {
        if (step.type !== 'line') continue;
        const key = `${step.fen}|${step.moves.map((m) => m.uci).join(' ')}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const chess = new Chess(step.fen);
        set.add(positionKey(chess.fen()));
        for (const m of step.moves) {
          try {
            chess.move({ from: m.uci.slice(0, 2), to: m.uci.slice(2, 4), promotion: m.uci[4] });
          } catch {
            break;
          }
          set.add(positionKey(chess.fen()));
        }
      }
  return (cache = set);
}
