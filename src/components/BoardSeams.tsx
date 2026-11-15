import React from 'react';
import Svg, { Line } from 'react-native-svg';

type Props = {
  /** Lado de la casilla, para el grosor de la lava (relativo a la casilla). */
  cell: number;
  /** Junta vertical a la izquierda de la casilla (la primera columna no la lleva: es el borde del tablero). */
  left?: boolean;
  /** Junta horizontal arriba de la casilla (la primera fila no la lleva). */
  top?: boolean;
};

// Lava en las juntas del tablero de magma, dibujada en código. Va encima de la textura y de las marcas de la
// casilla y debajo de las piezas. Las líneas se dibujan en el borde con el doble de grosor: el SVG recorta la
// mitad exterior y queda visible el ancho pedido dentro de la casilla. En los cruces se suman halo y núcleo.
const HALO = '#FF6A00';
const CORE = '#FFB347';

export function BoardSeams({ cell, left = false, top = false }: Props) {
  const halo = Math.max(1.5, cell * 0.05) * 2;
  const core = Math.max(0.75, cell * 0.018) * 2;
  return (
    <Svg width="100%" height="100%" style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
      {left && (
        <>
          <Line x1={0} y1={0} x2={0} y2={10000} stroke={HALO} strokeWidth={halo} strokeOpacity={0.35} />
          <Line x1={0} y1={0} x2={0} y2={10000} stroke={CORE} strokeWidth={core} strokeOpacity={0.85} />
        </>
      )}
      {top && (
        <>
          <Line x1={0} y1={0} x2={10000} y2={0} stroke={HALO} strokeWidth={halo} strokeOpacity={0.35} />
          <Line x1={0} y1={0} x2={10000} y2={0} stroke={CORE} strokeWidth={core} strokeOpacity={0.85} />
        </>
      )}
    </Svg>
  );
}
