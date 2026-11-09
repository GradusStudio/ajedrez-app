import { useWindowDimensions } from 'react-native';
import { isWideWidth } from './wideLayout';

/** true con la ventana ancha (960 px o más): barra lateral y tablero con panel al costado. Cambia en vivo. */
export function useWideLayout(): boolean {
  const { width } = useWindowDimensions();
  return isWideWidth(width);
}
