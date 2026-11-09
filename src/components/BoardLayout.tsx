import React from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { space } from '../theme';
import { BoardSizeContext } from './BoardSizeContext';
import { WIDE_GAP, WIDE_PANEL, wideBoardPixels } from './boardSize';
import { useWideLayout } from './useWideLayout';

/**
 * Ancho total de tablero + separación + panel en pantalla ancha (null en el celular), para alinear con él lo que va
 * encima o debajo, como el encabezado y el panel inferior de la lección.
 */
export function useBoardLayoutWidth(reserveHeight = 200): number | null {
  const wide = useWideLayout();
  const { width, height } = useWindowDimensions();
  return wide ? wideBoardPixels({ width, height, reserveHeight }) + WIDE_GAP + WIDE_PANEL : null;
}

type Props = {
  /** El tablero (y lo que vaya pegado a él). */
  board: React.ReactNode;
  /** Lo que en el celular va debajo del tablero: en pantalla ancha, el panel de la derecha. */
  children: React.ReactNode;
  /** Alto que ocupan encabezado, barras y márgenes de la pantalla: el tablero usa el resto. */
  reserveHeight?: number;
  /** Separación entre tablero y contenido cuando van apilados. */
  narrowGap?: number;
};

/**
 * Tablero con su contenido. En el celular (y en ventanas angostas), uno debajo del otro, como siempre.
 * En pantalla ancha, el tablero a la izquierda, lo más grande que entre, y el contenido en un panel de 380 px a la
 * derecha que se desplaza solo, sin mover el tablero.
 */
export function BoardLayout({ board, children, reserveHeight = 200, narrowGap = space.lg }: Props) {
  const wide = useWideLayout();
  const { width, height } = useWindowDimensions();
  if (!wide) {
    return (
      <View>
        {board}
        <View style={{ height: narrowGap }} />
        {children}
      </View>
    );
  }
  const px = wideBoardPixels({ width, height, reserveHeight });
  return (
    <View style={{ flexDirection: 'row', alignSelf: 'center', alignItems: 'flex-start', gap: WIDE_GAP }}>
      <BoardSizeContext.Provider value={px}>
        <View style={{ width: px }}>{board}</View>
      </BoardSizeContext.Provider>
      <ScrollView style={{ width: WIDE_PANEL, maxHeight: px }} contentContainerStyle={{ paddingBottom: space.sm }}>
        {children}
      </ScrollView>
    </View>
  );
}
