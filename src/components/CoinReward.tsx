import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts } from '../theme';
import { planCoinReward, type CoinWave } from './coinRewardPlan';
import { COIN_EDGE, StatIcon } from './StatIcon';
import { useReducedMotion } from './useReducedMotion';

type Props = {
  boardSize: number;
  orientation: 'w' | 'b';
  /** Destino de la última jugada del usuario. Sin casilla, las monedas salen del centro. */
  square?: string | null;
  amount: number;
  /** Bono del día que va como segunda tanda. */
  bonus?: number;
  /** Rótulo del bono, ya traducido (p. ej. «con el bono del día»). */
  bonusLabel?: string;
};

type Point = { x: number; y: number };

const COIN_RATIO = 0.46;
const COIN_SIZE_MIN = 8;
const FLIGHT_MS = 820;
const COIN_GAP_MS = 70;
const START_MS = 260;

/** Centro de la casilla en píxeles, mirando desde el bando `orientation`. */
function squareCenter(square: string | null | undefined, orientation: 'w' | 'b', boardSize: number): Point {
  const cell = boardSize / 8;
  if (!square) return { x: boardSize / 2, y: boardSize / 2 };
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]) - 1;
  const col = orientation === 'w' ? file : 7 - file;
  const row = orientation === 'w' ? 7 - rank : rank;
  return { x: (col + 0.5) * cell, y: (row + 0.5) * cell };
}

/** Un cuadro de la curva de vuelo: posición, escala, giro y opacidad. */
type Frame = { x: number; y: number; scale: number; flip: number; opacity: number };

const FRAMES = 14;

function flightFrames(start: Point, target: Point, cell: number, spread: number): Frame[] {
  const rise = { x: start.x + spread * cell * 0.9, y: start.y - cell * (1.3 + 0.35 * Math.abs(Math.sin(spread * 2.3))) };
  const frames: Frame[] = [];
  for (let k = 0; k <= FRAMES; k++) {
    const t = k / FRAMES;
    let x: number;
    let y: number;
    let scale: number;
    if (t < 0.45) {
      const u = t / 0.45;
      const e = 1 - (1 - u) * (1 - u);
      x = start.x + (rise.x - start.x) * u;
      y = start.y + (rise.y - start.y) * e;
      scale = 0.4 + 0.7 * Math.min(1, u * 2);
    } else {
      const v = (t - 0.45) / 0.55;
      const w = v * v * (3 - 2 * v);
      x = rise.x + (target.x - rise.x) * w;
      y = rise.y + (target.y - rise.y) * w - Math.sin(v * Math.PI) * cell * 0.5;
      scale = 1.1 - 0.55 * w;
    }
    frames.push({ x, y, scale, flip: Math.cos(t * Math.PI * 4), opacity: t > 0.96 ? 0 : 1 });
  }
  return frames;
}

function CoinFace({ size }: { size: number }) {
  return (
    <View style={{ width: size, height: size }}>
      <StatIcon name="coin" size={size} />
      <Svg width={size} height={size} viewBox="0 0 24 24" style={StyleSheet.absoluteFill}>
        <Path d="M6.5 8.5a6.5 6.5 0 0 1 3-3" stroke="#FFF6C8" strokeWidth={1.4} strokeLinecap="round" fill="none" />
      </Svg>
    </View>
  );
}

function RewardCoin({
  start,
  target,
  cell,
  spread,
  delay,
  onLand,
}: {
  start: Point;
  target: Point;
  cell: number;
  spread: number;
  delay: number;
  onLand: () => void;
}) {
  const [progress] = useState(() => new Animated.Value(0));
  const [frames] = useState(() => flightFrames(start, target, cell, spread));
  const [size] = useState(() => Math.max(COIN_SIZE_MIN, cell * COIN_RATIO));
  const onLandRef = useRef(onLand);
  useEffect(() => {
    onLandRef.current = onLand;
  }, [onLand]);
  useEffect(() => {
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: FLIGHT_MS,
      delay,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    anim.start(({ finished }) => {
      if (finished) onLandRef.current();
    });
    return () => anim.stop();
  }, [progress, delay]);
  const inputRange = frames.map((_, i) => i / FRAMES);
  const half = size / 2;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: size,
        height: size,
        opacity: progress.interpolate({ inputRange, outputRange: frames.map((f) => f.opacity) }),
        transform: [
          { translateX: progress.interpolate({ inputRange, outputRange: frames.map((f) => f.x - half) }) },
          { translateY: progress.interpolate({ inputRange, outputRange: frames.map((f) => f.y - half) }) },
          { scale: progress.interpolate({ inputRange, outputRange: frames.map((f) => f.scale) }) },
          { scaleX: progress.interpolate({ inputRange, outputRange: frames.map((f) => f.flip) }) },
        ],
      }}
    >
      <CoinFace size={size} />
    </Animated.View>
  );
}

type Spec = { key: string; display: number; delay: number; spread: number; bonus: boolean };

function specsFor(wave: CoinWave, isBonus: boolean, startDelay: number): Spec[] {
  if (wave.coins <= 0) return [];
  return wave.displays.map((display, i) => ({
    key: `${isBonus ? 'b' : 'm'}-${i}`,
    display,
    delay: startDelay + i * COIN_GAP_MS,
    spread: wave.coins === 1 ? 0 : (i / (wave.coins - 1) - 0.5) * 2,
    bonus: isBonus,
  }));
}

/**
 * Premio de monedas sobre el tablero: las monedas salen de la casilla de la jugada y vuelan
 * a una pastilla dorada que suma. No recibe toques; el tablero sigue usable.
 */
