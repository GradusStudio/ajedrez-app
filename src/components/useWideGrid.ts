import { StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { space } from '../theme';
import { useWideLayout } from './useWideLayout';

export type WideGrid = {
  wide: boolean;
  gridStyle: StyleProp<ViewStyle>;
  cardStyle: StyleProp<ViewStyle>;
};

/** Estilos de la grilla de dos columnas de pantalla ancha; undefined en el celular y en ventanas angostas. */
export function useWideGrid(): WideGrid {
  const wide = useWideLayout();
  return {
    wide,
    gridStyle: wide ? styles.grid : undefined,
    cardStyle: wide ? styles.cardWide : undefined,
  };
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: space.md },
  cardWide: { width: '48%', marginBottom: 0 },
});
