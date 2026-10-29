import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius } from '../theme';

// Barra de progreso de la lección. `value` va de 0 a 1.
export function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${pct}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flex: 1, height: 14, borderRadius: radius.bar, backgroundColor: colors.surfaceRaised, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.bar, backgroundColor: colors.primary },
});
