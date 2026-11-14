import React, { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ColumnScrollView } from '../components/ColumnScrollView';
import { PieceSetPicker } from '../components/PieceSetPicker';
import { StatIcon } from '../components/StatIcon';
import { Tip } from '../components/Tip';
import { useI18n } from '../i18n/I18nContext';
import { useProgress } from '../progress/ProgressContext';
import { TIP_MESSAGES } from '../settings/tips';
import { useTips } from '../settings/useTips';
import { type, colors, fonts, space } from '../theme';
import { statusBarTop } from '../components/statusBarTop';

// Pantalla "Piezas" (también la tienda de sets): se abre desde Perfil y desde Ajustes. El cambio se aplica al tocar un set.
export function PieceSetScreen({ onBack }: { onBack: () => void }) {
  const { progress } = useProgress();
  const { t } = useI18n();
  const tips = useTips(['shop']);
  const tipMessage = tips.current ? TIP_MESSAGES[tips.current] : null;
  const gridRef = useRef<React.ComponentRef<typeof View>>(null);
  return (
    <ColumnScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: statusBarTop(space.sm) }]}
    >
      <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel={t('pieces.backLabel')} hitSlop={12}>
        <Text style={styles.back}>{t('pieces.back')}</Text>
      </Pressable>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{t('pieces.title')}</Text>
        <View style={styles.balance} accessibilityLabel={t('pieces.balance', { n: progress.coins })}>
          <StatIcon name="coin" size={20} />
          <Text style={styles.balanceText}>{progress.coins}</Text>
        </View>
      </View>
      <Text style={styles.subtitle}>{t('pieces.subtitle')}</Text>
      <View ref={gridRef}>
        <PieceSetPicker />
      </View>
      <Tip
        visible={!!tips.current}
        title={tipMessage ? t(tipMessage.title) : ''}
        text={tipMessage ? t(tipMessage.text) : ''}
        target={gridRef}
        onNext={tips.next}
        onClose={tips.close}
      />
    </ColumnScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  back: { fontFamily: fonts.bold, fontSize: type.secondary, color: colors.textMuted, marginBottom: space.sm },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: fonts.extrabold, fontSize: type.title, color: colors.text },
  balance: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  balanceText: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.gold },
  subtitle: { fontFamily: fonts.bold, fontSize: type.secondary, color: colors.textMuted, marginTop: 2, marginBottom: space.lg },
});
