import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ColumnScrollView } from '../components/ColumnScrollView';
import { BotAvatar } from '../components/BotAvatar';
import { Button3D } from '../components/Button3D';
import { Chip } from '../components/Chip';
import { Bot } from '../data/bots';
import { useContent } from '../data/useContent';
import { useI18n } from '../i18n/I18nContext';
import { useProgress } from '../progress/ProgressContext';
import { recordAgainst } from '../progress/progressStore';
import { colors, fonts, radius, space } from '../theme';
import { statusBarTop } from '../components/statusBarTop';

type Props = { onOpenBot: (bot: Bot) => void; onContinue: () => void };

// Pestaña Bots: los 10 bots, de menor a mayor nivel (mapa-de-pantallas.md, 2.9).
export function BotsScreen({ onOpenBot, onContinue }: Props) {
  const { progress } = useProgress();
  const { bots } = useContent();
  const { t } = useI18n();
  // Partida sin terminar (en este dispositivo o venida de otro con la sincronización); solo si el bot sigue existiendo.
  const ongoingBot = progress.ongoingGame && bots.find((b) => b.id === progress.ongoingGame?.botId);
  return (
    <ColumnScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: statusBarTop(space.md) }]}
    >
      <Text style={styles.title}>{t('bots.title')}</Text>
      <Text style={styles.subtitle}>{t('bots.subtitle')}</Text>
      <View style={{ height: space.lg }} />

      {ongoingBot && (
        <View style={styles.resumeCard}>
          <BotAvatar bot={ongoingBot} size={48} />
          <View style={{ flex: 1 }}>
            <Text style={styles.resumeTitle}>{t('bots.resumeTitle', { name: ongoingBot.name })}</Text>
            <Button3D label={t('bots.resumeButton')} variant="primary" onPress={onContinue} style={{ marginTop: space.sm }} />
          </View>
        </View>
      )}

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
    </ColumnScrollView>
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
  resumeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.primary,
    padding: space.md,
    marginBottom: space.lg,
  },
  resumeTitle: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.text },
  name: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.text },
  tagline: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted },
  trait: { fontFamily: fonts.semibold, fontSize: 13, color: colors.textMuted, marginTop: 2, lineHeight: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginTop: space.sm },
});
