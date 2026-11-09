import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ColumnScrollView } from '../components/ColumnScrollView';
import { BoardThemePicker } from '../components/BoardThemePicker';
import { StatIcon } from '../components/StatIcon';
import { useI18n } from '../i18n/I18nContext';
import { useProgress } from '../progress/ProgressContext';
import { colors, fonts, space } from '../theme';
import { statusBarTop } from '../components/statusBarTop';

// Pantalla "Tableros" (también la tienda de tableros): se abre desde Perfil y desde Ajustes. El cambio se aplica al tocar un tablero.
export function BoardThemeScreen({ onBack }: { onBack: () => void }) {
  const { progress } = useProgress();
  const { t } = useI18n();
  return (
    <ColumnScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: statusBarTop(space.sm) }]}
    >
      <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel={t('pieces.backLabel')} hitSlop={12}>
        <Text style={styles.back}>{t('pieces.back')}</Text>
      </Pressable>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{t('boards.title')}</Text>
        <View style={styles.balance} accessibilityLabel={t('pieces.balance', { n: progress.coins })}>
          <StatIcon name="coin" size={20} />
          <Text style={styles.balanceText}>{progress.coins}</Text>
        </View>
      </View>
      <Text style={styles.subtitle}>{t('boards.subtitle')}</Text>
      <BoardThemePicker />
    </ColumnScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  back: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted, marginBottom: space.sm },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.text },
  balance: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  balanceText: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.gold },
  subtitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted, marginTop: 2, marginBottom: space.lg },
});
