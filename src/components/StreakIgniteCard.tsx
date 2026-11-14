import React, { useEffect, useId, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useI18n } from '../i18n/I18nContext';
import { weekSteps, type StreakStatus } from '../progress/streak';
import { type, colors, fonts, radius, space } from '../theme';
import { StreakFlame } from './StreakFlame';
import { useReducedMotion } from './useReducedMotion';

const FLAME = 96;
const STAGE = 120;
const COUNT_LINE = type.display + 4;
const SPARK_COUNT = 6;
const SPARK_SIZE = FLAME / 24;

type Props = {
  /** Racha final, después de la acción. */
  streak: number;
  /** Racha antes de la acción (si falta, se deduce de `streakLit`). */
  previousStreak?: number;
  /** La acción encendió la racha hoy: corresponde la animación. */
  streakLit: boolean;
  /** Se completó una recuperación: el número no sube. */
  streakRecovered: boolean;
  /** Estado de la racha después de la acción. */
  state: StreakStatus['kind'];
  /** 0 = lunes, 6 = domingo. */
  todayIndex: number;
};

type Spark = { opacity: Animated.Value; x: Animated.Value; y: Animated.Value };

/**
 * Tarjeta de racha del resultado: la llama grande, el número, el mensaje de reencendido
 * y la semana como escalera (la marca de Gradus: cada día es un paso).
 */
