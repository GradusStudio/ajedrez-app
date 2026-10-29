import { Chess } from 'chess.js';
import { OpeningCourse } from '../data/lessonTypes';
import { openings } from '../data/openings';

// Libro de aperturas de los bots: las líneas (`line`) de aperturas-v3.json.

/** Cuántas jugadas (de ambos bandos) sigue el libro cada bot (bots.md: corto, medio o largo). */
export const BOOK_PLIES = { corto: 6, medio: 12, largo: Infinity } as const;

const START = new Chess().fen();

/** Líneas distintas de un curso, como listas de jugadas UCI desde la posición inicial. */
const linesByCourse = new Map<string, string[][]>(
  openings.map((o) => {
    const seen = new Set<string>();
    const lines: string[][] = [];
    for (const lesson of o.lessons)
      for (const step of lesson.steps) {
        if (step.type !== 'line' || step.fen !== START) continue;
        const ucis = step.moves.map((m) => m.uci);
        const key = ucis.join(' ');
        if (!seen.has(key)) {
          seen.add(key);
          lines.push(ucis);
        }
      }
    return [o.id, lines];
  })
);

const startsWith = (line: string[], history: string[]) =>
  line.length > history.length && history.every((m, i) => line[i] === m);

/**
 * Jugada de libro para la posición actual: la siguiente de alguna línea de `courseIds`
 * que coincida con la partida hasta ahora. Si hay varias, elige al azar. null = fuera de libro.
 */
export function bookMove(courseIds: string[], history: string[], maxPlies: number): string | null {
  if (history.length >= maxPlies) return null;
  const options = courseIds.flatMap((id) => linesByCourse.get(id) ?? []).filter((l) => startsWith(l, history));
  if (options.length === 0) return null;
  return options[Math.floor(Math.random() * options.length)][history.length];
}

/**
 * Apertura que se está jugando: el curso cuya línea coincide con más jugadas de la partida
 * (al menos 2). Si dos cursos empatan (por ejemplo, tras 1.e4 e5), todavía no se sabe: undefined.
 * Sirve para mostrar "Apertura: Sistema Londres".
 */
export function detectOpening(history: string[]): OpeningCourse | undefined {
  let bestLength = 0;
  let matches = new Set<OpeningCourse>();
  for (const course of openings)
    for (const line of linesByCourse.get(course.id) ?? []) {
      let n = 0;
      while (n < line.length && n < history.length && line[n] === history[n]) n++;
      // Cuenta solo si la partida no se desvió de la línea antes de que una de las dos termine.
      if (n < 2 || n < Math.min(line.length, history.length)) continue;
      if (n > bestLength) {
        bestLength = n;
        matches = new Set([course]);
      } else if (n === bestLength) {
        matches.add(course);
      }
    }
  return matches.size === 1 ? [...matches][0] : undefined;
}
