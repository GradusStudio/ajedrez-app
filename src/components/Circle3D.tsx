import React from 'react';
import { StyleSheet, View } from 'react-native';

type Props = {
  size: number;
  color: string;
  /** Color del "canto" de abajo (el borde 3D). */
  edge: string;
  /** Cuánto asoma el canto por debajo, en px. */
  depth?: number;
  /** Presionado: la cara baja hasta la mitad del canto, como un botón 3D. */
  pressed?: boolean;
  children?: React.ReactNode;
};

/**
 * Círculo con efecto 3D, como una moneda: dos círculos iguales, el de abajo (canto) corrido `depth` px.
 * Reemplaza a `borderBottomWidth` en formas redondas, que Android dibuja como una media luna
 * que se afina hacia los costados.
 */
export function Circle3D({ size, color, edge, depth = 4, pressed = false, children }: Props) {
  const round = { width: size, height: size, borderRadius: size / 2 };
  return (
    <View style={{ width: size, height: size + depth }}>
      <View style={[styles.layer, round, { top: depth, backgroundColor: edge }]} />
      <View style={[styles.layer, styles.face, round, { top: pressed ? depth / 2 : 0, backgroundColor: color }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', left: 0 },
  face: { alignItems: 'center', justifyContent: 'center' },
});
