import React from 'react';
import Svg, { ClipPath, Defs, Image, Path } from 'react-native-svg';
import { AnyPieceSetId, MATERIAL_SETS, isMaterialSet, pathSetOf } from '../pieces/materials';
import { PIECE_PATHS, PieceKey } from '../pieces/pieceSets';
import { TEXTURES } from '../pieces/textures';
import { winterShapes } from '../pieces/winter';
import { usePieceSet } from '../settings/PieceSetContext';

export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type PieceColor = 'w' | 'b';

type Props = {
  type: PieceType;
  color: PieceColor;
  size: number;
  /** Si no se indica, se usa el set elegido por el usuario en el perfil. */
  set?: AnyPieceSetId;
};

// Margen alrededor de la pieza, en unidades del dibujo (que mide 100): con 6 por lado,
// la pieza ocupa el 89 % de `size` y no tapa las coordenadas del tablero.
const PAD = 6;
const VIEW_BOX = `${-PAD} ${-PAD} ${100 + 2 * PAD} ${100 + 2 * PAD}`;

// Cada pieza son dos trazados: la silueta (blanca) y la tinta (contornos y piezas negras).
// Los detalles blancos de las piezas negras son huecos de la tinta sobre la silueta blanca.
// Los sets de material usan los trazados del Clásico: la silueta se rellena con la textura clara y, en las
// negras, la tinta con la oscura (con un filo fino que la separa de una casilla oscura).
function Piece({ type, color, size, set }: Props) {
  const { pieceSet } = usePieceSet();
  const id = set ?? pieceSet;
  const paths = PIECE_PATHS[pathSetOf(id)][`${color}${type}` as PieceKey];

  if (isMaterialSet(id)) {
    const tex = TEXTURES[id];
    const { outline, rim, winter } = MATERIAL_SETS[id];
    const w = winter ? winterShapes(paths.sil) : null;
    const white = color === 'w';
    const area = { x: 0, y: 0, width: 100, height: 100, preserveAspectRatio: 'xMidYMid slice' } as const;
    return (
      <Svg width={size} height={size} viewBox={VIEW_BOX} pointerEvents="none">
        <Defs>
          <ClipPath id="sil">
            <Path d={paths.sil} clipRule="evenodd" />
          </ClipPath>
          <ClipPath id="ink">
            <Path d={paths.ink} clipRule="evenodd" />
          </ClipPath>
        </Defs>
        {w && <Path d={w.icicles} fill={white ? '#E4F4FF' : '#7FD4F0'} stroke={outline} strokeWidth={0.9} strokeLinejoin="round" />}
        <Image {...area} href={tex.white} clipPath="url(#sil)" />
        {w && white && <Path d={w.cap} fill="#FFFFFF" clipPath="url(#sil)" />}
        {white ? (
          <Path d={paths.ink} fill={outline} fillRule="evenodd" />
        ) : (
          <>
            <Image {...area} href={tex.black} clipPath="url(#ink)" />
            {w && <Path d={w.cap} fill="#F2FAFF" clipPath="url(#ink)" />}
            <Path d={paths.ink} fill="none" stroke={rim} strokeWidth={0.7} strokeOpacity={0.8} />
          </>
        )}
        {w && <Path d={w.flake} stroke={white ? '#3A8FC4' : '#BFEFFF'} strokeWidth={1.3} strokeLinecap="round" fill="none" />}
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX} pointerEvents="none">
      <Path d={paths.sil} fill="#FFFFFF" fillRule="evenodd" />
      <Path d={paths.ink} fill="#111111" fillRule="evenodd" />
    </Svg>
  );
}

export default React.memo(Piece);
