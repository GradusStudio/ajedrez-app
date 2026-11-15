import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, fonts, type } from '../../theme';

type Props = {
  /** Precisión de 0 a 100. */
  value: number;
  size: number;
  color: string;
  /** «Precisión», debajo del número. */
  caption: string;
  /** Lo que anuncia el lector («Tu precisión: 85,4»). */
  ariaLabel: string;
  decimal: string;
};

/** Anillo de precisión del resumen: trazo de 10 px a 120, número grande en el centro y «Precisión» debajo. */
export function AccuracyRing({ value, size, color, caption, ariaLabel, decimal }: Props) {
  const stroke = Math.max(6, Math.round((size * 10) / 120));
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View accessible accessibilityLabel={ariaLabel} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }} pointerEvents="none" aria-hidden>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.surfaceRaised} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - pct / 100)}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ fontFamily: fonts.extrabold, fontSize: size >= 120 ? 30 : 24, color: colors.text }}>
        {value.toFixed(1).replace('.', decimal)}
      </Text>
      <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ fontFamily: fonts.bold, fontSize: type.caption, color: colors.textMuted, marginTop: 1 }}>
        {caption}
      </Text>
    </View>
  );
}
