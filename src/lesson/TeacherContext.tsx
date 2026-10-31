import { createContext, useContext } from 'react';
import { BotExpression } from '../components/botFace';
import { Bot } from '../data/bots';

// Quién enseña la lección y qué cara pone. Lo da LessonPlayer; lo lee el globo de cada paso.
export type Teacher = {
  bot: Bot;
  expression: BotExpression;
  /** Frase de bienvenida: solo en el primer paso de una lección empezada de cero. */
  welcome?: string;
};

export const TeacherContext = createContext<Teacher | null>(null);

export function useTeacher(): Teacher {
  const teacher = useContext(TeacherContext);
  if (!teacher) throw new Error('useTeacher va dentro de LessonPlayer');
  return teacher;
}
