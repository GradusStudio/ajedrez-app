import React from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, Path, Polygon } from 'react-native-svg';
import { BackButton } from '../../components/BackButton';
import { useI18n } from '../../i18n/I18nContext';
import { colors } from '../../theme';
import { styles } from './reviewStyles';

export type IconName = 'back' | 'next' | 'sliders' | 'first' | 'last' | 'close';

/** Iconos de la revisión (24 × 24), dibujados con SVG para no depender de emojis. */
export function Icon({ name, color, size = 24 }: { name: IconName; color: string; size?: number }) {
  const line = { stroke: color, strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } as const;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'back' && <Path d="M15 5l-7 7 7 7" {...line} />}
      {name === 'next' && <Path d="M9 5l7 7-7 7" {...line} />}
      {name === 'close' && <Path d="M6 6l12 12M18 6L6 18" {...line} />}
      {name === 'first' && (
        <>
          <Path d="M6 5v14" {...line} />
          <Polygon points="19,5 9,12 19,19" fill={color} />
        </>
      )}
      {name === 'last' && (
        <>
          <Path d="M18 5v14" {...line} />
          <Polygon points="5,5 15,12 5,19" fill={color} />
        </>
      )}
      {name === 'sliders' && (
        <>
          <Path d="M4 7h16M4 17h16" {...line} />
          <Circle cx={9} cy={7} r={2.6} {...line} fill={colors.bg} />
          <Circle cx={15} cy={17} r={2.6} {...line} fill={colors.bg} />
        </>
      )}
    </Svg>
  );
}

/** Barra del rediseño (spec 2026-11-15, sección 1): BackButton de la app y el engranaje como botón redondo. */
export function ReviewTop({ onBack, onSettings, backLabel, backAria }: { onBack: () => void; onSettings: () => void; backLabel: string; backAria: string }) {
  const { t } = useI18n();
  return (
    <View style={styles.topBar}>
      <BackButton screen={backLabel} label={backAria} onPress={onBack} />
      <Pressable onPress={onSettings} accessibilityRole="button" accessibilityLabel={t('review.settings')} hitSlop={10} style={styles.gear}>
        <Icon name="sliders" color={colors.text} size={22} />
      </Pressable>
    </View>
  );
}
