import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, { Line, Polygon } from 'react-native-svg';
import { Chess, Square } from 'chess.js';
import { useFeedback } from '../feedback/feedback';
import { useI18n } from '../i18n/I18nContext';
import { useBoardTheme } from '../settings/useBoardTheme';
import { boardHighlight, boardThemes, colors } from '../theme';
import { boardPixels } from './boardSize';
import { Captured, computeMove, Offsets } from './boardAnimation';
import { SquareTexture } from './SquareTexture';
import Piece, { PieceColor, PieceType } from './Piece';

export type PromotionPiece = 'q' | 'r' | 'b' | 'n';
export type BoardMove = { from: Square; to: Square; promotion?: PromotionPiece };

// Orden del selector de coronación (como en Lichess): dama, caballo, torre, alfil.
const PROMOTION_PIECES: PromotionPiece[] = ['q', 'n', 'r', 'b'];

type Props = {
  /** Posición a mostrar, en notación FEN. El tablero no guarda la partida: la guarda quien lo usa. */
  fen: string;
  /** 'w' = blancas abajo, 'b' = negras abajo. */
  orientation?: 'w' | 'b';
  lastMove?: { from: Square; to: Square } | null;
  /** true para jugar moviendo piezas: tocar pieza y destino, o arrastrar la pieza. */
  interactive?: boolean;
  onMove?: (move: BoardMove) => void;
  /** Casillas a resaltar (explicaciones). */
  highlight?: string[];
  /** Flechas como pares origen+destino: ['c4f7']. */
  arrows?: string[];
  /** Flechas con color propio (revisión de partidas): { move: 'c4f7', color: 'rgba(...)' }. */
  colorArrows?: { move: string; color: string }[];
  /** Insignia redonda en la esquina de una casilla (calidad de la jugada en la revisión). */
  badge?: { square: string; color: string; label: string };
  /** Muestra los destinos legales de la pieza en esa casilla (explicaciones). */
  showMovesFrom?: string;
  /** Casillas elegidas por el usuario (ejercicio de tocar casillas). */
  pickedSquares?: string[];
  /** Si se pasa y el tablero no es interactivo, se llama al tocar cualquier casilla. */
  onSquarePress?: (square: Square) => void;
};

const YELLOW_ARROW = 'rgba(247, 198, 49, 0.9)';
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

/** Destinos legales de una pieza; si no le toca mover, se prueba con el turno cambiado. */
function legalDestinations(fen: string, from: Square): Square[] {
  const attempt = (f: string): Square[] => {
    try {
      return new Chess(f).moves({ square: from, verbose: true }).map((m) => m.to as Square);
    } catch {
      return [];
    }
  };
  const direct = attempt(fen);
  if (direct.length > 0) return direct;
  const parts = fen.split(' ');
  if (parts.length < 4) return [];
  parts[1] = parts[1] === 'w' ? 'b' : 'w';
  parts[3] = '-';
  return attempt(parts.join(' '));
}

const SLIDE_MS = 260; // deslizamiento de la pieza que se mueve
const FADE_MS = 260; // la pieza capturada se achica y se desvanece
const DRAG_START_PX = 6; // movimiento mínimo del dedo para que un toque pase a ser arrastre
const DRAG_SCALE = 1.3; // la pieza arrastrada se ve más grande
const DRAG_LIFT = 0.45; // y va un poco por encima del dedo (en casillas), para que el dedo no la tape

/** Celda de chess.board() ("fila columna") de una casilla. */
const cellOf = (s: Square) => `${8 - Number(s[1])}${s.charCodeAt(0) - 97}`;

/** Pieza que se desliza desde su casilla anterior hasta la actual. */
function MovingPiece({ type, color, size, dx, dy }: { type: PieceType; color: PieceColor; size: number; dx: number; dy: number }) {
  const [t] = useState(() => new Animated.Value(1));
  useEffect(() => {
    Animated.timing(t, { toValue: 0, duration: SLIDE_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [t]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        transform: [
          { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, dx] }) },
          { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, dy] }) },
        ],
      }}
    >
      <Piece type={type} color={color} size={size} />
    </Animated.View>
  );
}

