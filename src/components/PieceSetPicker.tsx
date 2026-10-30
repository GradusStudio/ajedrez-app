import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { PIECE_SET_META, PieceSetId } from '../pieces/pieceSets';
import { isPieceSetOwned, pieceSetPrice } from '../pieces/shop';
import { useProgress } from '../progress/ProgressContext';
import { usePieceSet } from '../settings/PieceSetContext';
import { useSettings } from '../settings/SettingsContext';
import { boardThemes, colors, fonts, radius, space } from '../theme';
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
  const { pieceSet, setPieceSet } = usePieceSet();
  const { progress, buyPieceSet } = useProgress();
  const board = boardThemes[useSettings().settings.boardTheme];

  const choose = (id: PieceSetId, name: string) => {
    if (isPieceSetOwned(id, progress.pieceSets)) return setPieceSet(id);
    const price = pieceSetPrice(id);
    if (progress.coins < price) {
      Alert.alert(
        'Te faltan monedas',
        `Este set cuesta ${price} monedas y tienes ${progress.coins}. Ganas monedas con lecciones nuevas, puzzles, partidas ganadas y la meta diaria.`
      );
      return;
    }
    Alert.alert(`¿Comprar «${name}»?`, `Cuesta ${price} monedas. Te quedan ${progress.coins - price}.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Comprar', onPress: () => buyPieceSet(id, price) && setPieceSet(id) },
    ]);
  };

  return (
    <View>
      {PIECE_SET_META.map((m) => {
        const selected = m.id === pieceSet;
        const owned = isPieceSetOwned(m.id, progress.pieceSets);
        const price = pieceSetPrice(m.id);
        return (
          <Pressable
            key={m.id}
            onPress={() => choose(m.id, m.name)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`${m.name}. ${m.description}${owned ? '' : `. Cuesta ${price} monedas`}`}
            style={[styles.card, selected && styles.cardSelected]}
          >
            <View style={styles.header}>
              <Text style={styles.name}>{m.name}</Text>
              {selected && <Text style={styles.check}>✓ En uso</Text>}
              {!owned && (
                <View style={styles.price}>
                  <StatIcon name="coin" size={16} />
                  <Text style={styles.priceText}>{price}</Text>
                </View>
              )}
            </View>
            <Text style={styles.description}>{m.description}</Text>
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
