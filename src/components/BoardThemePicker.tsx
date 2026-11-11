import React from 'react';
import { showDialog } from './dialog';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n/I18nContext';
import { boardThemePrice, isBoardThemeOwned } from '../pieces/shop';
import { useProgress } from '../progress/ProgressContext';
import { useSettings } from '../settings/SettingsContext';
import { useWideLayout } from './useWideLayout';
import { useBoardTheme } from '../settings/useBoardTheme';
import { BoardThemeId, boardThemes, colors, fonts, radius, space } from '../theme';
import { SquareTexture } from './SquareTexture';
import { StatIcon } from './StatIcon';

const CELL = 36;

/**
 * Lista de tableros con vista previa. Al tocar uno propio, se guarda y se aplica en toda la app;
 * uno de pago pide confirmar la compra con monedas.
 */
export function BoardThemePicker() {
  const { t } = useI18n();
  const wide = useWideLayout();
  const { update } = useSettings();
  const { progress, buyBoardTheme } = useProgress();
  const inUse = useBoardTheme();

  const choose = (id: BoardThemeId, name: string) => {
    if (isBoardThemeOwned(id, progress.boardThemes)) return update({ boardTheme: id });
    const price = boardThemePrice(id);
    if (progress.coins < price) {
      showDialog(t('pieces.needCoins.title'), t('boards.needCoins.message', { price, coins: progress.coins }));
      return;
    }
    showDialog(t('boards.buy.title', { name }), t('pieces.buy.message', { price, left: progress.coins - price }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('pieces.buy.confirm'), onPress: () => buyBoardTheme(id, price) && update({ boardTheme: id }) },
    ]);
  };

  return (
    <View style={wide ? styles.grid : undefined}>
      {(Object.keys(boardThemes) as BoardThemeId[]).map((id) => {
        const theme = boardThemes[id];
        const selected = id === inUse;
        const owned = isBoardThemeOwned(id, progress.boardThemes);
        const price = boardThemePrice(id);
        const name = t(`boardTheme.${id}`);
        return (
          <Pressable
            key={id}
            onPress={() => choose(id, name)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={owned ? t('settings.boardThemeLabel', { name }) : t('settings.boardThemeLabelPriced', { name, price })}
            style={[styles.card, wide && styles.cardWide, selected && styles.cardSelected]}
          >
            <View style={styles.header}>
              <Text style={styles.name}>{name}</Text>
              {selected && <Text style={styles.check}>{t('pieces.inUse')}</Text>}
              {!owned && (
                <View style={styles.price}>
                  <StatIcon name="coin" size={16} />
                  <Text style={styles.priceText}>{price}</Text>
                </View>
              )}
            </View>
            <View style={styles.preview}>
              {Array.from({ length: 8 }, (_, i) => {
                const light = i % 2 === 0;
                return (
                  <View key={i} style={{ width: CELL, height: CELL, backgroundColor: light ? theme.light : theme.dark }}>
                    <SquareTexture theme={id} light={light} size={CELL} seed={i} />
                  </View>
                );
              })}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    borderBottomWidth: 4,
    borderBottomColor: colors.surfaceShadow,
    padding: space.md,
    marginBottom: space.md,
  },
  cardSelected: { borderColor: colors.primary, borderBottomColor: colors.primaryShadow },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: space.md },
  cardWide: { width: '48%', marginBottom: 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.sm },
  name: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.text },
  check: { fontFamily: fonts.bold, fontSize: 14, color: colors.primary },
  price: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  priceText: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.gold },
  preview: { flexDirection: 'row', borderRadius: 8, overflow: 'hidden', alignSelf: 'flex-start' },
});
