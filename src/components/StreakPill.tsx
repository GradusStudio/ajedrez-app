import React, { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useI18n } from '../i18n/I18nContext';
import { type, colors, fonts, space } from '../theme';
import { StreakFlame } from './StreakFlame';
import { useReducedMotion } from './useReducedMotion';

type Props = {
  streak: number;
  /** La acción encendió la racha hoy: la pastilla hace la celebración breve. */
  streakLit: boolean;
};

/** Pastilla de racha para puzzle y partida: llama de 32 px y los días, sin la tarjeta completa. */
export function StreakPill({ streak, streakLit }: Props) {
  const { tn } = useI18n();
  const reduced = useReducedMotion();
  const animate = streakLit && !reduced;
  const [flameScale] = useState(() => new Animated.Value(animate ? 0.35 : 1));
  const [opacity] = useState(() => new Animated.Value(animate ? 0 : 1));
  const [textY] = useState(() => new Animated.Value(animate ? 6 : 0));

  useEffect(() => {
    if (!animate) {
      flameScale.setValue(1);
      opacity.setValue(1);
      textY.setValue(0);
      return;
    }
    const anim = Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 160, delay: 280, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(300),
        Animated.timing(flameScale, { toValue: 1.1, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(flameScale, { toValue: 1, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]),
      Animated.timing(textY, { toValue: 0, duration: 260, delay: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [animate, flameScale, opacity, textY]);

  return (
    <View style={styles.pill} accessible accessibilityLabel={tn('lessonResult.streakDay', streak)}>
      <Animated.View style={{ opacity, transform: [{ scale: flameScale }] }}>
        <StreakFlame state="lit" size={32} />
      </Animated.View>
      <Animated.Text style={[styles.text, { transform: [{ translateY: textY }] }]}>
        {tn('lessonResult.streakDay', streak)}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: space.sm,
    marginTop: space.md,
    paddingVertical: space.xs,
    paddingHorizontal: space.md,
    backgroundColor: colors.surface,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
  },
  text: { fontFamily: fonts.bold, fontSize: type.secondary, color: colors.text },
});
