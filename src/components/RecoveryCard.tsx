import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StreakAction } from '../progress/streak';
import { colors, fonts, radius, space } from '../theme';

const ITEMS: { action: StreakAction; label: string }[] = [
  { action: 'puzzle', label: 'Puzzle' },
  { action: 'lesson', label: 'Lección' },
  { action: 'bot', label: 'Bot' },
];

/** Tarjeta de Aprender cuando la racha se puede recuperar: pide las tres acciones el mismo día. */
export function RecoveryCard({ days, done }: { days: number; done: Record<StreakAction, boolean> }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Recupera tu racha de {days} días hoy</Text>
      <View style={styles.row}>
        {ITEMS.map(({ action, label }) => (
          <View
            key={action}
            style={[styles.item, done[action] && styles.itemDone]}
            accessibilityLabel={`${label}: ${done[action] ? 'hecho' : 'pendiente'}`}
          >
            <Text style={[styles.itemText, done[action] && styles.itemTextDone]}>
              {done[action] ? '✓ ' : ''}
              {label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    borderBottomWidth: 4,
    borderBottomColor: colors.surfaceShadow,
    padding: space.md,
  },
  title: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.text },
  row: { flexDirection: 'row', gap: space.sm, marginTop: space.sm },
  item: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: space.sm,
    borderRadius: radius.bar,
    backgroundColor: colors.surfaceRaised,
  },
  itemDone: { backgroundColor: colors.primary },
  itemText: { fontFamily: fonts.bold, fontSize: 13, color: colors.textMuted },
  itemTextDone: { color: '#FFFFFF' },
});
