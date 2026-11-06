import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path, Polygon } from 'react-native-svg';
import { useI18n } from '../../i18n/I18nContext';
import { colors } from '../../theme';
import { styles } from './reviewStyles';

export type IconName = 'back' | 'next' | 'star' | 'sliders' | 'first' | 'last' | 'play' | 'pause' | 'close';

/** Iconos simples de la pantalla (24 × 24), dibujados con SVG para no depender de emojis. */
export function Icon({ name, color, size = 24 }: { name: IconName; color: string; size?: number }) {
  const line = { stroke: color, strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } as const;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'back' && <Path d="M15 5l-7 7 7 7" {...line} />}
      {name === 'next' && <Path d="M9 5l7 7-7 7" {...line} />}
      {name === 'close' && <Path d="M6 6l12 12M18 6L6 18" {...line} />}
      {name === 'star' && <Polygon points="12,2.5 14.9,9 22,9.6 16.6,14.3 18.2,21.2 12,17.5 5.8,21.2 7.4,14.3 2,9.6 9.1,9" fill={color} />}
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
      {name === 'play' && <Polygon points="7,4 20,12 7,20" fill={color} />}
      {name === 'pause' && <Path d="M7 5h4v14H7zM13 5h4v14h-4z" fill={color} />}
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

/** Botón de la barra inferior: icono arriba, texto abajo (apagado si no hay nada que mostrar). */
export function ToolBtn({ icon, label, onPress, disabled }: { icon: IconName; label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [styles.tool, disabled && { opacity: 0.35 }, pressed && { opacity: 0.6 }]}
    >
      <Icon name={icon} color={colors.textMuted} size={22} />
      <Text style={styles.toolLabel} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Barra superior: volver · título · ajustes (los ajustes solo aparecen con la revisión empezada). */
export function TopBar({ onBack, onSettings }: { onBack: () => void; onSettings?: () => void }) {
  const { t } = useI18n();
  return (
    <View style={styles.topBar}>
      <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel={t('analysisMenu.back')} hitSlop={12} style={styles.topBtn}>
        <Icon name="back" color={colors.text} />
      </Pressable>
      <Text style={styles.topTitle} numberOfLines={1}>
        {t('review.title')}
      </Text>
      {onSettings ? (
        <Pressable onPress={onSettings} accessibilityRole="button" accessibilityLabel={t('review.settings')} hitSlop={12} style={styles.topBtn}>
          <Icon name="sliders" color={colors.text} />
        </Pressable>
      ) : (
        <View style={styles.topBtn} />
      )}
    </View>
  );
}
