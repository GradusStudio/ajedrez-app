import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PIECE_SET_META } from '../pieces/pieceSets';
import { usePieceSet } from '../settings/PieceSetContext';
import { useSettings } from '../settings/SettingsContext';
import { boardThemes, colors, fonts, radius, space } from '../theme';
import Piece, { PieceColor, PieceType } from './Piece';

const PREVIEW: { type: PieceType; color: PieceColor }[] = [
  { type: 'k', color: 'w' },
  { type: 'q', color: 'b' },
  { type: 'b', color: 'w' },
  { type: 'n', color: 'b' },
  { type: 'r', color: 'w' },
  { type: 'p', color: 'b' },
];
const CELL = 46;

/** Lista de sets con vista previa sobre casillas del tablero. Al tocar uno, se guarda y se aplica en toda la app. */
export function PieceSetPicker() {
  const { pieceSet, setPieceSet } = usePieceSet();
  const board = boardThemes[useSettings().settings.boardTheme];

  return (
    <View>
      {PIECE_SET_META.map((m) => {
        const selected = m.id === pieceSet;
        return (
          <Pressable
            key={m.id}
            onPress={() => setPieceSet(m.id)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`${m.name}. ${m.description}`}
            style={[styles.card, selected && styles.cardSelected]}
          >
            <View style={styles.header}>
              <Text style={styles.name}>{m.name}</Text>
              {selected && <Text style={styles.check}>✓ En uso</Text>}
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
  description: { fontFamily: fonts.semibold, fontSize: 14, color: colors.textMuted, marginTop: 2, marginBottom: space.sm },
  preview: { flexDirection: 'row', borderRadius: 8, overflow: 'hidden', alignSelf: 'flex-start' },
});
