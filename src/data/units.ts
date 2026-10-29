import { Lesson, Unit } from './lessonTypes';
import { openings } from './openings';
import unit1Raw from './unidad-1-lo-basico.json';
import unit2Raw from './unidad-2-reglas-especiales.json';
import unit3Raw from './unidad-3-tactica-basica.json';
import unit4Raw from './unidad-4-apertura-y-estrategia.json';

// El JSON se interpreta con los tipos de lessonTypes.ts.
export const unit1 = unit1Raw as unknown as Unit;
export const unit2 = unit2Raw as unknown as Unit;
export const unit3 = unit3Raw as unknown as Unit;
export const unit4 = unit4Raw as unknown as Unit;

/** Unidades de la ruta de Aprender, en orden. Las nuevas se agregan aquí. */
export const units: Unit[] = [unit1, unit2, unit3, unit4];

/** Busca una lección por id, en las unidades y en los cursos de aperturas. */
export function findLesson(id: string): Lesson | undefined {
  for (const group of [...units, ...openings]) {
    const lesson = group.lessons.find((l) => l.id === id);
    if (lesson) return lesson;
  }
  return undefined;
}
