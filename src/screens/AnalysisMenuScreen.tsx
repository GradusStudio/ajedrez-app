import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useI18n, MessageKey } from '../i18n/I18nContext';
import { colors, fonts, radius, space } from '../theme';
import { statusBarTop } from '../components/statusBarTop';

type Props = { onGame: () => void; onFree: () => void };

type Card = { glyph: string; title: MessageKey; desc: MessageKey; onPress: () => void; accent: string; edge: string };

// Menú de la pestaña Análisis: revisar una partida o analizar en un tablero libre.
export function AnalysisMenuScreen({ onGame, onFree }: Props) {
  const { t } = useI18n();
  const cards: Card[] = [
    { glyph: '♞', title: 'analysisMenu.game', desc: 'analysisMenu.gameDesc', onPress: onGame, accent: colors.primary, edge: colors.primaryShadow },
    { glyph: '♜', title: 'analysisMenu.free', desc: 'analysisMenu.freeDesc', onPress: onFree, accent: '#4FA3E0', edge: '#2F6FA0' },
  ];
  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: statusBarTop(space.sm) }]}>
      <Text style={styles.title}>{t('analysisMenu.title')}</Text>
      <Text style={styles.subtitle}>{t('analysisMenu.subtitle')}</Text>
      <View style={{ height: space.lg }} />
      {cards.map((c) => (
        <Pressable
          key={c.title}
          onPress={c.onPress}
          accessibilityRole="button"
          accessibilityLabel={t(c.title)}
          style={({ pressed }) => [styles.card, pressed && { borderBottomWidth: 2, transform: [{ translateY: 2 }] }]}
        >
          <View style={[styles.icon, { backgroundColor: c.accent, borderBottomColor: c.edge }]}>
            <Text style={styles.glyph}>{c.glyph}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{t(c.title)}</Text>
            <Text style={styles.cardDesc}>{t(c.desc)}</Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  title: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.text },
  subtitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted, marginTop: 2 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    borderBottomWidth: 4,
    borderBottomColor: colors.surfaceShadow,
    padding: space.lg,
    marginBottom: space.md,
  },
  icon: { width: 56, height: 56, borderRadius: 28, borderBottomWidth: 4, alignItems: 'center', justifyContent: 'center' },
  glyph: { fontSize: 30, color: '#FFFFFF' },
  cardTitle: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.text, marginBottom: 2 },
  cardDesc: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18, color: colors.textMuted },
});
