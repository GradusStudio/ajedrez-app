import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../../i18n/I18nContext';
import { colors, fonts, radius, space, type } from '../../theme';
import type { Filter } from './useReviewPlayback';

type Props = { value: Filter; onChange: (f: Filter) => void };

/** Filtro del panel: dos pastillas; la elegida lleva el borde primary. Sigue decidiendo a dónde salta el principal. */
export function FilterPills({ value, onChange }: Props) {
  const { t } = useI18n();
  const options: { value: Filter; label: string }[] = [
    { value: 'highlights', label: t('review.filterHighlights') },
    { value: 'all', label: t('review.filterAll') },
  ];
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {options.map((o) => {
        const on = value === o.value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={[styles.pill, on && styles.pillOn]}
          >
            <Text style={[styles.text, on && styles.textOn]} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm },
  pill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceShadow,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  pillOn: { borderColor: colors.primary },
  text: { fontFamily: fonts.bold, fontSize: type.caption, color: colors.textMuted },
  textOn: { color: colors.text },
});
