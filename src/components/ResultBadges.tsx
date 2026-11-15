import React from 'react';
import { Animated, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { StatIcon } from './StatIcon';
import { StreakFlame } from './StreakFlame';
import { useI18n } from '../i18n/I18nContext';
import { colors, fonts, space, type } from '../theme';

const FLAME = '#F5912F';

type Props = {
  coins: number;
  dailyBonus: number;
  streak: number;
  streakLit: boolean;
  streakRecovered: boolean;
  /** «Ganaste, pero sin monedas» (ver `coinsNoteVisible` en resultText.ts). */
  showCoinsNote?: boolean;
  /** La capa mide la pastilla de monedas para hacerlas volar hasta ella. */
  coinRef?: React.Ref<React.ComponentRef<typeof View>>;
  /** Pulso de la pastilla cuando aterrizan las monedas (solo la capa). */
  pulse?: Animated.Value;
  style?: StyleProp<ViewStyle>;
  noteStyle?: StyleProp<TextStyle>;
};

/**
 * Lo que se ganó en la partida, en pastillas: monedas, premio del día, racha recuperada o racha viva. Es la única
 * fuente de estos textos y condiciones: la capa del resultado y el panel que queda al cerrarla muestran lo mismo.
 */
export function ResultBadges({ coins, dailyBonus, streak, streakLit, streakRecovered, showCoinsNote, coinRef, pulse, style, noteStyle }: Props) {
  const { t, tn } = useI18n();
  const hasPills = coins > 0 || dailyBonus > 0 || streakRecovered || streak > 0;
  const coinsInside = (
    <>
      <StatIcon name="coin" size={18} />
      <Text style={styles.pillCoinsText}>{t('result.coinsPill', { n: coins })}</Text>
    </>
  );

  return (
    <>
      {hasPills && (
        <View style={[styles.pills, style]}>
          {coins > 0 && (
            <View ref={coinRef} style={[styles.pill, styles.pillCoins]} accessibilityLabel={t('result.coinsPill', { n: coins })}>
              {pulse ? (
                <Animated.View style={[styles.pillContent, { transform: [{ scale: pulse }] }]}>{coinsInside}</Animated.View>
              ) : (
                <View style={styles.pillContent}>{coinsInside}</View>
              )}
            </View>
          )}
          {dailyBonus > 0 && (
            <View style={[styles.pill, styles.pillDaily]}>
              <StatIcon name="coin" size={16} />
              <Text style={styles.pillDailyText}>{t('result.dailyPill', { n: dailyBonus })}</Text>
            </View>
          )}
          {streakRecovered ? (
            <View style={[styles.pill, styles.pillFlame]}>
              <StreakFlame state="recovering" size={18} />
              <Text style={styles.pillFlameText}>{t('result.streakRecovered')}</Text>
            </View>
          ) : (
            streak > 0 && (
              <View style={[styles.pill, styles.pillFlame]}>
                <StreakFlame state={streakLit ? 'lit' : 'ember'} size={18} />
                <Text style={styles.pillFlameText}>{tn('result.streakPill', streak)}</Text>
              </View>
            )
          )}
        </View>
      )}
      {showCoinsNote && <Text style={[styles.coinsNote, noteStyle]}>{t('game.coinsNote')}</Text>}
    </>
  );
}

const styles = StyleSheet.create({
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    borderWidth: 2,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(38,36,33,0.8)',
  },
  pillContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pillCoins: { borderColor: colors.gold },
  pillCoinsText: { fontFamily: fonts.extrabold, fontSize: type.body, color: colors.gold },
  pillDaily: { borderColor: 'rgba(255,255,255,0.12)' },
  pillDailyText: { fontFamily: fonts.extrabold, fontSize: type.body, color: colors.text },
  pillFlame: { borderColor: FLAME },
  pillFlameText: { fontFamily: fonts.extrabold, fontSize: type.body, color: FLAME },
  coinsNote: { fontFamily: fonts.semibold, fontSize: type.secondary, color: colors.textMuted, marginTop: space.sm },
});
