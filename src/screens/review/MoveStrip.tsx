import React, { useEffect, useRef } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useI18n } from '../../i18n/I18nContext';
import type { ReviewPly } from '../../review/types';
import { colors } from '../../theme';
import { badgeOf } from './quality';
import { Icon } from './ReviewParts';
import { styles } from './reviewStyles';

type Props = {
  plies: ReviewPly[];
  idx: number;
  /** Con una variante propia en el tablero no se marca ninguna jugada de la partida. */
  inBranch: boolean;
  fmt: (san: string) => string;
  onGo: (ply: number) => void;
  onPrev: () => void;
  onNext: () => void;
};

/** Tira de jugadas que sigue a la jugada actual, con flechas y saltos al inicio y al final. */
export function MoveStrip({ plies, idx, inBranch, fmt, onGo, onPrev, onNext }: Props) {
  const { t } = useI18n();
  const stripRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const chipPos = useRef<Record<number, { x: number; w: number }>>({});

  useEffect(() => {
    const p = chipPos.current[idx];
    stripRef.current?.scrollTo({ x: idx === 0 || !p ? 0 : Math.max(0, p.x - 90), animated: true });
  }, [idx]);

  return (
    <>
      <View style={styles.strip}>
        <Pressable onPress={onPrev} accessibilityRole="button" accessibilityLabel={t('review.ctrlPrev')} hitSlop={10} style={styles.stripArrow}>
          <Icon name="back" color={colors.textMuted} />
        </Pressable>
        <ScrollView ref={stripRef} horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={styles.stripContent}>
          {plies.map((p, i) => {
            const b = badgeOf(p);
            const current = idx === i + 1 && !inBranch;
            return (
              <Pressable
                key={p.ply}
                onPress={() => onGo(i + 1)}
                onLayout={(e) => {
                  chipPos.current[i + 1] = { x: e.nativeEvent.layout.x, w: e.nativeEvent.layout.width };
                }}
                accessibilityRole="button"
                accessibilityLabel={`${p.move.color === 'w' ? Math.floor(i / 2) + 1 + '. ' : ''}${fmt(p.move.san)}`}
                style={[styles.moveChip, current && styles.moveChipCurrent]}
              >
                {p.move.color === 'w' && <Text style={styles.moveNo}>{Math.floor(i / 2) + 1}.</Text>}
                {b && <Text style={[styles.moveBadge, { color: b.color }]}>{b.label}</Text>}
                <Text style={[styles.moveText, current && { color: colors.text }]}>{fmt(p.move.san)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <Pressable onPress={onNext} accessibilityRole="button" accessibilityLabel={t('review.ctrlNext')} hitSlop={10} style={styles.stripArrow}>
          <Icon name="next" color={colors.textMuted} />
        </Pressable>
      </View>
      <View style={styles.stripEnds}>
        <Pressable onPress={() => onGo(0)} accessibilityRole="button" accessibilityLabel={t('review.ctrlStart')} hitSlop={8} style={styles.endBtn}>
          <Icon name="first" color={colors.textMuted} size={20} />
        </Pressable>
        <Pressable onPress={() => onGo(plies.length)} accessibilityRole="button" accessibilityLabel={t('review.ctrlEnd')} hitSlop={8} style={styles.endBtn}>
          <Icon name="last" color={colors.textMuted} size={20} />
        </Pressable>
      </View>
    </>
  );
}
