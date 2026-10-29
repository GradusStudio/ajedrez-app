import { OpeningCourse, OpeningsFile } from './lessonTypes';
import openingsRaw from './aperturas-v3.json';

// El JSON se interpreta con los tipos de lessonTypes.ts. Copia de docs/aperturas-v3.json.
export const openings = (openingsRaw as unknown as OpeningsFile).openings;

export function findOpening(id: string): OpeningCourse | undefined {
  return openings.find((o) => o.id === id);
}
