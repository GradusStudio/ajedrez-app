import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { type, colors, fonts, radius, space } from '../theme';

type Props = {
  label: string;
  description?: string;
  /** Interruptor (sí/no). */
  value?: boolean;
  onValueChange?: (v: boolean) => void;
  /** Fila que abre otra pantalla: muestra el valor actual y "›". */
  detail?: string;
  onPress?: () => void;
  /** Interruptor apagado sin interacción (por ejemplo, cuando el nivel ya abre todo). */
  disabled?: boolean;
};

/** Fila de Ajustes y Perfil: con interruptor o con flecha. */
export function SettingRow({ label, description, value, onValueChange, detail, onPress, disabled = false }: Props) {
  const content = (
    <>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        {!!description && <Text style={styles.description}>{description}</Text>}
      </View>
      {onValueChange ? (
        <Switch
          value={value}
          onValueChange={disabled ? undefined : onValueChange}
          disabled={disabled}
          trackColor={{ false: colors.outline, true: colors.primary }}
          thumbColor="#FFFFFF"
          accessibilityLabel={label}
          accessibilityState={{ disabled }}
        />
      ) : (
        <Text style={styles.detail}>{detail ? `${detail}  ›` : '›'}</Text>
      )}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={detail ? `${label}: ${detail}` : label}
        style={({ pressed }) => [styles.row, pressed && { transform: [{ translateY: 2 }], borderBottomWidth: 2 }]}
      >
        {content}
      </Pressable>
    );
  }
  return <View style={[styles.row, disabled && styles.rowDisabled]}>{content}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    borderBottomWidth: 4,
    borderBottomColor: colors.surfaceShadow,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    marginBottom: space.md,
  },
  rowDisabled: { opacity: 0.5 },
  label: { fontFamily: fonts.bold, fontSize: type.body, color: colors.text },
  description: { fontFamily: fonts.semibold, fontSize: type.caption, color: colors.textMuted, marginTop: 2 },
  detail: { fontFamily: fonts.bold, fontSize: type.body, color: colors.textMuted },
});
