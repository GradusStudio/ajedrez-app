import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, space } from '../theme';

type Option<T extends string | number> = { value: T; label: string; sub?: string };

type Props<T extends string | number> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

/** Selector de opciones del mismo ancho (design.md, "Selector de dos opciones"). */
export function Segmented<T extends string | number>({ options, value, onChange }: Props<T>) {
  return (
    <View style={styles.row}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={o.sub ? `${o.label}, ${o.sub}` : o.label}
            style={[styles.segment, selected && styles.selected]}
          >
            <Text style={[styles.label, selected && { color: colors.text }]}>{o.label}</Text>
            {!!o.sub && <Text style={styles.sub}>{o.sub}</Text>}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    backgroundColor: colors.surface,
  },
  selected: { borderColor: colors.primary, backgroundColor: colors.surfaceRaised },
  label: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.textMuted },
  sub: { fontFamily: fonts.semibold, fontSize: 11, color: colors.textMuted },
});
