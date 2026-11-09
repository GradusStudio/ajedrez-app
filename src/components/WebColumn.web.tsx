import React from 'react';
import { View } from 'react-native';
import { colors } from '../theme';
import { COLUMN_MAX } from './boardSize';
import { useWideLayout } from './useWideLayout';

// En una ventana angosta la app va en una columna centrada de hasta COLUMN_MAX (480 px). En pantalla ancha ocupa
// toda la ventana: cada pantalla decide su ancho (barra lateral, tablero con panel o columna; ver _layout.tsx).
// A los costados queda el color liso del tema: sin degradados ni adornos.
export function WebColumn({ children }: { children: React.ReactNode }) {
  const wide = useWideLayout();
  return (
    <View style={{ flex: 1, width: '100%', maxWidth: wide ? undefined : COLUMN_MAX, alignSelf: 'center', backgroundColor: colors.bg }}>
      {children}
    </View>
  );
}