export function CoinReward({ boardSize, orientation, square = null, amount, bonus = 0, bonusLabel }: Props) {
  const reduced = useReducedMotion();
  const [plan] = useState(() => planCoinReward(amount, bonus));
  const [showBonus, setShowBonus] = useState(plan.main.coins === 0 && !!plan.bonusWave);
  const [measured, setMeasured] = useState(false);
  const [shown, setShown] = useState(reduced ? plan.total : 0);
  const [pill, setPill] = useState({ width: 100, height: 36 });
  const [ring] = useState(() => new Animated.Value(0));
  const [pillEnter] = useState(() => new Animated.Value(reduced ? 1 : 0));
  const [pillOpacity] = useState(() => new Animated.Value(reduced ? 1 : 0));
  const [pillPulse] = useState(() => new Animated.Value(1));
  const [pillLift] = useState(() => new Animated.Value(0));
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const cell = boardSize / 8;
  const start = squareCenter(square, orientation, boardSize);
  const target = { x: boardSize - 10 - pill.width + 19, y: 10 + pill.height / 2 };
  const mainSpecs = specsFor(plan.main, false, START_MS);
  const bonusSpecs = plan.bonusWave ? specsFor(plan.bonusWave, true, 120) : [];
  const totalLabel = reduced || showBonus;

  const later = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
  };

  useEffect(() => {
    const pending = timers.current;
    if (reduced) {
      later(() => {
        Animated.parallel([
          Animated.timing(pillOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(pillLift, { toValue: -10, duration: 300, useNativeDriver: true }),
        ]).start();
      }, 1500);
      return () => pending.forEach(clearTimeout);
    }
    Animated.timing(ring, { toValue: 1, duration: 420, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
    later(() => {
      Animated.parallel([
        Animated.timing(pillOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(pillEnter, { toValue: 1, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]).start();
    }, 120);
    return () => pending.forEach(clearTimeout);
    // Solo al montar: la animación es una sola secuencia.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const land = (spec: Spec) => {
    setShown(spec.display);
    pillPulse.setValue(1);
    Animated.sequence([
      Animated.timing(pillPulse, { toValue: 1.12, duration: 90, useNativeDriver: true }),
      Animated.timing(pillPulse, { toValue: 1, duration: 90, useNativeDriver: true }),
    ]).start();
    if (spec.bonus && spec.display === plan.total) {
      later(() => {
        Animated.parallel([
          Animated.timing(pillOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(pillLift, { toValue: -10, duration: 300, useNativeDriver: true }),
        ]).start();
      }, 900);
    } else if (!spec.bonus && !plan.bonusWave && spec.display === plan.total) {
      later(() => {
        Animated.parallel([
          Animated.timing(pillOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(pillLift, { toValue: -10, duration: 300, useNativeDriver: true }),
        ]).start();
      }, 900);
    }
  };

  const landMain = (spec: Spec) => {
    land(spec);
    if (plan.bonusWave && spec.display === plan.amount && !showBonus) {
      setShowBonus(true);
    }
  };

  const display = reduced ? plan.total : shown;
  const bonusText = totalLabel ? (bonusLabel ?? '') : '';
  const pillScale = pillEnter.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.6, 1.06, 1] });

  return (
    <View pointerEvents="none" style={[styles.overlay, { width: boardSize, height: boardSize }]}>
      {square && !reduced && (
        <Animated.View
          style={[
            styles.ring,
            {
              left: start.x - cell / 2,
              top: start.y - cell / 2,
              width: cell,
              height: cell,
              opacity: ring.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 0] }),
              transform: [{ scale: ring.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.7, 1.08, 1.2] }) }],
            },
          ]}
        />
      )}
      {!reduced &&
        measured &&
        mainSpecs.map((spec) => (
          <RewardCoin
            key={spec.key}
            start={start}
            target={target}
            cell={cell}
            spread={spec.spread}
            delay={spec.delay}
            onLand={() => landMain(spec)}
          />
        ))}
      {!reduced &&
        measured &&
        showBonus &&
        plan.bonusWave &&
        bonusSpecs.map((spec) => (
          <RewardCoin
            key={spec.key}
            start={start}
            target={target}
            cell={cell}
            spread={spec.spread}
            delay={spec.delay}
            onLand={() => land(spec)}
          />
        ))}

      <Animated.View
        onLayout={(e: LayoutChangeEvent) => {
          setPill({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height });
          setMeasured(true);
        }}
        style={[styles.pill, { opacity: pillOpacity, transform: [{ translateY: pillLift }, { scale: pillScale }] }]}
      >
        <Animated.View style={[styles.pillContent, { transform: [{ scale: pillPulse }] }]}>
          <CoinFace size={26} />
          <View>
            <Text style={styles.amount}>+{display}</Text>
            {!!bonusText && <Text style={styles.bonus}>{bonusText}</Text>}
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', left: 0, top: 0, overflow: 'visible' },
  ring: { position: 'absolute', borderRadius: 8, borderWidth: 4, borderColor: colors.gold },
  pill: {
    position: 'absolute',
    right: 10,
    top: 10,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.gold,
    borderBottomWidth: 4,
    borderBottomColor: COIN_EDGE,
    backgroundColor: 'rgba(38, 36, 33, 0.92)',
    paddingVertical: 4,
    paddingLeft: 6,
    paddingRight: 12,
    zIndex: 2,
  },
  pillContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  amount: {
    fontFamily: fonts.extrabold,
    fontSize: 20,
    color: colors.gold,
    minWidth: 38,
    fontVariant: ['tabular-nums'],
  },
  bonus: { fontFamily: fonts.bold, fontSize: 10, color: colors.textMuted, marginTop: -3 },
});
