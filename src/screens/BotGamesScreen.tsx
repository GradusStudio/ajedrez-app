import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ColumnScrollView } from '../components/ColumnScrollView';
import { BotAvatar } from '../components/BotAvatar';
import { statusBarTop } from '../components/statusBarTop';
import { useWideLayout } from '../components/useWideLayout';
import { useContent } from '../data/useContent';
import { useI18n } from '../i18n/I18nContext';
import { useProgress } from '../progress/ProgressContext';
import { recordAgainst } from '../progress/progressStore';
import { colors, fonts, radius, space } from '../theme';

type Props = { onBack: () => void; onOpenBot: (botId: string) => void };

// Pantalla "Partidas contra bots" (se abre desde Perfil): solo los bots con los que ya se jugó, con el historial.
export function BotGamesScreen({ onBack, onOpenBot }: Props) {
  const { progress } = useProgress();
  const { bots } = useContent();
  const { t } = useI18n();
  const wide = useWideLayout();
  const played = bots
    .map((bot) => ({ bot, record: recordAgainst(progress, bot.id) }))
    .filter(({ record }) => record.wins + record.losses + record.draws > 0);

  return (
    <ColumnScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: statusBarTop(space.sm) }]}
    >
      <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel={t('pieces.backLabel')} hitSlop={12}>
        <Text style={styles.back}>{t('pieces.back')}</Text>
      </Pressable>
      <Text style={styles.title}>{t('profile.botGames')}</Text>
      <Text style={styles.subtitle}>{t('profile.botGames.subtitle')}</Text>

      {played.length === 0 ? (
        <Text style={styles.empty}>{t('profile.noBotGames')}</Text>
      ) : (
        <View style={wide ? styles.grid : undefined}>
          {played.map(({ bot, record }) => {
            const text = record.draws
              ? t('profile.recordDraws', { wins: record.wins, losses: record.losses, draws: record.draws })
              : t('profile.record', { wins: record.wins, losses: record.losses });
            return (
              <Pressable
                key={bot.id}
                onPress={() => onOpenBot(bot.id)}
                accessibilityRole="button"
                accessibilityLabel={`${bot.name}, ${text}`}
                style={({ pressed }) => [styles.card, wide && styles.cardWide, pressed && styles.cardPressed]}
              >
                <BotAvatar bot={bot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{bot.name}</Text>
                  <Text style={styles.record}>{text}</Text>
                </View>
                <Text style={styles.chev}>›</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </ColumnScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  back: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted, marginBottom: space.sm },
  title: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.text },
  subtitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted, marginTop: 2, marginBottom: space.lg },
  empty: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: space.md },
  card: {
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
    paddingHorizontal: 14,
    marginBottom: space.sm,
  },
  cardWide: { width: '48%', marginBottom: 0 },
  cardPressed: { transform: [{ translateY: 2 }], borderBottomWidth: 2 },
  name: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.text },
  record: { fontFamily: fonts.semibold, fontSize: 13, color: colors.textMuted, marginTop: 2 },
  chev: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.textMuted },
});
