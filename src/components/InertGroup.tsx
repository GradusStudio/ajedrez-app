import React, { useEffect, useRef } from 'react';
import { Platform, StyleProp, View, ViewStyle } from 'react-native';

type Props = {
  /** Hay una capa modal delante: el contenido deja de recibir foco, clics y lectura. */
  inert: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

type NodeRef = React.ComponentRef<typeof View>;
type DomNode = { setAttribute: (name: string, value: string) => void; removeAttribute: (name: string) => void };

/**
 * Fondo inerte de una capa modal. En la web marca el contenedor con `inert` y `aria-hidden` (React Native Web no
 * tiene la prop, así que se pone en el nodo del DOM); en el nativo usa `importantForAccessibility`. La capa del
 * resultado lo usa para que, con ella abierta, no se pueda tabular ni tocar el tablero ni el panel de atrás.
 */
export function InertGroup({ inert, children, style }: Props) {
  const ref = useRef<NodeRef>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = ref.current as unknown as DomNode | null;
    if (!node || typeof node.setAttribute !== 'function') return;
    if (inert) {
      node.setAttribute('inert', '');
      node.setAttribute('aria-hidden', 'true');
    } else {
      node.removeAttribute('inert');
      node.removeAttribute('aria-hidden');
    }
  }, [inert]);

  return (
    <View
      ref={ref}
      style={style}
      importantForAccessibility={inert ? 'no-hide-descendants' : 'auto'}
      aria-hidden={inert || undefined}
    >
      {children}
    </View>
  );
}
