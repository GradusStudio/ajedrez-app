import React from 'react';
import { View } from 'react-native';
import { colors } from '../theme';

// En pantallas anchas la app va en una columna centrada de hasta 480 px de ancho y alto completo.
// A los costados queda el color liso del tema (el fondo ya lo pone la vista raíz): sin degradados ni adornos.
export function WebColumn({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: colors.bg }}>
      {children}
    </View>
  );
}
