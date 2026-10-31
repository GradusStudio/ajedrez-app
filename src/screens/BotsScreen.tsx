import React from 'react';
import { Pressable, ScrollView, StatusBar as RNStatusBar, StyleSheet, Text, View } from 'react-native';
import { BotAvatar } from '../components/BotAvatar';
import { Chip } from '../components/Chip';
import { Bot } from '../data/bots';
import { useContent } from '../data/useContent';
import { useI18n } from '../i18n/I18nContext';
import { useProgress } from '../progress/ProgressContext';
import { recordAgainst } from '../progress/progressStore';
import { colors, fonts, radius, space } from '../theme';

type Props = { onOpenBot: (bot: Bot) => void };

// Pestaña Bots: los 10 bots, de menor a mayor nivel (mapa-de-pantallas.md, 2.9).
export function BotsScreen({ onOpenBot }: Props) {
  const { progress } = useProgress();
  const { bots } = useContent();
  const { t } = useI18n();
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: (RNStatusBar.currentHeight ?? 40) + space.md }]}
    >
      <Text style={styles.title}>{t('bots.title')}</Text>
      <Text style={styles.subtitle}>{t('bots.subtitle')}</Text>
      <View style={{ height: space.lg }} />

      {bots.map((bot) => {
        const r = recordAgainst(progress, bot.id);
        const played = r.wins + r.losses + r.draws;
        return (
          <Pressable
            key={bot.id}
            onPress={() => onOpenBot(bot)}
            accessibilityRole="button"
            accessibilityLabel={t('bots.cardLabel', { name: bot.name, tagline: bot.tagline, elo: bot.elo })}
            style={({ pressed }) => [styles.card, pressed && { transform: [{ translateY: 2 }], borderBottomWidth: 2 }]}
          >
            <BotAvatar bot={bot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>
                {bot.name} <Text style={styles.tagline}>· {bot.tagline}</Text>
              </Text>
              <Text style={styles.trait} numberOfLines={2}>
                {bot.trait}
              </Text>
              <View style={styles.chips}>
                <Chip label={t('common.level', { n: bot.elo })} />
                <Chip label={t(`botStyle.${bot.style}`)} />
                {played > 0 && <Chip label={t('bots.record', { wins: r.wins, played })} />}
              </View>
            </View>
          </Pressable>
        );
      })}
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
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    borderBottomWidth: 4,
    borderBottomColor: colors.surfaceShadow,
    paddingVertical: space.md,
    paddingHorizontal: 14,
    marginBottom: space.sm,
  },
  name: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.text },
  tagline: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted },
  trait: { fontFamily: fonts.semibold, fontSize: 13, color: colors.textMuted, marginTop: 2, lineHeight: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginTop: space.sm },
});
