import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { PIECE_PATHS, PieceKey, PieceSetId } from '../pieces/pieceSets';
import { usePieceSet } from '../settings/PieceSetContext';

export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type PieceColor = 'w' | 'b';

type Props = {
  type: PieceType;
  color: PieceColor;
  size: number;
  /** Si no se indica, se usa el set elegido por el usuario en el perfil. */
  set?: PieceSetId;
};

// Cada pieza son dos trazados: la silueta (blanca) y la tinta (contornos y piezas negras).
// Los detalles blancos de las piezas negras son huecos de la tinta sobre la silueta blanca.
function Piece({ type, color, size, set }: Props) {
  const { pieceSet } = usePieceSet();
  const paths = PIECE_PATHS[set ?? pieceSet][`${color}${type}` as PieceKey];
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" pointerEvents="none">
      <Path d={paths.sil} fill="#FFFFFF" fillRule="evenodd" />
      <Path d={paths.ink} fill="#111111" fillRule="evenodd" />
    </Svg>
  );
}

export default React.memo(Piece);
