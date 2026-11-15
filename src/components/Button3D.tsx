import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { type, colors, fonts, radius } from '../theme';

type Variant = 'primary' | 'secondary' | 'destructive' | 'danger';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
  /** Texto para el lector cuando el visible es más corto (por ejemplo, en una fila de dos botones). */
  ariaLabel?: string;
  disabled?: boolean;
  /** Ancla en la web (se mapea al `id`), para mover el foco a este botón. */
  nativeID?: string;
};

const VARIANTS: Record<
  Variant,
  { bg: string; text: string; edge: string; outlined: boolean }
> = {
  primary: { bg: colors.primary, text: colors.bg, edge: colors.primaryShadow, outlined: false },
  secondary: { bg: colors.surfaceRaised, text: '#FFFFFF', edge: colors.surfaceShadow, outlined: false },
  destructive: { bg: 'transparent', text: colors.danger, edge: colors.surfaceRaised, outlined: true },
  // Botón de los avisos de error (panel rojo): rojo como el aviso.
  danger: { bg: colors.danger, text: '#FFFFFF', edge: colors.dangerShadow, outlined: false },
};

// Botón con borde inferior 3D (design.md, sección 4).
export function Button3D({ label, onPress, variant = 'secondary', style, ariaLabel, disabled, nativeID }: Props) {
  const v = VARIANTS[variant];
  return (
    <Pressable
      nativeID={nativeID}
      accessibilityRole="button"
      accessibilityLabel={ariaLabel ?? label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: v.bg,
          borderColor: v.edge,
          borderWidth: v.outlined ? 2 : 0,
          borderBottomWidth: pressed ? 2 : 4,
          transform: [{ translateY: pressed ? 2 : 0 }],
        },
        disabled && { opacity: 0.4 },
        style,
      ]}
    >
      <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.label, { color: v.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.control,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.extrabold,
    fontSize: type.button,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
