import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { isMaterialSet } from '../pieces/materials';
import { TEXTURES } from '../pieces/textures';
import { BoardThemeId, boardTexture } from '../theme';

type Props = {
  theme: BoardThemeId;
  light: boolean;
  /** Casilla (columna + fila): elige qué cuarto de la textura se muestra, para que las casillas no se repitan. */
  seed?: number;
};

/**
 * Fondo con textura de una casilla. No dibuja nada si el tema es de color liso. Va como primer hijo de la casilla.
 * El tamaño es relativo a la casilla (200 % de ancho y alto): así también cubre las casillas grandes de la
 * vista previa de la tienda, sin dejar huecos de color liso.
 */
export function SquareTexture({ theme, light, seed = 0 }: Props) {
  const id = boardTexture(theme);
  if (!id || !isMaterialSet(id)) return null;
  const offset = [seed % 2, (seed >> 1) % 2];
  return (
    <View style={styles.clip} pointerEvents="none">
      <Image
        source={light ? TEXTURES[id].light : TEXTURES[id].dark}
        style={{
          position: 'absolute',
          width: '200%',
          height: '200%',
          left: offset[0] ? '-100%' : 0,
          top: offset[1] ? '-100%' : 0,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({ clip: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' } });