/** Pieza capturada: se achica y se desvanece en su casilla mientras llega la otra. */
function CapturedPiece({ type, color, size }: { type: PieceType; color: PieceColor; size: number }) {
  const [t] = useState(() => new Animated.Value(1));
  useEffect(() => {
    Animated.timing(t, { toValue: 0, duration: FADE_MS, easing: Easing.in(Easing.quad), useNativeDriver: true }).start();
  }, [t]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        { alignItems: 'center', justifyContent: 'center', opacity: t },
        { transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }] },
      ]}
    >
      <Piece type={type} color={color} size={size} />
    </Animated.View>
  );
}

function Arrows({ arrows, sq, orientation }: { arrows: { move: string; color: string }[]; sq: number; orientation: 'w' | 'b' }) {
  const center = (s: string) => {
    const file = s.charCodeAt(0) - 97;
    const rank = Number(s[1]);
    const c = orientation === 'w' ? file : 7 - file;
    const r = orientation === 'w' ? 8 - rank : rank - 1;
    return { x: (c + 0.5) * sq, y: (r + 0.5) * sq };
  };
  return (
    // zIndex 11: la fila de la última jugada queda en zIndex 10 (animación) y taparía las puntas de las flechas.
    <Svg pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 11 }]} width={sq * 8} height={sq * 8}>
      {arrows.map(({ move: a, color }, i) => {
        const from = center(a.slice(0, 2));
        const to = center(a.slice(2, 4));
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len === 0) return null;
        const ux = dx / len;
        const uy = dy / len;
        const px = -uy;
        const py = ux;
        const headLen = sq * 0.38;
        const headHalf = sq * 0.22;
        const tip = { x: to.x - ux * sq * 0.1, y: to.y - uy * sq * 0.1 };
        const base = { x: tip.x - ux * headLen, y: tip.y - uy * headLen };
        const start = { x: from.x + ux * sq * 0.2, y: from.y + uy * sq * 0.2 };
        const points = [
          `${tip.x},${tip.y}`,
          `${base.x + px * headHalf},${base.y + py * headHalf}`,
          `${base.x - px * headHalf},${base.y - py * headHalf}`,
        ].join(' ');
        return (
          <React.Fragment key={i}>
            <Line x1={start.x} y1={start.y} x2={base.x} y2={base.y} stroke={color} strokeWidth={sq * 0.15} />
            <Polygon points={points} fill={color} />
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

/** Insignia en la esquina superior derecha de una casilla. */
function SquareBadge({ badge, sq, orientation }: { badge: { square: string; color: string; label: string }; sq: number; orientation: 'w' | 'b' }) {
  const file = badge.square.charCodeAt(0) - 97;
  const rank = Number(badge.square[1]);
  const c = orientation === 'w' ? file : 7 - file;
  const r = orientation === 'w' ? 8 - rank : rank - 1;
  const size = Math.max(18, sq * 0.42);
  const left = Math.min((c + 1) * sq - size * 0.7, sq * 8 - size);
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left,
        top: Math.max(r * sq - size * 0.3, 0),
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: badge.color,
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 15,
      }}
    >
      <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: size * 0.5 }}>{badge.label}</Text>
    </View>
  );
}

