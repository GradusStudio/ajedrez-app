import React, { useEffect, useRef } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { ReviewPly } from '../../review/types';
import { movePrefix } from '../../review/bestLine';
import { colors } from '../../theme';
import { badgeOf } from '../../review/quality';
import { styles } from './reviewStyles';

type Props = {
  plies: ReviewPly[];
  idx: number;
  /** Con una variante propia en el tablero no se marca ninguna jugada de la partida. */
  inBranch: boolean;
  fmt: (san: string) => string;
  onGo: (ply: number) => void;
};

/** Tira horizontal de jugadas del celular. La navegación la hacen los cuatro botones de `NavButtons`. */
export function MoveStrip({ plies, idx, inBranch, fmt, onGo }: Props) {
  const stripRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const chipPos = useRef<Record<number, { x: number; w: number }>>({});

  useEffect(() => {
    const p = chipPos.current[idx];
    stripRef.current?.scrollTo({ x: idx === 0 || !p ? 0 : Math.max(0, p.x - 90), animated: true });
  }, [idx]);

  return (
    <>
      <View style={styles.strip}>
        <ScrollView ref={stripRef} horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={styles.stripContent}>
          {plies.map((p, i) => {
            const b = badgeOf(p);
            const current = idx === i + 1 && !inBranch;
            // El número sale del FEN de la jugada: sirve también si las negras mueven primero.
            const prefix = movePrefix(p.move);
            const showNo = p.move.color === 'w' || i === 0;
            return (
              <Pressable
                key={p.ply}
                onPress={() => onGo(i + 1)}
                onLayout={(e) => {
                  const pos = { x: e.nativeEvent.layout.x, w: e.nativeEvent.layout.width };
                  chipPos.current[i + 1] = pos;
                  // Montada directamente en una jugada (por ejemplo desde el gráfico): la tira arranca en ella.
                  if (i + 1 === idx) stripRef.current?.scrollTo({ x: Math.max(0, pos.x - 90), animated: false });
                }}
                accessibilityRole="button"
                accessibilityLabel={`${prefix} ${fmt(p.move.san)}`}
                style={[styles.moveChip, current && styles.moveChipCurrent]}
              >
                {showNo && <Text style={styles.moveNo}>{prefix}</Text>}
                {b && <Text style={[styles.moveBadge, { color: b.color }]}>{b.label}</Text>}
                <Text style={[styles.moveText, current && { color: colors.text }]}>{fmt(p.move.san)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </>
  );
}
