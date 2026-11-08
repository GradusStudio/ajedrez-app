import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n/I18nContext';
import { StreakAction } from '../progress/streak';
import { colors, fonts, radius, space } from '../theme';

const ITEMS: StreakAction[] = ['puzzle', 'lesson', 'bot'];

/** Tarjeta de Aprender cuando la racha se puede recuperar: pide las tres acciones el mismo día. */
export function RecoveryCard({ days, done }: { days: number; done: Record<StreakAction, boolean> }) {
  const { t } = useI18n();
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t('recovery.title', { n: days })}</Text>
      <View style={styles.row}>
        {ITEMS.map((action) => (
          <View
            key={action}
            accessible
            style={[styles.item, done[action] && styles.itemDone]}
            accessibilityLabel={t(done[action] ? 'recovery.itemDone' : 'recovery.itemPending', { label: t(`recovery.${action}`) })}
          >
            <Text style={[styles.itemText, done[action] && styles.itemTextDone]}>
              {done[action] ? '✓ ' : ''}
              {t(`recovery.${action}`)}
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
  itemTextDone: { color: colors.onPrimary },
});
