import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { MiniBoard } from './MiniBoard';
import type { ProfileUnit } from '../profile/profileView';
import { cardSkin, type, colors, fonts, radius, space } from '../theme';

type Props = {
  card: ProfileUnit;
  pieces: Parameters<typeof MiniBoard>[0]['pieces'];
  lastMove?: { from: string; to: string } | null;
  /** Rótulo «UNIDAD 3 · completa / en curso». */
  kicker: string;
  /** «2 de 7 lecciones». */
  count: string;
  label: string;
  onPress: () => void;
};

/** Tarjeta de una unidad en «Tu camino»: tablero de progreso de 64 px, rótulo, nombre y barra. */
export function ProfileUnitCard({ card, pieces, lastMove, kicker, count, label, onPress }: Props) {
  const pct = card.total > 0 ? (card.done / card.total) * 100 : 0;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.card, card.state === 'current' && styles.current, card.state === 'locked' && styles.locked]}
    >
      <View style={styles.top}>
        <MiniBoard size={64} corner="a1" span={8} pieces={pieces} lastMove={lastMove ?? undefined} />
        <View style={styles.head}>
          <View style={styles.kickerRow}>
            <Text style={styles.kicker} numberOfLines={1}>
              {kicker}
            </Text>
            {card.state === 'locked' && <Lock />}
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {card.unit.title}
          </Text>
        </View>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }, card.state === 'complete' && styles.fillGold]} />
      </View>
      <Text style={styles.count}>{count}</Text>
    </Pressable>
  );
}

function Lock() {
  return (
    <Svg width={14} height={16} viewBox="0 0 12 14" accessibilityElementsHidden>
      <Path d="M3 6V4a3 3 0 0 1 6 0v2" fill="none" stroke={colors.textMuted} strokeWidth={1.6} />
      <Rect x={2} y={6} width={8} height={7} rx={1.5} fill={colors.textMuted} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  card: { ...cardSkin, borderRadius: radius.control, borderWidth: 2, padding: space.md, gap: space.sm },
  current: { borderColor: colors.primary },
  locked: { opacity: 0.55 },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  head: { flex: 1, minWidth: 0 },
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  kicker: { flexShrink: 1, fontFamily: fonts.extrabold, fontSize: 12, color: colors.primary, letterSpacing: 0.5, textTransform: 'uppercase' },
  title: { fontFamily: fonts.extrabold, fontSize: 15, lineHeight: 19, color: colors.text, marginTop: 2 },
  track: { height: 5, borderRadius: 3, backgroundColor: colors.surfaceRaised, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3, backgroundColor: colors.primary },
  fillGold: { backgroundColor: colors.gold },
  count: { fontFamily: fonts.semibold, fontSize: type.caption, color: colors.textMuted },
});
