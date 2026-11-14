import { createContext } from 'react';

/** Estado del aviso y del botón del panel ancho de la lección: lo consume TeacherBubble. */
export type LessonPanelState = {
  status: 'idle' | 'correct' | 'wrong';
  title?: string;
  message?: string;
  buttonLabel?: string;
  onButton?: () => void;
};

export const LessonPanelContext = createContext<LessonPanelState | null>(null);
