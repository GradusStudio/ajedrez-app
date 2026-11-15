import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { sanFromSpanish, resolveNotation } from '../chess/notation';
import { Board } from './Board';
import { BoardSizeContext } from './BoardSizeContext';
import { Circle3D } from './Circle3D';
import { useI18n } from '../i18n/I18nContext';
import { lineNotation, type CourseLine } from '../openings/courseView';
import { useSettings } from '../settings/SettingsContext';
import { type, colors, fonts, radius, space } from '../theme';

type Props = {
  line: CourseLine;
  orientation: 'w' | 'b';
  /** Lado del tablero en px (440 en pantalla ancha; el ancho disponible en el celular). */
  size: number;
};

/**
 * Tablero de la línea principal del curso con su visor (tarea 32, spec «aperturas y volver», sección 2): abre en
 * la posición final con la última jugada resaltada, ‹ › recorren las jugadas y la notación completa queda debajo,
 * con la jugada actual en dorado y las siguientes atenuadas.
 */
export function CourseBoard({ line, orientation, size }: Props) {
  const { t, language } = useI18n();
  const { settings } = useSettings();
  const san = (s: string) => sanFromSpanish(s, resolveNotation(settings.notation, language));
  const last = Math.max(0, line.frames.length - 1);
  const [at, setAt] = useState(last);
  const frame = line.frames[Math.min(at, last)];
  const tokens = lineNotation({ fen: line.startFen, moves: line.moves });
  const current = at > 0 ? tokens[at - 1] : null;
  const positionLabel = current
    ? t('openings.positionAt', { move: `${current.no}${current.white ? '.' : '…'} ${san(current.san)}` })
    : t('openings.positionStart');

  const step = (delta: number) => setAt((value) => Math.min(last, Math.max(0, value + delta)));

  return (
    <View style={styles.wrap}>
      <Text style={styles.srOnly} accessibilityLabel={positionLabel}>{positionLabel}</Text>
      <BoardSizeContext.Provider value={size}>
        <Board fen={frame.fen} orientation={orientation} interactive={false} lastMove={frame.last} />
      </BoardSizeContext.Provider>

      <View style={styles.viewer}>
        <ViewerButton label={t('review.ctrlPrev')} glyph="‹" disabled={at <= 0} onPress={() => step(-1)} />
        <ViewerButton label={t('review.ctrlNext')} glyph="›" disabled={at >= last} onPress={() => step(1)} />
      </View>

      <View style={styles.notation}>
        {tokens.map((token, i) => {
          const isCurrent = i === at - 1;
          const upcoming = i >= at;
          return (
            <Text
              key={`${token.no}-${token.white ? 'w' : 'b'}-${token.san}`}
              style={[styles.token, isCurrent && styles.tokenCurrent, upcoming && styles.tokenUpcoming]}
            >
              {token.white ? `${token.no}. ` : i === 0 ? `${token.no}… ` : ''}
              {san(token.san)}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

function ViewerButton({ label, glyph, disabled, onPress }: { label: string; glyph: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      hitSlop={6}
      style={disabled && styles.off}
    >
      {(state) => {
        const pressed = (state as { pressed?: boolean }).pressed;
        return (
          <Circle3D size={44} color={colors.surfaceRaised} edge={colors.surfaceShadow} depth={4} pressed={pressed}>
            <Text style={styles.glyph}>{glyph}</Text>
          </Circle3D>
        );
      }}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', alignItems: 'center', gap: space.md },
  srOnly: { position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0 },
  viewer: { flexDirection: 'row', gap: space.sm },
  off: { opacity: 0.4 },
  glyph: { fontFamily: fonts.extrabold, fontSize: 22, lineHeight: 24, color: colors.text },
  notation: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    columnGap: 6,
    rowGap: 2,
  },
  token: { fontFamily: fonts.bold, fontSize: type.secondary, color: colors.text },
  tokenCurrent: { fontFamily: fonts.extrabold, color: colors.gold },
  tokenUpcoming: { color: colors.textMuted, opacity: 0.55 },
});
