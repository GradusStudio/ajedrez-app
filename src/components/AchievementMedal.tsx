import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { AchievementColor } from '../progress/achievements';
import { colors, fonts } from '../theme';

const DISC: Record<AchievementColor, string> = {
  verde: colors.primary,
  naranja: colors.flame,
  dorado: colors.gold,
  azul: '#4FA3E0',
  violeta: '#9C83B8',
  rojo: colors.danger,
};

/**
 * Medalla de un logro (64 × 68): cinta roja, disco de color con canto, aro claro y un símbolo.
 * Apagada si no se consiguió. El nombre y la descripción los pone la pantalla.
 */
export function AchievementMedal({ color, earned, symbol }: { color: AchievementColor; earned: boolean; symbol: string }) {
  const disc = earned ? DISC[color] : colors.surfaceRaised;
  return (
    <View style={styles.wrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={48} height={22} viewBox="0 0 48 22">
        <Path d="M8 0h32l-5 16-11-5-11 5L8 0Z" fill={earned ? '#C0453A' : colors.surfaceShadow} />
      </Svg>
      <View style={[styles.disc, { backgroundColor: disc }, earned && styles.discEarned]}>
        <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.symbol, { fontSize: symbol.length >= 3 ? 12 : symbol.length === 2 ? 16 : 20 }]}>
          {symbol}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 64, height: 68, alignItems: 'center' },
  disc: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -6,
  },
  discEarned: { borderColor: 'rgba(255, 255, 255, 0.45)' },
  symbol: { fontFamily: fonts.extrabold, color: colors.bg, textAlign: 'center', paddingHorizontal: 3 },
});
