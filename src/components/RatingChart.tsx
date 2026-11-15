import React, { useId, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Line, Path, Stop, Text as SvgText } from 'react-native-svg';
import { colors } from '../theme';

type Point = { at: string; rating: number };

const H = 120;
const PAD_X = 8;
const PAD_TOP = 18;
const PAD_BOTTOM = 12;

/**
 * Gráfico de línea del nivel de puzzles (spec del perfil, sección 3): línea dorada con área, dos guías
 * con su valor y un punto en el último. Sin ejes ni leyendas extra. El ancho se mide al dibujar.
 */
export function RatingChart({ points, label }: { points: Point[]; label: string }) {
  const [width, setWidth] = useState(0);
  const gid = `rating-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const data = points.slice(-40);
  if (data.length < 3) return null;

  const values = data.map((p) => p.rating);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (max === min) {
    min -= 50;
    max += 50;
  }
  const innerW = Math.max(1, width - PAD_X * 2);
  const x = (i: number) => PAD_X + (i / (data.length - 1)) * innerW;
  const y = (v: number) => PAD_TOP + (1 - (v - min) / (max - min)) * (H - PAD_TOP - PAD_BOTTOM);
  const line = data.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.rating).toFixed(1)}`).join(' ');
  const area = `${line} L${x(data.length - 1).toFixed(1)},${H - PAD_BOTTOM} L${x(0).toFixed(1)},${H - PAD_BOTTOM} Z`;
  const last = data[data.length - 1];

  return (
    <View
      style={styles.wrap}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessible
      accessibilityLabel={label}
    >
      {width > 0 && (
        <Svg width={width} height={H}>
          <Defs>
            <LinearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.gold} stopOpacity={0.35} />
              <Stop offset="1" stopColor={colors.gold} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Line x1={PAD_X} y1={y(max)} x2={width - PAD_X} y2={y(max)} stroke="rgba(255,255,255,0.12)" strokeWidth={1} strokeDasharray="4 4" />
          <Line x1={PAD_X} y1={y(min)} x2={width - PAD_X} y2={y(min)} stroke="rgba(255,255,255,0.12)" strokeWidth={1} strokeDasharray="4 4" />
          <SvgText x={PAD_X + 2} y={y(max) - 4} fill={colors.textMuted} fontSize={10}>
            {max}
          </SvgText>
          <SvgText x={PAD_X + 2} y={y(min) + 12} fill={colors.textMuted} fontSize={10}>
            {min}
          </SvgText>
          <Path d={area} fill={`url(#${gid})`} />
          <Path d={line} fill="none" stroke={colors.gold} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
          <Circle cx={x(data.length - 1)} cy={y(last.rating)} r={4} fill={colors.gold} />
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', height: H },
});
