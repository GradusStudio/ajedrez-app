import { createPuzzleLoader } from './puzzles';
import { listSource, PuzzleSource } from './source';

// En el celular (Expo Go y APK) los 50.000 puzzles vienen dentro de la app (lichess-puzzles.json) y funcionan sin
// conexión. La web usa la base completa por trozos: puzzleSource.web.ts.

const loadList = createPuzzleLoader(() => import('./lichess-puzzles.json'));
let source: PuzzleSource | null = null;

/** La fuente si ya está lista (para no mostrar «Cargando» al volver a una pantalla). */
export const getPuzzleSource = (): PuzzleSource | null => source;

export function loadPuzzleSource(): Promise<PuzzleSource> {
  return loadList().then((list) => (source ??= listSource(list)));
}
