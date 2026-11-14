import type React from 'react';
import type { View } from 'react-native';

// La barra lateral (pantalla ancha) se registra acá para que el consejo de las pestañas la ilumine.
// En el celular la barra de pestañas es la del navegador y no se registra: el consejo sale sin hueco.
type Ref = React.RefObject<React.ComponentRef<typeof View> | null>;

let current: Ref | null = null;

export function setTabBarTarget(ref: Ref | null) {
  current = ref;
}

export function getTabBarTarget(): Ref | undefined {
  return current ?? undefined;
}
