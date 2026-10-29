// Set anterior "Sombra lateral" (diseño propio). Ya no se usa en la app: se conserva por si se quiere recuperar como opción.
import React from 'react';
import Svg, { Path, Circle, Rect, G, ClipPath, Defs } from 'react-native-svg';

export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type PieceColor = 'w' | 'b';

type Kind = 'f' | 'd' | 'x'; // f: relleno, d: línea de detalle, x: punto (ojo, nariz)
type Shape =
  | { t: 'path'; d: string; k: Kind }
  | { t: 'circle'; cx: number; cy: number; r: number; k: Kind }
  | { t: 'rect'; x: number; y: number; w: number; h: number; r: number; k: Kind };

const SHAPES: Record<PieceType, Shape[]> = {
  "p": [
    {
      "t": "path",
      "d": "M36 58 C37 68 32 74 26 80 H74 C68 74 63 68 64 58 Z",
      "k": "f"
    },
    {
      "t": "rect",
      "x": 29,
      "y": 49,
      "w": 42,
      "h": 10,
      "r": 5,
      "k": "f"
    },
    {
      "t": "circle",
      "cx": 50,
      "cy": 32,
      "r": 17,
      "k": "f"
    },
    {
      "t": "path",
      "d": "M33 54 H67",
      "k": "d"
    },
    {
      "t": "rect",
      "x": 14,
      "y": 79,
      "w": 72,
      "h": 11,
      "r": 5.5,
      "k": "f"
    }
  ],
  "r": [
    {
      "t": "path",
      "d": "M29 44 C31 60 28 70 22 80 H78 C72 70 69 60 71 44 Z",
      "k": "f"
    },
    {
      "t": "path",
      "d": "M18 10 H33 V21 H43 V10 H57 V21 H67 V10 H82 V37 H18 Z",
      "k": "f"
    },
    {
      "t": "rect",
      "x": 21,
      "y": 35,
      "w": 58,
      "h": 11,
      "r": 4,
      "k": "f"
    },
    {
      "t": "path",
      "d": "M30 60 H70",
      "k": "d"
    },
    {
      "t": "rect",
      "x": 14,
      "y": 79,
      "w": 72,
      "h": 11,
      "r": 5.5,
      "k": "f"
    }
  ],
  "b": [
    {
      "t": "path",
      "d": "M36 66 C38 74 32 78 24 80 H76 C68 78 62 74 64 66 Z",
      "k": "f"
    },
    {
      "t": "rect",
      "x": 27,
      "y": 59,
      "w": 46,
      "h": 9,
      "r": 4.5,
      "k": "f"
    },
    {
      "t": "path",
      "d": "M50 8 C74 22 80 42 67 55 C64 58 64 59 65 61 H35 C36 59 36 58 33 55 C20 42 26 22 50 8 Z",
      "k": "f"
    },
    {
      "t": "circle",
      "cx": 50,
      "cy": 8,
      "r": 6.5,
      "k": "f"
    },
    {
      "t": "path",
      "d": "M52 22 L63 40",
      "k": "d"
    },
    {
      "t": "rect",
      "x": 14,
      "y": 79,
      "w": 72,
      "h": 11,
      "r": 5.5,
      "k": "f"
    }
  ],
  "n": [
    {
      "t": "path",
      "d": "M32 72 C30 63 32 55 38 48 C42 43 44 40 42 37 C39 40 36 43 32 45 C28 47 24 45 22 41 C20 37 23 33 27 30 L39 23 L41 10 L48 16 C51 13 53 12 56 12 C69 14 78 28 78 48 C78 58 74 65 73 72 Z",
      "k": "f"
    },
    {
      "t": "circle",
      "cx": 26,
      "cy": 39,
      "r": 1.7,
      "k": "x"
    },
    {
      "t": "circle",
      "cx": 42,
      "cy": 27,
      "r": 2.5,
      "k": "x"
    },
    {
      "t": "path",
      "d": "M58 17 C66 24 70 36 68 50",
      "k": "d"
    },
    {
      "t": "path",
      "d": "M24 43 L33 47",
      "k": "d"
    },
    {
      "t": "path",
      "d": "M44 38 C46 34 50 32 55 32",
      "k": "d"
    },
    {
      "t": "rect",
      "x": 27,
      "y": 72,
      "w": 46,
      "h": 8,
      "r": 3.5,
      "k": "f"
    },
    {
      "t": "rect",
      "x": 21,
      "y": 79,
      "w": 58,
      "h": 11,
      "r": 5.5,
      "k": "f"
    },
    {
      "t": "path",
      "d": "M30 76 H70",
      "k": "d"
    }
  ],
  "q": [
    {
      "t": "path",
      "d": "M17 80 L8 26 L26 42 L32 15 L41 40 L50 8 L59 40 L68 15 L74 42 L92 26 L83 80 Z",
      "k": "f"
    },
    {
      "t": "circle",
      "cx": 8,
      "cy": 22,
      "r": 5.5,
      "k": "f"
    },
    {
      "t": "circle",
      "cx": 32,
      "cy": 11,
      "r": 5.5,
      "k": "f"
    },
    {
      "t": "circle",
      "cx": 50,
      "cy": 5.5,
      "r": 5.5,
      "k": "f"
    },
    {
      "t": "circle",
      "cx": 68,
      "cy": 11,
      "r": 5.5,
      "k": "f"
    },
    {
      "t": "circle",
      "cx": 92,
      "cy": 22,
      "r": 5.5,
      "k": "f"
    },
    {
      "t": "path",
      "d": "M20 60 H80",
      "k": "d"
    },
    {
      "t": "path",
      "d": "M18 70 H82",
      "k": "d"
    },
    {
      "t": "rect",
      "x": 14,
      "y": 79,
      "w": 72,
      "h": 11,
      "r": 5.5,
      "k": "f"
    }
  ],
  "k": [
    {
      "t": "path",
      "d": "M17 80 L9 46 C8 36 18 30 32 29 H68 C82 30 92 36 91 46 L83 80 Z",
      "k": "f"
    },
    {
      "t": "path",
      "d": "M43 2 H57 V9 H64 V18 H57 V28 H43 V18 H36 V9 H43 Z",
      "k": "f"
    },
    {
      "t": "path",
      "d": "M18 38 C34 38 46 46 50 62",
      "k": "d"
    },
    {
      "t": "path",
      "d": "M82 38 C66 38 54 46 50 62",
      "k": "d"
    },
    {
      "t": "path",
      "d": "M14 68 H86",
      "k": "d"
    },
    {
      "t": "rect",
      "x": 14,
      "y": 79,
      "w": 72,
      "h": 11,
      "r": 5.5,
      "k": "f"
    }
  ]
};

