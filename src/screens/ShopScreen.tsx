import React from 'react';
import { Alert, Pressable, ScrollView, StatusBar as RNStatusBar, StyleSheet, Text, View } from 'react-native';
import { Button3D } from '../components/Button3D';
import Piece, { PieceColor, PieceType } from '../components/Piece';
import { SquareTexture } from '../components/SquareTexture';
import { StatIcon } from '../components/StatIcon';
import { useI18n } from '../i18n/I18nContext';
import { AnyPieceSetId, PIECE_SET_LIST } from '../pieces/materials';
import { BOARD_THEME_PRICES, boardThemePrice, isBoardThemeOwned, isPieceSetOwned, pieceSetPrice } from '../pieces/shop';
import { useProgress } from '../progress/ProgressContext';
import { usePieceSet } from '../settings/PieceSetContext';
import { useSettings } from '../settings/SettingsContext';
import { useBoardTheme } from '../settings/useBoardTheme';
import { BoardThemeId, boardThemes, colors, fonts, radius, space } from '../theme';

const PREVIEW: { type: PieceType; color: PieceColor }[] = [
  { type: 'k', color: 'w' },
  { type: 'q', color: 'b' },
  { type: 'b', color: 'w' },
  { type: 'n', color: 'b' },
  { type: 'r', color: 'w' },
  { type: 'p', color: 'b' },
];
const CELL = 46;
const BOARD_CELL = 36;

