import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';
import { Bot, BotStyle } from '../data/bots';
import { boardHighlight, colors, fonts } from '../theme';
import { Circle3D } from './Circle3D';
import { BOT_EXPRESSIONS } from './botExpressions.generated';
import { BotExpression, expressionSource } from './botFace';

// Avatar del bot: su personaje sobre un círculo con el color de su estilo (design.md, sección 8).
// Un bot sin imagen en AVATARS muestra su inicial.
const STYLE_COLOR: Record<BotStyle, { bg: string; edge: string }> = {
  tranquilo: { bg: colors.primary, edge: colors.primaryShadow },
  equilibrado: { bg: colors.gold, edge: '#B8901C' },
  posicional: { bg: boardHighlight.pickBorder, edge: '#2F6FA0' },
  agresivo: { bg: colors.danger, edge: colors.dangerShadow },
};

// Imágenes cuadradas con fondo transparente, hechas con ChatGPT (ver Créditos).
// `scale`: tamaño del personaje respecto del círculo. Ada se achica y se apoya abajo para que
// las puntas de las orejas entren; las que ya vienen recortadas en círculo lo llenan entero.
const AVATARS: Record<string, { source: ImageSourcePropType; scale: number }> = {
  ada: { source: require('../../assets/bots/ada.webp'), scale: 0.89 },
  ivo: { source: require('../../assets/bots/ivo.webp'), scale: 1 },
  sofia: { source: require('../../assets/bots/sofia.webp'), scale: 1 },
  bruno: { source: require('../../assets/bots/bruno.webp'), scale: 1 },
  camila: { source: require('../../assets/bots/camila.webp'), scale: 1 },
  ramiro: { source: require('../../assets/bots/ramiro.webp'), scale: 1 },
  valentina: { source: require('../../assets/bots/valentina.webp'), scale: 1 },
  tomas: { source: require('../../assets/bots/tomas.webp'), scale: 1 },
  lola: { source: require('../../assets/bots/lola.webp'), scale: 1 },
  pipo: { source: require('../../assets/bots/pipo.webp'), scale: 1 },
};

// `expression`: cara del bot (explica, piensa, acierto, pista); sin imagen para esa cara, muestra el avatar.
export function BotAvatar({ bot, size = 48, expression }: { bot: Bot; size?: number; expression?: BotExpression }) {
  const c = STYLE_COLOR[bot.style];
  const avatar = AVATARS[bot.id];
  const image = size * (avatar?.scale ?? 1);
  return (
    <Circle3D size={size} color={c.bg} edge={c.edge} depth={3}>
      {avatar ? (
        <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
          <Image
            source={expressionSource(BOT_EXPRESSIONS, bot.id, expression, avatar.source)}
            style={{ position: 'absolute', width: image, height: image, left: (size - image) / 2, top: size - image }}
            fadeDuration={0}
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
