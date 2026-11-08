import { StatusBar } from 'react-native';

/** Espacio de arriba para no quedar debajo de la barra de estado (40 si el sistema no la informa, como en la web). */
export const statusBarTop = (extra = 0) => (StatusBar.currentHeight ?? 40) + extra;
