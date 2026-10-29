import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, space } from '../theme';

// Chip de estado (mapa-de-pantallas.md, sección 6): color de la apertura, estilo del bot, nivel.
export function Chip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceRaised,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: space.sm + 2,
  },
  text: { fontFamily: fonts.bold, fontSize: 12, color: colors.textMuted },
});