const STYLE = {
  w: { fill: '#FBF8EE', stroke: '#3A352C', detail: '#8A8374', dot: '#3A352C' },
  b: { fill: '#4C4945', stroke: '#0F0E0D', detail: '#CFC9BA', dot: '#E8E2D3' },
};

// Todas las piezas se reducen un poco hacia la base para que el trazo no se corte arriba.
const ALL = 'translate(50 95) scale(0.92) translate(-50 -95)';
// El caballo se ensancha para llenar la casilla.
const KNIGHT = 'translate(50 90) scale(1.14 1.06) translate(-50 -90)';

type Props = { type: PieceType; color: PieceColor; size: number };

function draw(s: Shape, key: string, p: object) {
  if (s.t === 'path') return <Path key={key} d={s.d} {...p} />;
  if (s.t === 'circle') return <Circle key={key} cx={s.cx} cy={s.cy} r={s.r} {...p} />;
  return <Rect key={key} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.r} {...p} />;
}

export default function Piece({ type, color, size }: Props) {
  const c = STYLE[color];
  const shapes = SHAPES[type];
  const body = (
    <>
      {shapes.map((s, i) => {
        if (s.k === 'd')
          return draw(s, 'd' + i, { fill: 'none', stroke: c.detail, strokeWidth: 2.1, strokeLinecap: 'round' });
        if (s.k === 'x') return draw(s, 'x' + i, { fill: c.dot });
        return draw(s, 'f' + i, {
          fill: c.fill,
          stroke: c.stroke,
          strokeWidth: 3,
          strokeLinejoin: 'round',
          strokeLinecap: 'round',
        });
      })}
      {/* sombra lateral: la mitad derecha, un poco más oscura */}
      <G clipPath="url(#shade)">
        {shapes.map((s, i) => (s.k === 'f' ? draw(s, 's' + i, { fill: '#000', fillOpacity: 0.16 }) : null))}
      </G>
    </>
  );
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" pointerEvents="none">
      <Defs>
        <ClipPath id="shade">
          <Rect x={52} y={0} width={48} height={100} />
        </ClipPath>
      </Defs>
      <G transform={ALL}>{type === 'n' ? <G transform={KNIGHT}>{body}</G> : body}</G>
    </Svg>
  );
}
