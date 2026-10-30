import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';
import { Bot, BotStyle } from '../data/bots';
import { boardHighlight, colors, fonts } from '../theme';
import { Circle3D } from './Circle3D';

// Avatar del bot: su personaje sobre un círculo con el color de su estilo (design.md, sección 8).
// Los bots que todavía no tienen personaje muestran su inicial.
const STYLE_COLOR: Record<BotStyle, { bg: string; edge: string }> = {
  tranquilo: { bg: colors.primary, edge: colors.primaryShadow },
  equilibrado: { bg: colors.gold, edge: '#B8901C' },
  posicional: { bg: boardHighlight.pickBorder, edge: '#2F6FA0' },
  agresivo: { bg: colors.danger, edge: colors.dangerShadow },
};

// Imágenes cuadradas con fondo transparente, hechas con ChatGPT (ver Créditos).
const AVATARS: Record<string, ImageSourcePropType> = {
  ada: require('../../assets/bots/ada.webp'),
};

// El personaje se achica un poco y se apoya abajo: así las puntas de las orejas entran en el círculo.
const IMAGE_SCALE = 0.89;

export function BotAvatar({ bot, size = 48 }: { bot: Bot; size?: number }) {
  const c = STYLE_COLOR[bot.style];
  const avatar = AVATARS[bot.id];
  const image = size * IMAGE_SCALE;
  return (
    <Circle3D size={size} color={c.bg} edge={c.edge} depth={3}>
      {avatar ? (
        <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
          <Image
            source={avatar}
            style={{ position: 'absolute', width: image, height: image, left: (size - image) / 2, top: size - image }}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        </View>
      ) : (
        <Text style={[styles.initial, { fontSize: size * 0.42 }]} accessibilityElementsHidden importantForAccessibility="no">
          {bot.name.replace(/^(Don|Maestro) /, '')[0]}
        </Text>
      )}
    </Circle3D>
  );
}

const styles = StyleSheet.create({
  initial: { fontFamily: fonts.extrabold, color: '#FFFFFF' },
});
