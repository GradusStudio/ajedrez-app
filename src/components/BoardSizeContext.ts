import { createContext, useContext } from 'react';
import { useWindowDimensions } from 'react-native';
import { boardPixels } from './boardSize';

/** Lado del tablero en px que fija BoardLayout en pantalla ancha. Sin valor, Board calcula el suyo con el ancho de la ventana. */
export const BoardSizeContext = createContext<number | null>(null);

/** Lado del tablero: el que fija BoardLayout o, si no hay, el que sale del ancho de la ventana. Lo usan Board y EvalBar. */
export function useBoardSide(): number {
  const fixed = useContext(BoardSizeContext);
  const { width } = useWindowDimensions();
  return fixed ?? boardPixels(width);
}
