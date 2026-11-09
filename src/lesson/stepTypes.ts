// Contrato entre el reproductor y cada tipo de paso.
export type StepCallbacks = {
  /** El usuario resolvió el paso. `message` se muestra en el panel verde. */
  onCorrect: (message?: string) => void;
  /**
   * Intento fallido. Aparece el panel rojo con "Reintentar".
   * `undo` (opcional) deshace lo que quedó a la vista, por ejemplo la jugada equivocada en el tablero;
   * el reproductor la llama al tocar "Reintentar".
   */
  onWrong: (message: string, undo?: () => void) => void;
  /** Quita el panel rojo sin terminar el paso. */
  onClear?: () => void;
  /** true mientras se ve el panel rojo: el paso no acepta jugadas ni respuestas hasta "Reintentar". */
  locked?: boolean;
};

/**
 * Alto que el reproductor de lecciones ocupa fuera del tablero en pantalla ancha (encabezado, panel de abajo y
 * márgenes): BoardLayout le da al tablero el resto de la ventana.
 */
export const LESSON_RESERVE = 230;
