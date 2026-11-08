import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n/I18nContext';
import { colors, fonts, radius, space } from '../theme';
import { statusBarTop } from '../components/statusBarTop';

type Props = { title: string; description: string; milestone: number };

// Pestaña que todavía no tiene contenido: explica qué va a tener y en qué hito llega.
export function ComingSoonScreen({ title, description, milestone }: Props) {
  const { t } = useI18n();
  return (
    <View style={[styles.screen, { paddingTop: statusBarTop(space.md) }]}>
      <Text style={styles.title}>{title}</Text>
      <View style={{ height: space.lg }} />
      <View style={styles.card}>
        <Text style={styles.badge}>{t('comingSoon.badge', { n: milestone })}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space.lg },
  title: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.text },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    borderBottomWidth: 4,
    borderBottomColor: colors.surfaceShadow,
    paddingVertical: space.md,
    paddingHorizontal: 14,
  },
  badge: { fontFamily: fonts.extrabold, fontSize: 12, color: colors.gold, marginBottom: space.xs },
  description: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted },
});