// Tienda: los tableros y los sets de piezas con precio (precios en src/pieces/shop.ts). Lo comprado se aplica al instante.
export function ShopScreen({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  const { progress, buyPieceSet, buyBoardTheme } = useProgress();
  const { pieceSet, setPieceSet } = usePieceSet();
  const { update } = useSettings();
  const boardTheme = useBoardTheme();

  const boards = (Object.keys(BOARD_THEME_PRICES) as BoardThemeId[]).filter((id) => boardThemePrice(id) > 0);
  const sets = PIECE_SET_LIST.filter((m) => pieceSetPrice(m.id) > 0);

  const confirmBuy = (title: string, price: number, needCoins: string, buy: () => void) => {
    if (progress.coins < price) {
      Alert.alert(t('pieces.needCoins.title'), needCoins);
      return;
    }
    Alert.alert(title, t('pieces.buy.message', { price, left: progress.coins - price }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('pieces.buy.confirm'), onPress: buy },
    ]);
  };

  const pressBoard = (id: BoardThemeId, name: string) => {
    if (isBoardThemeOwned(id, progress.boardThemes)) return update({ boardTheme: id });
    const price = boardThemePrice(id);
    confirmBuy(t('shop.buyBoard.title', { name }), price, t('shop.needCoins.board', { price, coins: progress.coins }), () => {
      if (buyBoardTheme(id, price)) update({ boardTheme: id });
    });
  };

  const pressSet = (id: AnyPieceSetId, name: string) => {
    if (isPieceSetOwned(id, progress.pieceSets)) return setPieceSet(id);
    const price = pieceSetPrice(id);
    confirmBuy(t('pieces.buy.title', { name }), price, t('pieces.needCoins.message', { price, coins: progress.coins }), () => {
      if (buyPieceSet(id, price)) setPieceSet(id);
    });
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: (RNStatusBar.currentHeight ?? 40) + space.sm }]}
    >
      <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel={t('pieces.backLabel')} hitSlop={12}>
        <Text style={styles.back}>{t('pieces.back')}</Text>
      </Pressable>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{t('shop.title')}</Text>
        <View style={styles.balance} accessibilityLabel={t('pieces.balance', { n: progress.coins })}>
          <StatIcon name="coin" size={20} />
          <Text style={styles.balanceText}>{progress.coins}</Text>
        </View>
      </View>
      <Text style={styles.subtitle}>{t('shop.subtitle')}</Text>

      <Text style={styles.section}>{t('shop.boards')}</Text>
      {boards.map((id) => {
        const name = t(`boardTheme.${id}`);
        const owned = isBoardThemeOwned(id, progress.boardThemes);
        const price = boardThemePrice(id);
        const theme = boardThemes[id];
        return (
          <View
            key={id}
            style={styles.card}
            accessible
            accessibilityLabel={owned ? t('shop.ownedLabel', { name }) : t('shop.itemLabel', { name, price })}
          >
            <View style={styles.header}>
              <Text style={styles.name}>{name}</Text>
              <PriceTag owned={owned} price={price} />
            </View>
            <View style={styles.preview}>
              {Array.from({ length: 8 }, (_, i) => (
                <View key={i} style={{ width: BOARD_CELL, height: BOARD_CELL, backgroundColor: i % 2 === 0 ? theme.light : theme.dark }}>
                  <SquareTexture theme={id} light={i % 2 === 0} size={BOARD_CELL} seed={i} />
                </View>
              ))}
            </View>
            <ActionButton owned={owned} inUse={boardTheme === id} onPress={() => pressBoard(id, name)} />
          </View>
        );
      })}

      <Text style={styles.section}>{t('shop.pieces')}</Text>
      {sets.map((m) => {
        const name = t(`pieceSet.${m.id}.name`);
        const description = t(`pieceSet.${m.id}.description`);
        const owned = isPieceSetOwned(m.id, progress.pieceSets);
        const price = pieceSetPrice(m.id);
        // La vista previa va sobre el tablero del mismo estilo si existe (Magma sobre Magma), si no sobre el tablero en uso.
        const previewTheme: BoardThemeId = m.id in boardThemes ? (m.id as BoardThemeId) : boardTheme;
        const theme = boardThemes[previewTheme];
        return (
          <View
            key={m.id}
            style={styles.card}
            accessible
            accessibilityLabel={owned ? t('shop.ownedLabel', { name }) : t('shop.itemLabel', { name, price })}
          >
            <View style={styles.header}>
              <Text style={styles.name}>{name}</Text>
              <PriceTag owned={owned} price={price} />
            </View>
            <Text style={styles.description}>{description}</Text>
            <View style={styles.preview}>
              {PREVIEW.map((p, i) => (
                <View key={i} style={{ width: CELL, height: CELL, backgroundColor: i % 2 === 0 ? theme.light : theme.dark }}>
                  <SquareTexture theme={previewTheme} light={i % 2 === 0} size={CELL} seed={i} />
                  <Piece type={p.type} color={p.color} size={CELL} set={m.id} />
                </View>
              ))}
            </View>
            <ActionButton owned={owned} inUse={pieceSet === m.id} onPress={() => pressSet(m.id, name)} />
          </View>
        );
      })}
    </ScrollView>
  );
}

function PriceTag({ owned, price }: { owned: boolean; price: number }) {
  const { t } = useI18n();
  if (owned) return <Text style={styles.owned}>{t('shop.owned')}</Text>;
  return (
    <View style={styles.price}>
      <StatIcon name="coin" size={16} />
      <Text style={styles.priceText}>{price}</Text>
    </View>
  );
}

function ActionButton({ owned, inUse, onPress }: { owned: boolean; inUse: boolean; onPress: () => void }) {
  const { t } = useI18n();
  if (inUse) return <Text style={styles.inUse}>{t('shop.inUse')}</Text>;
  return <Button3D label={owned ? t('shop.use') : t('shop.buy')} variant={owned ? 'secondary' : 'primary'} onPress={onPress} style={styles.action} />;
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
  section: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.text, marginBottom: space.md },
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.sm },
  name: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.text },
  price: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  priceText: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.gold },
  owned: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted },
  description: { fontFamily: fonts.semibold, fontSize: 14, color: colors.textMuted, marginTop: -space.xs, marginBottom: space.sm },
  preview: { flexDirection: 'row', borderRadius: 8, overflow: 'hidden', alignSelf: 'flex-start', marginBottom: space.md },
  action: { alignSelf: 'stretch' },
  inUse: { fontFamily: fonts.bold, fontSize: 14, color: colors.primary, textAlign: 'center', paddingVertical: space.sm },
});
