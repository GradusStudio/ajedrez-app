import React, { useId } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '../theme';

/**
 * Tarjeta con el relieve del fondo nuevo (spec del feedback del tester, sección 1): degradé sutil,
 * borde claro de 2 px, filete de luz arriba y sombra. El degradé lo dibuja react-native-svg, así que
 * se ve igual en la web y en el celular sin dependencias nuevas. `radius` debe coincidir con el
 * borderRadius del estilo para que las esquinas del degradé encajen.
 */
export function CardSurface({
  style,
  radius = 16,
  children,
  ref,
  ...rest
}: ViewProps & { radius?: number; ref?: React.Ref<React.ComponentRef<typeof View>> }) {
  // En la web los ids de SVG son globales: uno por tarjeta para que no se pisen.
  const gid = `gradus-card-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <View ref={ref} style={[{ borderRadius: radius }, styles.card, style]} {...rest}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none" aria-hidden>
        <Defs>
          <LinearGradient id={gid} x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0" stopColor={colors.cardTop} />
            <Stop offset="1" stopColor={colors.cardBottom} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" rx={radius} fill={`url(#${gid})`} />
      </Svg>
      <View pointerEvents="none" style={styles.gloss} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardTop, // respaldo mientras el SVG no dibuja
    borderWidth: 2,
    borderColor: colors.cardBorder,
    shadowColor: '#000000',
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  gloss: {
    position: 'absolute',
    top: 1,
    left: 10,
    right: 10,
    height: 1,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});
