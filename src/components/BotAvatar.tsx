import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Bot, BotStyle } from '../data/bots';
import { boardHighlight, colors, fonts } from '../theme';
import { Circle3D } from './Circle3D';

// Avatar provisional: inicial del bot sobre un círculo con el color de su estilo.
// Los avatares definitivos están pendientes (design.md, sección 8).
const STYLE_COLOR: Record<BotStyle, { bg: string; edge: string }> = {
  tranquilo: { bg: colors.primary, edge: colors.primaryShadow },
  equilibrado: { bg: colors.gold, edge: '#B8901C' },
  posicional: { bg: boardHighlight.pickBorder, edge: '#2F6FA0' },
  agresivo: { bg: colors.danger, edge: colors.dangerShadow },
};

export function BotAvatar({ bot, size = 48 }: { bot: Bot; size?: number }) {
  const c = STYLE_COLOR[bot.style];
  return (
    <Circle3D size={size} color={c.bg} edge={c.edge} depth={3}>
      <Text style={[styles.initial, { fontSize: size * 0.42 }]} accessibilityElementsHidden importantForAccessibility="no">
        {bot.name.replace(/^(Don|Maestro) /, '')[0]}
      </Text>
    </Circle3D>
  );
}

const styles = StyleSheet.create({
  initial: { fontFamily: fonts.extrabold, color: '#FFFFFF' },
});
