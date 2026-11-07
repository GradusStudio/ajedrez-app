import React, { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useI18n } from '../i18n/I18nContext';
import { formatScore, whiteShare } from '../engine/evalFormat';
import { boardPixels } from './boardSize';
import { colors, fonts, radius } from '../theme';

/** Barra de evaluación: blanco a la izquierda, negro a la derecha; se desliza al cambiar. */
export function EvalBar({ score, decimal }: { score: number | null; decimal: string }) {
  const { t } = useI18n();
  const share = score === null ? 0.5 : whiteShare(score);
  const [w] = useState(() => new Animated.Value(share));
  useEffect(() => {
    Animated.timing(w, { toValue: share, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [w, share]);
  const label = score === null ? '' : formatScore(score, decimal);
  const whiteAhead = score === null || score >= 0;
  // Mismo ancho que el tablero (Board calcula su tamaño igual).
  const { width } = useWindowDimensions();
  const boardPx = boardPixels(width);
  return (
    <View style={[styles.bar, { width: boardPx }]} accessibilityLabel={label ? t('analysis.evalLabel', { score: label }) : t('analysis.evalPending')}>
      <Animated.View style={[styles.barWhite, { width: w.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
      {!!label && (
        <Text style={[styles.barLabel, whiteAhead ? { left: 8, color: colors.bg } : { right: 8, color: '#FFFFFF' }]}>{label}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 22,
    borderRadius: radius.bar,
    backgroundColor: '#403D39',
    overflow: 'hidden',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 8,
  },
  barWhite: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#F2F2F2' },
  barLabel: { position: 'absolute', fontFamily: fonts.extrabold, fontSize: 12 },
});
