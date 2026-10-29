import React from 'react';
import { Pressable, ScrollView, StatusBar as RNStatusBar, StyleSheet, Text } from 'react-native';
import { PieceSetPicker } from '../components/PieceSetPicker';
import { colors, fonts, space } from '../theme';

// Pantalla "Piezas": se abre desde Perfil > Ajustes. El cambio se aplica al tocar un set.
export function PieceSetScreen({ onBack }: { onBack: () => void }) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: (RNStatusBar.currentHeight ?? 40) + space.sm }]}
    >
      <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Volver a Ajustes" hitSlop={12}>
        <Text style={styles.back}>‹ Ajustes</Text>
      </Pressable>
      <Text style={styles.title}>Piezas</Text>
      <Text style={styles.subtitle}>Elige el estilo que más te guste. Se aplica en todos los tableros.</Text>
      <PieceSetPicker />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  back: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted, marginBottom: space.sm },
  title: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.text },
  subtitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted, marginTop: 2, marginBottom: space.lg },
});
