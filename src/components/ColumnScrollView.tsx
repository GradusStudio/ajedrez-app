import React, { createContext, useContext } from 'react';
import { ScrollView, ScrollViewProps, useWindowDimensions } from 'react-native';

/**
 * Ancho de la columna de contenido en pantalla ancha (web): 640 px en las pestañas, 480 px en las demás pantallas.
 * Sin valor (celular, ventana angosta), las pantallas ocupan todo el ancho como siempre.
 */
export const ColumnContext = createContext<number | null>(null);

/** Ancho de la columna en pantalla ancha, o null. */
export const useColumnWidth = () => useContext(ColumnContext);

/**
 * ScrollView de las pantallas de lista. En pantalla ancha se desplaza con todo el ancho de la ventana (la barra queda
 * contra el borde derecho) y solo su contenido se centra en la columna. En el celular es un ScrollView común.
 */
export function ColumnScrollView({ contentContainerStyle, ...props }: ScrollViewProps) {
  const column = useColumnWidth();
  return (
    <ScrollView
      {...props}
      contentContainerStyle={column ? [contentContainerStyle, { width: '100%', maxWidth: column, alignSelf: 'center' }] : contentContainerStyle}
    />
  );
}

/**
 * Margen de los costados para una barra fija (fuera del ScrollView) que tiene que alinearse con el contenido de la
 * columna en pantalla ancha. El 16 extra es el margen interno que también tiene el contenido. Null en el celular.
 */
export function useColumnBarPadding(): { paddingHorizontal: number } | null {
  const column = useColumnWidth();
  const { width } = useWindowDimensions();
  return column ? { paddingHorizontal: Math.max(16, (width - column) / 2 + 16) } : null;
}
