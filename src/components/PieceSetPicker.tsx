import React from 'react';
import { showDialog } from './dialog';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n/I18nContext';
import { AnyPieceSetId, PIECE_SET_LIST } from '../pieces/materials';
import { isPieceSetOwned, pieceSetPrice } from '../pieces/shop';
import { useProgress } from '../progress/ProgressContext';
import { usePieceSet } from '../settings/PieceSetContext';
import { useBoardTheme } from '../settings/useBoardTheme';
import { boardThemes, colors, fonts, radius, space } from '../theme';
import { SquareTexture } from './SquareTexture';
import Piece, { PieceColor, PieceType } from './Piece';
import { StatIcon } from './StatIcon';

const PREVIEW: { type: PieceType; color: PieceColor }[] = [
  { type: 'k', color: 'w' },
  { type: 'q', color: 'b' },
  { type: 'b', color: 'w' },
  { type: 'n', color: 'b' },
  { type: 'r', color: 'w' },
  { type: 'p', color: 'b' },
];
const CELL = 46;

/**
 * Lista de sets con vista previa sobre casillas del tablero. Al tocar uno propio, se guarda y se aplica en toda
 * la app; uno de pago pide confirmar la compra con monedas.
 */
export function PieceSetPicker() {
  const { t } = useI18n();
  const { pieceSet, setPieceSet } = usePieceSet();
  const { progress, buyPieceSet } = useProgress();
  const boardTheme = useBoardTheme();
  const board = boardThemes[boardTheme];

  const choose = (id: AnyPieceSetId, name: string) => {
    if (isPieceSetOwned(id, progress.pieceSets)) return setPieceSet(id);
    const price = pieceSetPrice(id);
    if (progress.coins < price) {
      showDialog(t('pieces.needCoins.title'), t('pieces.needCoins.message', { price, coins: progress.coins }));
      return;
    }
    showDialog(t('pieces.buy.title', { name }), t('pieces.buy.message', { price, left: progress.coins - price }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('pieces.buy.confirm'), onPress: () => buyPieceSet(id, price) && setPieceSet(id) },
    ]);
  };

  return (
    <View>
      {PIECE_SET_LIST.map((m) => {
        const selected = m.id === pieceSet;
        const owned = isPieceSetOwned(m.id, progress.pieceSets);
        const price = pieceSetPrice(m.id);
        const name = t(`pieceSet.${m.id}.name`);
        const description = t(`pieceSet.${m.id}.description`);
        return (
          <Pressable
            key={m.id}
            onPress={() => choose(m.id, name)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={owned ? t('pieces.label', { name, description }) : t('pieces.labelPriced', { name, description, price })}
            style={[styles.card, selected && styles.cardSelected]}
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
            <Text style={styles.description}>{description}</Text>
            <View style={styles.preview}>
              {PREVIEW.map((p, i) => (
                <View
                  key={i}
                  style={{
                    width: CELL,
                    height: CELL,
                    backgroundColor: i % 2 === 0 ? board.light : board.dark,
                  }}
                >
                  <SquareTexture theme={boardTheme} light={i % 2 === 0} size={CELL} seed={i} />
                  <Piece type={p.type} color={p.color} size={CELL} set={m.id} />
                </View>
              ))}
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.text },
  check: { fontFamily: fonts.bold, fontSize: 14, color: colors.primary },
  price: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  priceText: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.gold },
  description: { fontFamily: fonts.semibold, fontSize: 14, color: colors.textMuted, marginTop: 2, marginBottom: space.sm },
  preview: { flexDirection: 'row', borderRadius: 8, overflow: 'hidden', alignSelf: 'flex-start' },
});
