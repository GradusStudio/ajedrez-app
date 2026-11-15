import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';
import Piece from './Piece';
import type { ThemeDiagram as Diagram } from '../puzzles/themeDiagrams';
import { useBoardTheme } from '../settings/useBoardTheme';
import { boardThemes, colors, fonts } from '../theme';

/**
 * Diagrama decorativo de un tema de Puzzles: tablero de 3 × 3 con las piezas del set del usuario y
 * flechas doradas. No lleva etiqueta propia: el botón del tema ya la tiene completa.
 */
export function ThemeDiagram({ diagram, size = 58, mate }: { diagram: Diagram; size?: number; mate?: number }) {
  const themeId = useBoardTheme();
  const theme = boardThemes[themeId];
  const cell = size / 3;
  return (
    <View
      style={{ width: size, height: size, borderRadius: 8, overflow: 'hidden' }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={styles.grid}>
        {Array.from({ length: 9 }, (_, i) => {
          const row = Math.floor(i / 3);
          const col = i % 3;
          const light = (row + col) % 2 === 0;
          return (
            <View
              key={i}
              style={{
                width: cell,
                height: cell,
                backgroundColor: light ? theme.light : theme.dark,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {diagram.pieces
                .filter((p) => p.at[0] === row && p.at[1] === col)
                .map((p, j) => (
                  <Piece key={j} type={p.type} color={p.color} size={cell * 0.95} />
                ))}
            </View>
          );
        })}
      </View>
      <Svg style={StyleSheet.absoluteFill} width={size} height={size} viewBox="0 0 3 3" pointerEvents="none">
        {diagram.arrows.map((a, i) => {
          const x1 = a.from[1] + 0.5;
          const y1 = a.from[0] + 0.5;
          const x2 = a.to[1] + 0.5;
          const y2 = a.to[0] + 0.5;
          const dx = x2 - x1;
          const dy = y2 - y1;
          const len = Math.hypot(dx, dy) || 1;
          const ux = dx / len;
          const uy = dy / len;
          const ax = x2 - ux * 0.24;
          const ay = y2 - uy * 0.24;
          const px = -uy;
          const py = ux;
          const head = `M${x2},${y2} L${ax + px * 0.16},${ay + py * 0.16} L${ax - px * 0.16},${ay - py * 0.16} Z`;
          return (
            <React.Fragment key={i}>
              <Line x1={x1} y1={y1} x2={ax} y2={ay} stroke={colors.gold} strokeWidth={0.07} strokeLinecap="round" />
              <Path d={head} fill={colors.gold} />
            </React.Fragment>
          );
        })}
      </Svg>
      {mate !== undefined && (
        <View style={styles.mate}>
          <Text style={styles.mateText}>{mate}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  mate: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    paddingHorizontal: 3,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mateText: { fontFamily: fonts.extrabold, fontSize: 9, color: '#FFFFFF' },
});