export function Board({
  fen,
  orientation = 'w',
  lastMove = null,
  interactive = true,
  onMove,
  highlight = [],
  arrows = [],
  colorArrows = [],
  badge,
  showMovesFrom,
  pickedSquares = [],
  onSquarePress,
}: Props) {
  const { width } = useWindowDimensions();
  const sq = boardPixels(width) / 8;
  const boardPx = sq * 8;

  const feedback = useFeedback();
  const boardTheme = useBoardTheme();
  const theme = boardThemes[boardTheme];
  const [selected, setSelected] = useState<Square | null>(null);

  // Arrastre: casilla de la pieza que se arrastra y casilla bajo el dedo. La posición de la pieza va en
  // un Animated.ValueXY para no redibujar el tablero entero en cada movimiento del dedo.
  const [drag, setDrag] = useState<{ from: Square; over: Square | null } | null>(null);
  const [dragPos] = useState(() => new Animated.ValueXY());
  // Jugada que se acaba de soltar arrastrando: la pieza ya está en su destino, así que no se desliza.
  const [dropped, setDropped] = useState<BoardMove | null>(null);
  // Coronación a la espera de que se elija la pieza. `dragged`: el peón llegó arrastrado.
  const [promo, setPromo] = useState<{ from: Square; to: Square; dragged: boolean } | null>(null);

  const chess = useMemo(() => new Chess(fen), [fen]);
  const grid = useMemo(() => chess.board(), [chess]);
  const turn = chess.turn();

  // Animación de la última jugada. Al cambiar la posición se compara con la anterior, guardada en el
  // estado ("información de renders anteriores": así no hace falta leer refs mientras se dibuja).
  const [anim, setAnim] = useState(() => ({
    fen,
    orientation,
    grid,
    offsets: {} as Offsets,
    captured: null as Captured,
    moved: false,
    id: 0,
  }));
  if (anim.fen !== fen || anim.orientation !== orientation) {
    const move = anim.orientation === orientation ? computeMove(anim.grid, grid, orientation) : { offsets: {}, captured: null };
    const moved = Object.keys(move.offsets).length > 0;
    const newOffsets: Offsets = { ...move.offsets };
    if (dropped) {
      // La pieza soltada no se desliza (en el enroque, la torre sí).
      delete newOffsets[cellOf(dropped.to)];
      setDropped(null);
    }
    setAnim({ fen, orientation, grid, offsets: newOffsets, captured: move.captured, moved, id: anim.id + 1 });
    if (selected) setSelected(null);
    if (promo) setPromo(null);
  }
  const { offsets, captured } = anim;

  // Sonido de la jugada (solo si hubo una jugada, no al cargar otra posición).
  useEffect(() => {
    if (anim.id > 0 && anim.moved) feedback.move(!!anim.captured);
    // Solo cuando cambia la jugada (anim.id).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anim.id]);

  // Jugadas legales de la pieza seleccionada: casilla destino -> ¿es captura?
  const { targets, promotionTargets } = useMemo(() => {
    const t = new Map<string, boolean>();
    const p = new Set<string>();
    if (selected) {
      chess.moves({ square: selected, verbose: true }).forEach((m) => {
        t.set(m.to, m.flags.includes('c') || m.flags.includes('e'));
        if (m.promotion) p.add(m.to);
      });
    }
    return { targets: t, promotionTargets: p };
  }, [chess, selected]);

  // Destinos mostrados solo como ayuda visual (explicaciones)
  const hintTargets = useMemo(() => {
    const t = new Map<string, boolean>();
    if (showMovesFrom && !selected) {
      legalDestinations(fen, showMovesFrom as Square).forEach((to) => t.set(to, !!chess.get(to)));
    }
    return t;
  }, [fen, chess, showMovesFrom, selected]);

  // Casilla del rey en jaque (si la hay)
  const checkSquare = useMemo(() => {
    if (!chess.isCheck()) return null;
    for (const row of grid) {
      for (const cell of row) {
        if (cell && cell.type === 'k' && cell.color === turn) return cell.square;
      }
    }
    return null;
  }, [chess, grid, turn]);

  const handlePress = (square: Square) => {
    if (!interactive) {
      onSquarePress?.(square);
      return;
    }

    if (selected && targets.has(square)) {
      // Coronación: primero se elige la pieza.
      if (promotionTargets.has(square)) setPromo({ from: selected, to: square, dragged: false });
      else onMove?.({ from: selected, to: square });
      setSelected(null);
      return;
    }

    const piece = chess.get(square);
    if (piece && piece.color === turn && square !== selected) {
      setSelected(square);
    } else {
      setSelected(null);
    }
  };

  /** Casilla bajo un punto del tablero (en px desde su esquina), o null si cae afuera. */
  const squareAt = (x: number, y: number): Square | null => {
    const c = Math.floor(x / sq);
    const r = Math.floor(y / sq);
    if (c < 0 || c > 7 || r < 0 || r > 7) return null;
    const br = orientation === 'w' ? r : 7 - r;
    const bc = orientation === 'w' ? c : 7 - c;
    return `${FILES[bc]}${8 - br}` as Square;
  };

  const dragSize = sq * DRAG_SCALE;
  const placeDragged = (x: number, y: number) =>
    dragPos.setValue({ x: x - dragSize / 2, y: y - dragSize / 2 - sq * DRAG_LIFT });

  /** Suelta la pieza arrastrada: si la casilla es un destino legal, juega; si no, la pieza vuelve. */
  const drop = (from: Square, to: Square | null) => {
    setDrag(null);
    if (to === from) return; // soltada en su casilla: queda elegida, como con un toque
    const move = to ? chess.moves({ square: from, verbose: true }).find((m) => m.to === to) : undefined;
    setSelected(null);
    if (!move || !to) return;
    if (move.promotion) {
      setPromo({ from, to, dragged: true });
      return;
    }
    const played: BoardMove = { from, to };
    setDropped(played);
    onMove?.(played);
  };

  /** Pieza elegida en el selector de coronación (null = se canceló). */
  const choosePromotion = (piece: PromotionPiece | null) => {
    const p = promo;
    setPromo(null);
    if (!p || !piece) return;
    const played: BoardMove = { from: p.from, to: p.to, promotion: piece };
    if (p.dragged) setDropped(played);
    onMove?.(played);
  };

  // Los toques y arrastres los recibe una capa transparente encima del tablero. Se guarda dónde empezó
  // el dedo (en el tablero y en la pantalla) para seguir el arrastre con el desplazamiento en la pantalla.
  const gesture = useRef({ x: 0, y: 0, pageX: 0, pageY: 0, from: null as Square | null, over: null as Square | null, dragging: false });
  const pointOf = (e: GestureResponderEvent) => {
    const g = gesture.current;
    return { x: g.x + e.nativeEvent.pageX - g.pageX, y: g.y + e.nativeEvent.pageY - g.pageY };
  };
  const touchHandlers = {
    onStartShouldSetResponder: () => true,
    // Mientras se arrastra una pieza, el tablero no suelta el dedo (por ejemplo, para desplazar la pantalla).
    onResponderTerminationRequest: () => !gesture.current.dragging,
    onResponderGrant: (e: GestureResponderEvent) => {
      const { locationX: x, locationY: y, pageX, pageY } = e.nativeEvent;
      const from = squareAt(x, y);
      gesture.current = { x, y, pageX, pageY, from, over: null, dragging: false };
      if (dropped) setDropped(null);
      // Devolver true impide que el ScrollView nativo de Android se quede con el dedo. Solo sobre una pieza
      // que se puede mover: empezando en otra casilla, la pantalla se sigue pudiendo desplazar.
      return interactive && !!from && chess.get(from)?.color === turn;
    },
    onResponderMove: (e: GestureResponderEvent) => {
      const g = gesture.current;
      if (!interactive || !g.from) return;
      const { x, y } = pointOf(e);
      if (!g.dragging) {
        if (Math.hypot(x - g.x, y - g.y) < DRAG_START_PX) return;
        const piece = chess.get(g.from);
        if (!piece || piece.color !== turn) return; // solo se arrastran las piezas del bando que mueve
        g.dragging = true;
        setSelected(g.from);
      }
      placeDragged(x, y);
      const over = squareAt(x, y);
      if (over !== g.over || !drag) {
        g.over = over;
        setDrag({ from: g.from, over });
      }
    },
    onResponderRelease: (e: GestureResponderEvent) => {
      const g = gesture.current;
      if (g.dragging && g.from) {
        const { x, y } = pointOf(e);
        drop(g.from, squareAt(x, y));
      } else if (g.from) {
        handlePress(g.from); // fue un toque
      }
      g.dragging = false;
    },
    onResponderTerminate: () => {
      gesture.current.dragging = false;
      setDrag(null);
    },
  };

  const rows = [];
  for (let r = 0; r < 8; r++) {
    const cells = [];
    let rowAnimating = false;
    for (let c = 0; c < 8; c++) {
      const br = orientation === 'w' ? r : 7 - r; // fila en chess.board() (0 = fila 8)
      const bc = orientation === 'w' ? c : 7 - c;
      const square = `${FILES[bc]}${8 - br}` as Square;
      const cell = grid[br][bc];
      if (offsets[`${br}${bc}`]) rowAnimating = true;
      const isLight = (br + bc) % 2 === 0;
      const bg = isLight ? theme.light : theme.dark;
      const labelColor = isLight ? theme.dark : theme.light;

      const isLast = lastMove && (lastMove.from === square || lastMove.to === square);
      const isSelected = selected === square;
      const isMarked = highlight.includes(square);
      const isPicked = pickedSquares.includes(square);
      const isCheck = checkSquare === square;

      const isTarget = targets.has(square) || hintTargets.has(square);
      const isCaptureTarget = targets.get(square) === true || hintTargets.get(square) === true;
      const isDragOrigin = drag?.from === square;
      const isDragOver = !!drag && drag.over === square && square !== drag.from;

      cells.push(
        <View
          key={square}
          accessibilityLabel={`${square}${cell ? ' ' + cell.color + cell.type : ''}`}
          style={{
            width: sq,
            height: sq,
            backgroundColor: bg,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: offsets[`${br}${bc}`] ? 10 : 0,
          }}
        >
          <SquareTexture theme={boardTheme} light={isLight} size={sq} seed={br * 3 + bc * 5} />
          {isLast && <View style={[styles.fill, { backgroundColor: boardHighlight.lastMove }]} />}
          {isMarked && (
            <View
              style={[
                styles.fill,
                { backgroundColor: boardHighlight.mark, borderWidth: Math.max(3, sq * 0.07), borderColor: boardHighlight.markBorder },
              ]}
            />
          )}
          {isPicked && (
            <View
              style={[
                styles.fill,
                { backgroundColor: boardHighlight.pick, borderWidth: Math.max(3, sq * 0.07), borderColor: boardHighlight.pickBorder },
              ]}
            />
          )}
          {isSelected && <View style={[styles.fill, { backgroundColor: boardHighlight.selected }]} />}
          {isCheck && <View style={[styles.fill, { backgroundColor: boardHighlight.check }]} />}

          {c === 0 && (
            <Text style={[styles.rank, { color: labelColor, fontSize: Math.max(9, sq * 0.2) }]}>{8 - br}</Text>
          )}
          {r === 7 && (
            <Text style={[styles.file, { color: labelColor, fontSize: Math.max(9, sq * 0.2) }]}>{FILES[bc]}</Text>
          )}

          {captured && captured.cell === `${br}${bc}` && (
            <CapturedPiece key={`cap-${anim.id}`} type={captured.type} color={captured.color} size={sq} />
          )}
          {cell &&
            (offsets[`${br}${bc}`] ? (
              <MovingPiece
                key={`move-${anim.id}`}
                type={cell.type}
                color={cell.color}
                size={sq}
                dx={offsets[`${br}${bc}`].dc * sq}
                dy={offsets[`${br}${bc}`].dr * sq}
              />
            ) : (
              // Mientras se arrastra, en la casilla de origen queda solo una sombra de la pieza.
              <View style={isDragOrigin ? { opacity: 0.3 } : undefined}>
                <Piece type={cell.type} color={cell.color} size={sq} />
              </View>
            ))}
          {isDragOver && <View style={[styles.fill, { borderWidth: Math.max(3, sq * 0.07), borderColor: boardHighlight.dragOver }]} />}

          {isTarget && !isCaptureTarget && (
            <View
              style={{
                position: 'absolute',
                width: sq * 0.3,
                height: sq * 0.3,
                borderRadius: sq,
                backgroundColor: boardHighlight.legalMove,
              }}
            />
          )}
          {isTarget && isCaptureTarget && (
            <View
              style={{
                position: 'absolute',
                width: sq * 0.92,
                height: sq * 0.92,
                borderRadius: sq,
                borderWidth: Math.max(3, sq * 0.07),
                borderColor: boardHighlight.legalMove,
              }}
            />
          )}
        </View>
      );
    }
    rows.push(
      <View key={r} style={{ flexDirection: 'row', zIndex: rowAnimating ? 10 : 0 }}>
        {cells}
      </View>
    );
  }

  const draggedCell = drag ? chess.get(drag.from) : undefined;
  const touchable = interactive || !!onSquarePress;

  // El tablero recorta sus esquinas redondeadas; la pieza arrastrada va afuera de ese recorte para poder
  // asomarse por encima del borde.
  return (
    <View style={{ width: boardPx, height: boardPx, alignSelf: 'center' }}>
      <View style={[styles.board, { width: boardPx, height: boardPx }]}>
        {rows}
        {(arrows.length > 0 || colorArrows.length > 0) && (
          <Arrows
            arrows={[...arrows.map((move) => ({ move, color: YELLOW_ARROW })), ...colorArrows]}
            sq={sq}
            orientation={orientation}
          />
        )}
      </View>
      {badge && <SquareBadge badge={badge} sq={sq} orientation={orientation} />}
      {draggedCell && (
        <Animated.View
          pointerEvents="none"
          style={{ position: 'absolute', left: 0, top: 0, zIndex: 20, transform: dragPos.getTranslateTransform() }}
        >
          <Piece type={draggedCell.type} color={draggedCell.color} size={dragSize} />
        </Animated.View>
      )}
      <View
        style={[StyleSheet.absoluteFill, { zIndex: 30 }]}
        pointerEvents={touchable ? 'auto' : 'none'}
        {...touchHandlers}
      />
      {promo && <PromotionPicker to={promo.to} color={turn} sq={sq} orientation={orientation} onChoose={choosePromotion} />}
    </View>
  );
}

/**
 * Selector de coronación: una columna con las 4 piezas sobre la casilla de destino, hacia el centro
 * del tablero. Tocar fuera de la columna cancela la jugada.
 */
function PromotionPicker({
  to,
  color,
  sq,
  orientation,
  onChoose,
}: {
  to: Square;
  color: PieceColor;
  sq: number;
  orientation: 'w' | 'b';
  onChoose: (piece: PromotionPiece | null) => void;
}) {
  const file = to.charCodeAt(0) - 97;
  const rank = Number(to[1]);
  const col = orientation === 'w' ? file : 7 - file;
  const row = orientation === 'w' ? 8 - rank : rank - 1;
  const dir = row === 0 ? 1 : -1;
  const { t } = useI18n();
  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 40 }]}>
      <Pressable
        style={[StyleSheet.absoluteFill, styles.promoShade]}
        onPress={() => onChoose(null)}
        accessibilityRole="button"
        accessibilityLabel={t('board.cancelPromotion')}
      />
      {PROMOTION_PIECES.map((p, i) => (
        <Pressable
          key={p}
          onPress={() => onChoose(p)}
          accessibilityRole="button"
          accessibilityLabel={t(`board.promote.${p}`)}
          style={({ pressed }) => [
            styles.promoOption,
            {
              left: col * sq,
              top: (row + dir * i) * sq,
              width: sq,
              height: sq,
              borderRadius: sq / 2,
              backgroundColor: pressed ? colors.gold : '#F2F2F2',
            },
          ]}
        >
          <Piece type={p} color={color} size={sq * 0.92} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    alignSelf: 'center',
    borderRadius: 8,
    overflow: 'hidden',
  },
  fill: {
    ...StyleSheet.absoluteFill,
  },
  promoShade: { backgroundColor: 'rgba(0, 0, 0, 0.55)', borderRadius: 8 },
  promoOption: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  rank: {
    position: 'absolute',
    top: 2,
    left: 3,
    fontWeight: '700',
  },
  file: {
    position: 'absolute',
    bottom: 1,
    right: 3,
    fontWeight: '700',
  },
});
