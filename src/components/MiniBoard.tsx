import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Polygon, Rect } from 'react-native-svg';
import { useBoardTheme } from '../settings/useBoardTheme';
import { boardHighlight, boardThemes, colors } from '../theme';
import Piece, { PieceColor, PieceType } from './Piece';

type Props = {
  /** Lado en px. */
  size: number;
  /** Esquina inferior izquierda del recorte (ej. 'b2') y cuántas casillas por lado se ven. */
  corner: string;
  span: number;
  /** Piezas: casilla -> 'wn', 'bk'... */
  pieces: Record<string, `${PieceColor}${PieceType}`>;
  /** Destinos posibles, como los puntos verdes del tablero grande. */
  dots?: string[];
  /** Flecha amarilla, origen y destino (ej. 'b5e8'). */
  arrow?: string;
};

const fileOf = (sq: string) => sq.charCodeAt(0) - 97;
const rankOf = (sq: string) => Number(sq[1]) - 1;

/**
 * Recorte de tablero sin interacción, para ilustrar una idea en poco espacio (por ejemplo, la elección de nivel de la
 * bienvenida). Usa los colores planos del tablero elegido y el set de piezas del usuario.
 */
export function MiniBoard({ size, corner, span, pieces, dots = [], arrow }: Props) {
  const theme = boardThemes[useBoardTheme()];
  const sq = size / span;
  const f0 = fileOf(corner);
  const r0 = rankOf(corner);
  // Centro de una casilla en coordenadas del recorte (y crece hacia abajo).
  const center = (s: string) => ({ x: (fileOf(s) - f0 + 0.5) * sq, y: (span - 1 - (rankOf(s) - r0) + 0.5) * sq });

  const squares: React.ReactNode[] = [];
  for (let y = 0; y < span; y++) {
    for (let x = 0; x < span; x++) {
      const light = (f0 + x + (r0 + span - 1 - y)) % 2 === 1;
      squares.push(<Rect key={`${x}${y}`} x={x * sq} y={y * sq} width={sq} height={sq} fill={light ? theme.light : theme.dark} />);
    }
  }

  let arrowShape: React.ReactNode = null;
  if (arrow) {
    const a = center(arrow.slice(0, 2));
    const b = center(arrow.slice(2, 4));
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const ux = (b.x - a.x) / len;
    const uy = (b.y - a.y) / len;
    const head = sq * 0.45;
    const end = { x: b.x - ux * head, y: b.y - uy * head };
    const side = (k: number) => `${end.x - uy * head * 0.6 * k},${end.y + ux * head * 0.6 * k}`;
    arrowShape = (
      <>
        <Line x1={a.x} y1={a.y} x2={end.x} y2={end.y} stroke={colors.gold} strokeOpacity={0.9} strokeWidth={sq * 0.18} strokeLinecap="round" />
        <Polygon points={`${b.x},${b.y} ${side(1)} ${side(-1)}`} fill={colors.gold} fillOpacity={0.9} />
      </>
    );
  }

  return (
    <View style={{ width: size, height: size, borderRadius: 6, overflow: 'hidden' }} pointerEvents="none">
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {squares}
        {dots.map((d) => {
          const c = center(d);
          return <Circle key={d} cx={c.x} cy={c.y} r={sq * 0.22} fill={boardHighlight.legalMove} />;
        })}
      </Svg>
      {Object.entries(pieces).map(([s, key]) => {
        const c = center(s);
        return (
          <View key={s} style={{ position: 'absolute', left: c.x - sq / 2, top: c.y - sq / 2 }}>
            <Piece color={key[0] as PieceColor} type={key[1] as PieceType} size={sq} />
          </View>
        );
      })}
      {arrowShape && (
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          {arrowShape}
        </Svg>
      )}
    </View>
  );
}
