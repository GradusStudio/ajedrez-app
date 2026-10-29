import { Lesson, Unit } from './lessonTypes';
import { openings } from './openings';
import unit1Raw from './unidad-1-lo-basico.json';
import unit2Raw from './unidad-2-reglas-especiales.json';

// El JSON se interpreta con los tipos de lessonTypes.ts.
export const unit1 = unit1Raw as unknown as Unit;
export const unit2 = unit2Raw as unknown as Unit;

/** Unidades de la ruta de Aprender, en orden. Las nuevas se agregan aquí. */
export const units: Unit[] = [unit1, unit2];

/** Busca una lección por id, en las unidades y en los cursos de aperturas. */
export function findLesson(id: string): Lesson | undefined {
  for (const group of [...units, ...openings]) {
    const lesson = group.lessons.find((l) => l.id === id);
    if (lesson) return lesson;
  }
  return undefined;
}
