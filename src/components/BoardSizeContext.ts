import { createContext } from 'react';

/** Lado del tablero en px que fija BoardLayout en pantalla ancha. Sin valor, Board calcula el suyo con el ancho de la ventana. */
export const BoardSizeContext = createContext<number | null>(null);
