import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, Platform, Pressable, StyleSheet, View, type GestureResponderEvent, type ViewStyle } from 'react-native';
import Svg, { ClipPath, Defs, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../theme';
import { Circle3D } from './Circle3D';
import { useReducedMotion } from './useReducedMotion';
import { fitWheelLabel, WHEEL_NAME_MAX, wheelNameSize } from './wheelLabel';

/** Un gajo de la corona: lo que se ve en el centro y lo que anuncia el lector de pantalla. */
export type WheelItem = {
  key: string;
  /** Número en Aprender, nombre corto en Aperturas. */
  label: string;
  /** Nombre de la unidad en Aprender («Finales intermedios»); en Aperturas no se usa. */
  title?: string;
  accessibilityLabel: string;
  /** Unidad cerrada: gajo con el color de los vecinos y un candado chico al lado del número. */
  locked?: boolean;
};

type Props = {
  items: WheelItem[];
  initialIndex: number;
  /** 'number' = Aprender (48/22 px); 'short' = Aperturas (20/15 px). */
  labels?: 'number' | 'short';
  previousLabel: string;
  nextLabel: string;
  /** false mientras el riel está abierto: la corona sigue montada para la animación, pero no responde. */
  enabled?: boolean;
  onActiveChange: (index: number) => void;
  onOpen: (index: number) => void;
};

// Geometría del prototipo v2: media corona abierta a la derecha, con el eje en CX (pegado a la barra lateral).
const R = 230;
const RIN = 92;
const CX = 0;
const CY = R + 8;
const DEPTH = 5;
const STEP = 60;
const GAP = 2.4;
const W = R + 16;
const H = 2 * R + 16 + DEPTH;
const HALF = STEP / 2 - GAP;
/** Centro del texto sobre el eje del gajo (radio medio, un poco hacia afuera). */
const MID = (R + RIN) / 2 + 4;
/** Texto de una unidad cerrada de costado: más claro que el outline, para que el nombre se lea. */
const LOCKED_LABEL = '#8B8986';

/** Ancho de la media corona: las pantallas anchas lo usan para dejarle el lugar exacto a la izquierda. */
export const WHEEL_WIDTH = W;

const pt = (deg: number, radius: number) => ({
  x: CX + radius * Math.cos((deg * Math.PI) / 180),
  y: CY + radius * Math.sin((deg * Math.PI) / 180),
});
const o1 = pt(-HALF, R);
const o2 = pt(HALF, R);
const i1 = pt(-HALF, RIN);
const i2 = pt(HALF, RIN);
const WEDGE =
  `M${o1.x} ${o1.y} A${R} ${R} 0 0 1 ${o2.x} ${o2.y} ` +
  `L${i2.x} ${i2.y} A${RIN} ${RIN} 0 0 0 ${i1.x} ${i1.y} Z`;

/** Mezcla dos colores hex (#rrggbb) con t de 0 a 1. */
function mixColor(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',')})`;
}

function Chevron({ up }: { up: boolean }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        d={up ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'}
        stroke="#FFFFFF"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

/**
 * Media corona de unidades: gajos 3D sobre un eje vertical, con giro continuo de resorte.
 * Arrastre vertical (150 px por gajo), rueda del mouse (60 px por gajo) y toque en un gajo.
 */
export function UnitWheel({
  items,
  initialIndex,
  labels = 'number',
  previousLabel,
  nextLabel,
  enabled = true,
  onActiveChange,
  onOpen,
}: Props) {
  const reduced = useReducedMotion();
  const [pos, setPos] = useState(initialIndex);
  const [targetIndex, setTargetIndex] = useState(initialIndex);
  const [pressed, setPressed] = useState(-1);
  const [upDown, setUpDown] = useState(false);
  const [downDown, setDownDown] = useState(false);
  const [posValue] = useState(() => new Animated.Value(initialIndex));
  const posRef = useRef(initialIndex);
  const maxRef = useRef(items.length - 1);
  const targetIndexRef = useRef(initialIndex);
  const reducedRef = useRef(reduced);
  const enabledRef = useRef(enabled);
  const onActiveChangeRef = useRef(onActiveChange);
  const onOpenRef = useRef(onOpen);
  const activeRoundRef = useRef(Math.round(initialIndex));
  const goRef = useRef<(index: number, velocity?: number) => void>(() => {});
  const crownRef = useRef<React.ComponentRef<typeof View>>(null);
  const wheelAcc = useRef(0);
  const wheelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    maxRef.current = items.length - 1;
  }, [items.length]);
  useEffect(() => {
    reducedRef.current = reduced;
  }, [reduced]);
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);
  useEffect(() => {
    onActiveChangeRef.current = onActiveChange;
  }, [onActiveChange]);
  useEffect(() => {
    onOpenRef.current = onOpen;
  }, [onOpen]);

  const go = useCallback(
    (index: number, velocity = 0) => {
      const next = Math.max(0, Math.min(maxRef.current, index));
      targetIndexRef.current = next;
      setTargetIndex(next);
      if (reducedRef.current) {
        posValue.setValue(next);
        return;
      }
      Animated.spring(posValue, {
        toValue: next,
        velocity,
        stiffness: 240,
        damping: 31,
        mass: 1,
        useNativeDriver: false,
      }).start();
    },
    [posValue],
  );
  useEffect(() => {
    goRef.current = go;
  }, [go]);

  useEffect(() => {
    const id = posValue.addListener(({ value }) => {
      posRef.current = value;
      setPos(value);
      const rounded = Math.max(0, Math.min(maxRef.current, Math.round(value)));
      if (rounded !== activeRoundRef.current) {
        activeRoundRef.current = rounded;
        onActiveChangeRef.current(rounded);
      }
    });
    return () => posValue.removeListener(id);
  }, [posValue]);

  // Arrastre vertical: 150 px por gajo, con resistencia en los extremos e inercia al soltar.
  // La corona toma el gesto desde el inicio; las flechas de adentro quedan fuera del área.
  const drag = useRef({
    startY: 0,
    startPos: 0,
    index: -1,
    moved: false,
    samples: [] as { t: number; y: number }[],
  });
  const [pan, setPan] = useState<ReturnType<typeof PanResponder.create> | null>(null);
  useEffect(() => {
    const localPoint = (e: GestureResponderEvent) => {
      const node = crownRef.current as unknown as HTMLElement | null;
      if (Platform.OS === 'web' && node) {
        const r = node.getBoundingClientRect();
        return { x: e.nativeEvent.pageX - r.left, y: e.nativeEvent.pageY - r.top };
      }
      return { x: e.nativeEvent.locationX, y: e.nativeEvent.locationY };
    };
    const onArrow = (x: number, y: number) =>
      x >= CX + 30 &&
      x <= CX + 74 &&
      ((y >= CY - 58 && y <= CY - 10) || (y >= CY + 10 && y <= CY + 58));
    const wedgeAt = (x: number, y: number) => {
      const dx = x - CX;
      const dy = y - CY;
      const r = Math.hypot(dx, dy);
      if (r < RIN - 2 || r > R + DEPTH + 2) return -1;
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      return Math.max(0, Math.min(maxRef.current, Math.round(posRef.current + angle / STEP)));
    };
    setPan(
      PanResponder.create({
        onStartShouldSetPanResponder: (e) => {
          const p = localPoint(e);
          return !onArrow(p.x, p.y);
        },
        onStartShouldSetPanResponderCapture: (e) => {
          const p = localPoint(e);
          return !onArrow(p.x, p.y);
        },
        onPanResponderGrant: (e) => {
          posValue.stopAnimation();
          const y = e.nativeEvent.pageY;
          const p = localPoint(e);
          drag.current = {
            startY: y,
            startPos: posRef.current,
            index: wedgeAt(p.x, p.y),
            moved: false,
            samples: [{ t: e.nativeEvent.timestamp, y }],
          };
          if (drag.current.index >= 0) setPressed(drag.current.index);
        },
        onPanResponderMove: (e) => {
          const y = e.nativeEvent.pageY;
          const dy = y - drag.current.startY;
          if (!drag.current.moved && Math.abs(dy) <= 6) return;
          drag.current.moved = true;
          setPressed(-1);
          let p = drag.current.startPos - dy / 150;
          const max = maxRef.current;
          if (p < 0) p = p / 3;
          else if (p > max) p = max + (p - max) / 3;
          posValue.setValue(p);
          drag.current.samples.push({ t: e.nativeEvent.timestamp, y });
          if (drag.current.samples.length > 5) drag.current.samples.shift();
        },
        onPanResponderRelease: (_e, g) => {
          setPressed(-1);
          if (!drag.current.moved) {
            const idx = drag.current.index;
            if (idx >= 0 && idx !== Math.round(posRef.current)) goRef.current(idx);
            else if (idx >= 0) onOpenRef.current(idx);
            else goRef.current(Math.round(posRef.current));
            return;
          }
          const { samples } = drag.current;
          const a = samples[0];
          const b = samples[samples.length - 1];
          const v = b.t > a.t ? (-(b.y - a.y) / (b.t - a.t)) * (1000 / 150) : -g.vy * (1000 / 150);
          goRef.current(Math.round(posRef.current + v * 0.12), v);
        },
        onPanResponderTerminate: () => {
          setPressed(-1);
          goRef.current(Math.round(posRef.current));
        },
        onPanResponderTerminationRequest: () => false,
      }),
    );
  }, [posValue]);

  // Rueda del mouse o panel táctil: cada 60 px, un gajo.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = crownRef.current as unknown as HTMLElement | null;
    if (!node) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (wheelTimer.current) clearTimeout(wheelTimer.current);
      wheelTimer.current = setTimeout(() => {
        wheelAcc.current = 0;
      }, 180);
      wheelAcc.current += e.deltaY;
      while (wheelAcc.current >= 60) {
        wheelAcc.current -= 60;
        goRef.current(targetIndexRef.current + 1);
      }
      while (wheelAcc.current <= -60) {
        wheelAcc.current += 60;
        goRef.current(targetIndexRef.current - 1);
      }
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      node.removeEventListener('wheel', onWheel);
      if (wheelTimer.current) clearTimeout(wheelTimer.current);
    };
  }, []);

  // Flechas ↑/↓ y Enter/espacio, solo en la web y mientras la corona está visible.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKey = (e: KeyboardEvent) => {
      if (!enabledRef.current) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        goRef.current(targetIndexRef.current + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        goRef.current(targetIndexRef.current - 1);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onOpenRef.current(Math.max(0, Math.min(maxRef.current, Math.round(posRef.current))));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Sin selección de texto ni desplazamiento táctil sobre la corona (como el prototipo v2).
  const crownWebStyle =
    Platform.OS === 'web'
      ? ({ userSelect: 'none', touchAction: 'none', cursor: 'grab' } as unknown as ViewStyle)
      : undefined;

  return (
    <View ref={crownRef} style={[styles.crown, crownWebStyle]} {...(pan?.panHandlers ?? {})}>
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <ClipPath id="crownHalf">
            <Rect x={CX} y={-20} width={W} height={H + 40} />
          </ClipPath>
        </Defs>
        <G clipPath="url(#crownHalf)">
          {items.map((item, i) => {
            const a = (i - pos) * STEP;
            if (Math.abs(a) >= 150) return null;
            const t = Math.max(0, 1 - Math.abs(a) / STEP);
            const e = t * t * (3 - 2 * t);
            const press = pressed === i ? DEPTH / 2 : 0;
            const face = item.locked ? mixColor(colors.surfaceRaised, colors.surfaceShadow, e) : mixColor(colors.surfaceRaised, colors.primary, e);
            const edge = item.locked ? mixColor(colors.surfaceShadow, colors.surfaceShadow, e) : mixColor(colors.surfaceShadow, colors.primaryShadow, e);
            const labelColor = item.locked ? mixColor(LOCKED_LABEL, colors.textMuted, e) : mixColor(colors.textMuted, colors.text, e);
            // El corte del nombre se calcula con el tamaño máximo y no cambia al girar: el gajo elegido y los de
            // costado muestran siempre los mismos renglones; solo se interpola el tamaño de la letra.
            const num = 22 + 12 * e;
            const name = labels === 'number' && item.title ? fitWheelLabel(item.title, WHEEL_NAME_MAX) : null;
            const nameSize = name ? wheelNameSize(e, name.size) : 0;
            const lines = name?.lines ?? [];
            const lh = nameSize * 1.12;
            const block = num + (lines.length > 0 ? 4 + lines.length * lh : 0);
            const y0 = -block / 2;
            // En Aperturas el nombre corto va solo, en un renglón, con el mismo sistema y el mismo tope de 112 px.
            const short = labels === 'short' ? fitWheelLabel(item.label, 15 + 5 * e, 1) : null;
            return (
              <G key={item.key}>
                <Path
                  d={WEDGE}
                  transform={`translate(0 ${DEPTH}) rotate(${a} ${CX} ${CY})`}
                  fill={mixColor(colors.surfaceShadow, colors.surfaceShadow, e)}
                  stroke={mixColor(colors.surfaceShadow, colors.surfaceShadow, e)}
                  strokeWidth={2}
                />
                <Path
                  d={WEDGE}
                  transform={`translate(0 ${press}) rotate(${a} ${CX} ${CY})`}
                  fill={face}
                  stroke={edge}
                  strokeWidth={2}
                  accessibilityLabel={item.accessibilityLabel}
                />
                <G transform={`rotate(${a} ${CX} ${CY}) translate(${CX + MID} ${CY})`}>
                  {short ? (
                    <SvgText
                      x={0}
                      y={0}
                      textAnchor="middle"
                      alignmentBaseline="middle"
                      fontFamily={fonts.extrabold}
                      fontSize={short.size}
                      fill={labelColor}
                    >
                      {short.lines[0] ?? item.label}
                    </SvgText>
                  ) : (
                    <>
                      <SvgText x={0} y={y0 + num * 0.8} textAnchor="middle" fontFamily={fonts.extrabold} fontSize={num} fill={labelColor}>
                        {item.label}
                      </SvgText>
                      {item.locked && (
                        <G transform={`translate(${num * 0.45} ${y0 + num * 0.16}) scale(0.75)`}>
                          <Path
                            d="M2.5 5V3.5a3.5 3.5 0 0 1 7 0V5"
                            stroke={labelColor}
                            strokeWidth={1.8}
                            fill="none"
                            strokeLinecap="round"
                          />
                          <Rect y={5} width={12} height={9} rx={2} fill={labelColor} />
                        </G>
                      )}
                      {lines.map((line, k) => (
                        <SvgText
                          key={k}
                          x={0}
                          y={y0 + num + 4 + lh * (k + 0.8)}
                          textAnchor="middle"
                          fontFamily={fonts.extrabold}
                          fontSize={nameSize}
                          fill={labelColor}
                        >
                          {line}
                        </SvgText>
                      ))}
                    </>
                  )}
                </G>
              </G>
            );
          })}
        </G>
        <Line
          x1={CX}
          y1={CY - R}
          x2={CX}
          y2={CY + R + DEPTH}
          stroke={colors.surfaceRaised}
          strokeWidth={4}
          strokeLinecap="round"
        />
      </Svg>

      <Pressable
        onPress={() => go(targetIndex - 1)}
        onPressIn={() => setUpDown(true)}
        onPressOut={() => setUpDown(false)}
        disabled={targetIndex <= 0}
        accessibilityRole="button"
        accessibilityLabel={previousLabel}
        style={[styles.nav, { top: CY - 58, left: CX + 30, opacity: targetIndex <= 0 ? 0.35 : 1 }]}
      >
        <Circle3D size={44} color={colors.surfaceRaised} edge={colors.surfaceShadow} depth={4} pressed={upDown}>
          <Chevron up />
        </Circle3D>
      </Pressable>
      <Pressable
        onPress={() => go(targetIndex + 1)}
        onPressIn={() => setDownDown(true)}
        onPressOut={() => setDownDown(false)}
        disabled={targetIndex >= items.length - 1}
        accessibilityRole="button"
        accessibilityLabel={nextLabel}
        style={[styles.nav, { top: CY + 10, left: CX + 30, opacity: targetIndex >= items.length - 1 ? 0.35 : 1 }]}
      >
        <Circle3D size={44} color={colors.surfaceRaised} edge={colors.surfaceShadow} depth={4} pressed={downDown}>
          <Chevron up={false} />
        </Circle3D>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  crown: { width: W, height: H, position: 'relative' },
  nav: { position: 'absolute', width: 44, height: 48 },
});
