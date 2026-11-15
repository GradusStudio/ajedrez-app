import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Circle3D } from './Circle3D';
import { useI18n } from '../i18n/I18nContext';
import { colors, fonts } from '../theme';

type Props = {
  /** Nombre de la pantalla a la que vuelve («Aperturas», «Bots», «Perfil»). */
  screen: string;
  /** Etiqueta accesible completa; por defecto, «Volver a {screen}». */
  label?: string;
  onPress: () => void;
};

/**
 * Botón de volver de la app (spec de aperturas y volver, 1): círculo 3D con chevron y el nombre de la
 * pantalla a la que vuelve, blanco y siempre arriba a la izquierda.
 */
export function BackButton({ screen, label, onPress }: Props) {
  const { t } = useI18n();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label ?? t('back.to', { screen })}
      hitSlop={8}
      style={styles.wrap}
    >
      {(state) => {
        const { pressed, hovered, focused } = state as typeof state & { hovered?: boolean; focused?: boolean };
        return (
          <>
            <View style={[styles.ring, focused && styles.ringFocus]}>
              <Circle3D
                size={40}
                color={hovered ? '#46443F' : colors.surfaceRaised}
                edge={colors.surfaceShadow}
                depth={4}
                pressed={pressed}
              >
                <Svg width={20} height={20} viewBox="0 0 20 20">
                  <Path
                    d="M12.5 4.5 7 10l5.5 5.5"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth={2.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </Circle3D>
            </View>
            <Text style={styles.label} numberOfLines={1}>
              {screen}
            </Text>
          </>
        );
      }}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, alignSelf: 'flex-start' },
  ring: { borderRadius: 23, borderWidth: 2, borderColor: 'transparent' },
  ringFocus: { borderColor: colors.gold },
  label: { fontFamily: fonts.extrabold, fontSize: 16, color: '#FFFFFF' },
});