export function StreakIgniteCard({ streak, previousStreak, streakLit, streakRecovered, state, todayIndex }: Props) {
  const { t, tn } = useI18n();
  const reduced = useReducedMotion();
  const haloId = `sh${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const from = previousStreak ?? (streakRecovered ? streak : streakLit ? Math.max(0, streak - 1) : streak);
  const animate = streakLit && !reduced;
  const safeToday = state === 'safe';
  const days = weekSteps(streak, todayIndex, safeToday);
  const labels = t('streak.daysShort').split(' ').filter(Boolean);

  const [emberScale] = useState(() => new Animated.Value(1));
  const [emberOpacity] = useState(() => new Animated.Value(animate ? 0.6 : 0));
  const [litOpacity] = useState(() => new Animated.Value(animate ? 0 : 1));
  const [flameScaleX] = useState(() => new Animated.Value(animate ? 0.35 : 1));
  const [flameScaleY] = useState(() => new Animated.Value(animate ? 0.15 : 1));
  const [haloScale] = useState(() => new Animated.Value(animate ? 0.4 : 1));
  const [haloOpacity] = useState(() => new Animated.Value(animate ? 0 : 0.8));
  const [numberY] = useState(() => new Animated.Value(animate && from !== streak ? 0 : -COUNT_LINE));
  const [messageOpacity] = useState(() => new Animated.Value(animate ? 0 : streakLit ? 1 : 0));
  const [messageY] = useState(() => new Animated.Value(animate ? 6 : 0));
  const [todayScale] = useState(() => new Animated.Value(animate ? 0.2 : 1));
  const [flicker] = useState(() => new Animated.Value(0));
  const [sparks] = useState<Spark[]>(() =>
    Array.from({ length: SPARK_COUNT }, () => ({
      opacity: new Animated.Value(0),
      x: new Animated.Value(0),
      y: new Animated.Value(0),
    }))
  );

  useEffect(() => {
    if (!animate) {
      emberOpacity.setValue(0);
      litOpacity.setValue(1);
      flameScaleX.setValue(1);
      flameScaleY.setValue(1);
      haloOpacity.setValue(0.8);
      haloScale.setValue(1);
      numberY.setValue(from !== streak ? -COUNT_LINE : 0);
      messageOpacity.setValue(streakLit ? 1 : 0);
      messageY.setValue(0);
      todayScale.setValue(1);
      return;
    }
    const halo = [
      Animated.timing(haloScale, { toValue: 1.15, duration: 420, delay: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(haloOpacity, { toValue: 1, duration: 420, delay: 420, useNativeDriver: true }),
      Animated.timing(haloScale, { toValue: 1, duration: 280, delay: 840, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ];
    const flame = [
      Animated.timing(flameScaleX, { toValue: 0.9, duration: 330, delay: 300, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(flameScaleY, { toValue: 1.18, duration: 330, delay: 300, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(flameScaleX, { toValue: 1.06, duration: 150, delay: 630, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(flameScaleY, { toValue: 0.94, duration: 150, delay: 630, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(flameScaleX, { toValue: 1, duration: 120, delay: 780, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(flameScaleY, { toValue: 1, duration: 120, delay: 780, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ];
    const number = Animated.timing(numberY, {
      toValue: -COUNT_LINE,
      duration: 520,
      delay: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    const message = [
      Animated.timing(messageOpacity, { toValue: 1, duration: 260, delay: 900, useNativeDriver: true }),
      Animated.timing(messageY, { toValue: 0, duration: 260, delay: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ];
    const today = [
      Animated.timing(todayScale, { toValue: 1.15, duration: 210, delay: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(todayScale, { toValue: 1, duration: 210, delay: 1110, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ];
    const sparkAnims = sparks.map((spark, i) => {
      const angle = ((-150 + i * 24) * Math.PI) / 180;
      const distance = (9 + (i % 3) * 2.5) * (FLAME / 24);
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance - 8;
      return Animated.sequence([
        Animated.delay(560 + i * 40),
        Animated.parallel([
          Animated.timing(spark.opacity, { toValue: 1, duration: 120, useNativeDriver: true }),
          Animated.timing(spark.x, { toValue: dx * 0.4, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(spark.y, { toValue: dy * 0.4, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(spark.opacity, { toValue: 0, duration: 520, useNativeDriver: true }),
          Animated.timing(spark.x, { toValue: dx, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(spark.y, { toValue: dy, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]),
      ]);
    });
    const flickerAnim = Animated.sequence([
      Animated.delay(1000),
      Animated.loop(
        Animated.sequence([
          Animated.timing(flicker, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(flicker, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
        { iterations: 2 }
      ),
    ]);
    const all = Animated.parallel([
      Animated.timing(emberScale, { toValue: 1.35, duration: 300, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      Animated.timing(emberOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(emberOpacity, { toValue: 0, duration: 260, delay: 300, useNativeDriver: true }),
      Animated.timing(litOpacity, { toValue: 1, duration: 160, delay: 280, useNativeDriver: true }),
      ...halo,
      ...flame,
      ...(from !== streak ? [number] : []),
      ...message,
      ...today,
      ...sparkAnims,
      flickerAnim,
    ]);
    all.start();
    return () => all.stop();
  }, [
    animate,
    emberOpacity,
    emberScale,
    flameScaleX,
    flameScaleY,
    flicker,
    from,
    haloOpacity,
    haloScale,
    litOpacity,
    messageOpacity,
    messageY,
    numberY,
    sparks,
    streak,
    streakLit,
    todayScale,
  ]);

  const flickerScale = flicker.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] });
  const flickerRotate = flicker.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '1.5deg'] });
  const message = streakLit ? t('streak.litToday') : '';

  return (
    <View
      style={styles.card}
      accessible
      accessibilityLabel={[tn('lessonResult.streakDay', streak), message].filter(Boolean).join('. ')}
    >
      <View style={styles.stage}>
        <Animated.View style={[styles.halo, { opacity: haloOpacity, transform: [{ scale: haloScale }] }]}>
          <Svg width={STAGE} height={STAGE} viewBox="0 0 120 120">
            <Defs>
              <RadialGradient id={haloId}>
                <Stop offset="0" stopColor={colors.flame} stopOpacity={0.35} />
                <Stop offset="1" stopColor={colors.flame} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={60} cy={72} r={58} fill={`url(#${haloId})`} />
          </Svg>
        </Animated.View>
        <Animated.View
          style={[
            styles.flameLayer,
            { opacity: emberOpacity, transform: [{ scale: emberScale }] },
          ]}
        >
          <StreakFlame state="ember" size={FLAME} pulse={false} />
        </Animated.View>
        <Animated.View
          style={[
            styles.flameLayer,
            {
              opacity: litOpacity,
              transform: [
                { scaleX: flameScaleX },
                { scaleY: flameScaleY },
                { scale: flickerScale },
                { rotate: flickerRotate },
              ],
            },
          ]}
        >
          <StreakFlame state="lit" size={FLAME} />
        </Animated.View>
        {sparks.map((spark, i) => (
          <Animated.View
            key={i}
            style={[
              styles.spark,
              { opacity: spark.opacity, transform: [{ translateX: spark.x }, { translateY: spark.y }] },
            ]}
          />
        ))}
      </View>

      <View style={styles.count}>
        <Animated.View style={{ transform: [{ translateY: numberY }] }}>
          <Text style={styles.number}>{from}</Text>
          <Text style={styles.number}>{streak}</Text>
        </Animated.View>
      </View>
      <Text style={styles.label}>{tn('lessonResult.streakDay', streak)}</Text>
      {streakLit && (
        <Animated.Text
          style={[styles.message, { opacity: messageOpacity, transform: [{ translateY: messageY }] }]}
        >
          {message}
        </Animated.Text>
      )}

      <View style={styles.week}>
        {days.map((done, i) => (
          <View key={i} style={styles.day}>
            <Animated.View
              style={[
                styles.step,
                { height: 10 + i * 5 },
                done ? styles.stepDone : styles.stepOff,
                i === todayIndex && styles.stepToday,
                i === todayIndex && { transform: [{ scaleY: todayScale }] },
              ]}
            />
            <Text style={[styles.dayLabel, i === todayIndex && styles.dayLabelToday]}>{labels[i] ?? ''}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 360,
    marginTop: space.xl,
    paddingHorizontal: space.xl,
    paddingTop: space.xl,
    paddingBottom: space.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    borderBottomWidth: 4,
    borderBottomColor: colors.surfaceShadow,
    alignItems: 'center',
  },
  stage: { width: STAGE, height: STAGE, alignItems: 'center', justifyContent: 'flex-end' },
  halo: { position: 'absolute', left: 0, bottom: 0 },
  flameLayer: {
    position: 'absolute',
    left: (STAGE - FLAME) / 2,
    bottom: 0,
    width: FLAME,
    height: FLAME,
    transformOrigin: '50% 95%',
  },
  spark: {
    position: 'absolute',
    left: STAGE / 2 - SPARK_SIZE / 2,
    top: STAGE / 2 - SPARK_SIZE / 2,
    width: SPARK_SIZE,
    height: SPARK_SIZE,
    borderRadius: SPARK_SIZE / 2,
    backgroundColor: '#FFD27A',
  },
  count: { height: COUNT_LINE, overflow: 'hidden', marginTop: space.xs },
  number: {
    height: COUNT_LINE,
    lineHeight: COUNT_LINE,
    fontFamily: fonts.extrabold,
    fontSize: type.display,
    color: colors.gold,
    textAlign: 'center',
  },
  label: { fontFamily: fonts.bold, fontSize: type.body, color: colors.textMuted, marginTop: space.xs },
  message: { fontFamily: fonts.bold, fontSize: type.body, color: colors.gold, marginTop: space.sm, textAlign: 'center' },
  week: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: space.xl },
  day: { alignItems: 'center', gap: 5 },
  step: { width: 26, borderRadius: 5, borderBottomWidth: 3, transformOrigin: '50% 100%' },
  stepDone: { backgroundColor: colors.flame, borderBottomColor: '#B8601E' },
  stepOff: { backgroundColor: colors.surfaceRaised, borderBottomColor: colors.surfaceShadow },
  stepToday: { borderWidth: 2, borderColor: colors.flame, borderBottomWidth: 5 },
  dayLabel: { fontFamily: fonts.bold, fontSize: type.caption, color: colors.textMuted },
  dayLabelToday: { color: colors.gold },
});
