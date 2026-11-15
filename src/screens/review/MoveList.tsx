import React, { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useI18n } from '../../i18n/I18nContext';
import { moveNumber } from '../../review/bestLine';
import type { ReviewPly } from '../../review/types';
import { colors, fonts, radius, space, type } from '../../theme';
import { badgeOf } from './quality';

type Props = {
  plies: ReviewPly[];
  idx: number;
  /** Con una variante propia no se marca ninguna jugada de la partida. */
  inBranch: boolean;
  fmt: (san: string) => string;
  onGo: (ply: number) => void;
};

/** Lista de jugadas del panel (spec 2026-11-15): número, símbolo y jugada; la actual en dorado, con scroll propio. */
export function MoveList({ plies, idx, inBranch, fmt, onGo }: Props) {
  const { t } = useI18n();
  const ref = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const rows = useRef<Record<number, number>>({});

  useEffect(() => {
    const y = rows.current[idx];
    if (y !== undefined) ref.current?.scrollTo({ y: Math.max(0, y - 60), animated: true });
  }, [idx]);

  return (
    <ScrollView ref={ref} style={styles.box} contentContainerStyle={styles.content} nestedScrollEnabled showsVerticalScrollIndicator>
      {plies.map((p, i) => {
        const badge = badgeOf(p);
        const current = idx === i + 1 && !inBranch;
        const no = moveNumber(p.move.fenBefore);
        const showNo = p.move.color === 'w' || i === 0;
        return (
          <Pressable
            key={p.ply}
            onPress={() => onGo(i + 1)}
            onLayout={(e) => {
              rows.current[i + 1] = e.nativeEvent.layout.y;
            }}
            accessibilityRole="button"
            accessibilityLabel={`${p.move.color === 'w' ? `${no}. ` : i === 0 ? `${no}... ` : ''}${fmt(p.move.san)}`}
            style={[styles.row, current && styles.current]}
          >
            <Text style={styles.no}>{showNo ? (p.move.color === 'w' ? `${no}.` : `${no}...`) : ''}</Text>
            <Text style={[styles.badge, badge ? { color: badge.color } : null]}>{badge?.label ?? ''}</Text>
            <Text style={[styles.move, current && styles.moveCurrent]}>{fmt(p.move.san)}</Text>
          </Pressable>
        );
      })}
      {plies.length === 0 && <Text style={styles.empty}>{t('lesson.line.noMoves')}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  box: {
    maxHeight: 260,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.surfaceShadow,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  content: { padding: 6, gap: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  current: { backgroundColor: 'rgba(247,198,49,.18)', borderColor: colors.gold },
  no: { width: 30, fontFamily: fonts.bold, fontSize: type.caption, color: colors.textMuted },
  badge: { width: 18, textAlign: 'center', fontFamily: fonts.extrabold, fontSize: type.caption },
  move: { fontFamily: fonts.bold, fontSize: type.secondary, color: colors.text },
  moveCurrent: { color: colors.gold },
  empty: { fontFamily: fonts.semibold, fontSize: type.secondary, color: colors.textMuted, padding: space.sm },
});
