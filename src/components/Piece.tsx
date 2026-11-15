import React from 'react';
import Svg, { Circle, ClipPath, Defs, Image, LinearGradient, Path, Stop } from 'react-native-svg';
import { AnyPieceSetId, MATERIAL_SETS, isMaterialSet, pathSetOf, pieceClipIds } from '../pieces/materials';
import { PIECE_PATHS, PieceKey } from '../pieces/pieceSets';
import { TEXTURES } from '../pieces/textures';
import { volcanoShapes } from '../pieces/volcano';
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
  /** Brasas de magma: solo en la tienda (vista previa y miniaturas); en el tablero van apagadas. */
  showEmbers?: boolean;
};

// Margen alrededor de la pieza, en unidades del dibujo (que mide 100): con 6 por lado,
// la pieza ocupa el 89 % de `size` y no tapa las coordenadas del tablero.
const PAD = 6;
const VIEW_BOX = `${-PAD} ${-PAD} ${100 + 2 * PAD} ${100 + 2 * PAD}`;

// Cada pieza son dos trazados: la silueta (blanca) y la tinta (contornos y piezas negras).
// Los detalles blancos de las piezas negras son huecos de la tinta sobre la silueta blanca.
// Los sets de material usan los trazados del Clásico: la silueta se rellena con la textura clara y, en las
// negras, la tinta con la oscura (con un filo fino que la separa de una casilla oscura).
function Piece({ type, color, size, set, showEmbers = false }: Props) {
  const { pieceSet } = usePieceSet();
  const id = set ?? pieceSet;
  const key = `${color}${type}` as PieceKey;
  const paths = PIECE_PATHS[pathSetOf(id)][key];
  // Id único por pieza: Safari no resuelve bien `url(#id)` cuando varios SVG repiten el mismo id.
  const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, '');

  if (isMaterialSet(id)) {
    const tex = TEXTURES[id];
    const { outline, rim, winter, volcano, rimStrong } = MATERIAL_SETS[id];
    const w = winter ? winterShapes(paths.sil) : null;
    const v = volcano ? volcanoShapes(paths.sil) : null;
    const white = color === 'w';
    const clip = pieceClipIds(id, key, uid);
    const lavaId = `lava-${clip.sil}`;
    const lava = `url(#${lavaId})`;
    const area = { x: 0, y: 0, width: 100, height: 100, preserveAspectRatio: 'xMidYMid slice' } as const;
    return (
      <Svg width={size} height={size} viewBox={VIEW_BOX} pointerEvents="none">
        <Defs>
          <ClipPath id={clip.sil}>
            <Path d={paths.sil} clipRule="evenodd" />
          </ClipPath>
          <ClipPath id={clip.ink}>
            <Path d={paths.ink} clipRule="evenodd" />
          </ClipPath>
          {v && (
            <LinearGradient id={lavaId} x1={0} y1={v.lavaFrom} x2={0} y2={v.lavaTo} gradientUnits="userSpaceOnUse">
              <Stop offset={0} stopColor="#FFD54A" />
              <Stop offset={0.55} stopColor="#FF7A12" />
              <Stop offset={1} stopColor="#D93A00" />
            </LinearGradient>
          )}
        </Defs>
        {w && <Path d={w.icicles} fill={white ? '#E4F4FF' : '#7FD4F0'} stroke={outline} strokeWidth={0.9} strokeLinejoin="round" />}
        {v && <Path d={v.drops} fill={lava} stroke={outline} strokeWidth={0.9} strokeLinejoin="round" />}
        <Image {...area} href={tex.white} clipPath={`url(#${clip.sil})`} />
        {w && white && <Path d={w.cap} fill="#FFFFFF" clipPath={`url(#${clip.sil})`} />}
        {v && white && <Path d={v.lava} fill={lava} clipPath={`url(#${clip.sil})`} />}
        {white ? (
          <Path d={paths.ink} fill={outline} fillRule="evenodd" />
        ) : (
          <>
            <Image {...area} href={tex.black} clipPath={`url(#${clip.ink})`} />
            {w && <Path d={w.cap} fill="#F2FAFF" clipPath={`url(#${clip.ink})`} />}
            {v && <Path d={v.lava} fill={lava} clipPath={`url(#${clip.ink})`} />}
            {/* Las grietas del dibujo son los huecos de la tinta: en las negras se encienden en naranja. */}
            {v && <Path d={`${paths.sil} ${paths.ink}`} fill="#FF7A12" fillRule="evenodd" />}
            <Path
              d={paths.ink}
              fill="none"
              stroke={rim}
              strokeWidth={rimStrong ? 1.1 : 0.7}
              strokeOpacity={rimStrong ? 1 : 0.8}
            />
          </>
        )}
        {w && <Path d={w.flake} stroke={white ? '#3A8FC4' : '#BFEFFF'} strokeWidth={1.3} strokeLinecap="round" fill="none" />}
        {v &&
          showEmbers &&
          v.embers.map((e, i) => (
            <React.Fragment key={i}>
              <Circle cx={e.x} cy={e.y} r={e.r * 2.6} fill="#FF7A12" opacity={0.18} />
              <Circle cx={e.x} cy={e.y} r={e.r} fill="#FFD54A" opacity={0.95} />
            </React.Fragment>
          ))}
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
