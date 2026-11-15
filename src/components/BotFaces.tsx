import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BotAvatar } from './BotAvatar';
import type { Bot } from '../data/bots';
import { colors } from '../theme';

/** Caras de bots superpuestas, como en la ficha del curso y en las tarjetas de Aperturas. */
export function BotFaces({ bots, size = 24 }: { bots: Bot[]; size?: number }) {
  const overlap = -Math.round(size * 0.3);
  return (
    <View style={styles.row}>
      {bots.map((bot, i) => (
        <View key={bot.id} style={[styles.face, { borderRadius: size / 2 + 3 }, i > 0 && { marginLeft: overlap }]}>
          <BotAvatar bot={bot} size={size} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  face: { borderWidth: 2, borderColor: colors.bgBottom },
});
