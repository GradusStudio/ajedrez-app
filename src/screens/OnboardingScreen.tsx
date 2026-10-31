import React, { useState } from 'react';
import { Pressable, StatusBar as RNStatusBar, StyleSheet, Text, View } from 'react-native';
import { Button3D } from '../components/Button3D';
import { useI18n } from '../i18n/I18nContext';
import { PlayerLevel } from '../progress/progressStore';
import { colors, fonts, radius, space } from '../theme';

type Props = {
  onFinish: (choice: { level?: PlayerLevel }) => void;
};

// El texto de cada nivel está en es.ts: onboarding.level.<nivel> y onboarding.level.<nivel>.description.
const LEVELS: PlayerLevel[] = ['nuevo', 'basico', 'casual'];

// Primera vez que se abre la app: bienvenida y nivel. Todo se puede saltar (mapa-de-pantallas.md, 2.2).
export function OnboardingScreen({ onFinish }: Props) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);

  return (
    <View style={[styles.screen, { paddingTop: (RNStatusBar.currentHeight ?? 40) + space.lg }]}>
      <View style={styles.top}>
        <View style={styles.dots} accessibilityLabel={t('onboarding.step', { n: step + 1 })}>
          {[0, 1].map((i) => (
            <View key={i} style={[styles.dot, i <= step && styles.dotOn]} />
          ))}
        </View>
        <Pressable onPress={() => onFinish({})} accessibilityRole="button" hitSlop={12}>
          <Text style={styles.skip}>{t('onboarding.skip')}</Text>
        </Pressable>
      </View>

      {step === 0 && (
        <View style={styles.body}>
          <Text style={styles.emoji}>♞</Text>
          <Text style={styles.brand}>Gradus</Text>
          <Text style={styles.title}>{t('onboarding.title')}</Text>
          <Text style={styles.text}>{t('onboarding.text')}</Text>
          <View style={{ flex: 1 }} />
          <Button3D label={t('common.start')} variant="primary" onPress={() => setStep(1)} />
        </View>
      )}

      {step === 1 && (
        <View style={styles.body}>
          <Text style={styles.title}>{t('onboarding.question')}</Text>
          <Text style={styles.text}>{t('onboarding.questionText')}</Text>
          <View style={{ height: space.lg }} />
          {LEVELS.map((level) => (
            <Choice
              key={level}
              label={t(`onboarding.level.${level}`)}
              description={t(`onboarding.level.${level}.description`)}
              onPress={() => onFinish({ level })}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function Choice({ label, description, onPress }: { label: string; description: string; onPress: () => void }) {
  const { t } = useI18n();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('onboarding.choiceLabel', { label, description })}
      style={({ pressed }) => [styles.choice, pressed && { transform: [{ translateY: 2 }], borderBottomWidth: 2 }]}
    >
      <Text style={styles.choiceLabel}>{label}</Text>
      <Text style={styles.choiceText}>{description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space.lg, paddingBottom: space.xxl },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.xl },
  dots: { flexDirection: 'row', gap: space.sm },
  dot: { width: 28, height: 8, borderRadius: radius.bar, backgroundColor: colors.surfaceRaised },
  dotOn: { backgroundColor: colors.primary },
  skip: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted },
  body: { flex: 1 },
  emoji: { fontSize: 72, color: colors.primary, marginBottom: space.md },
  brand: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.gold, letterSpacing: 2, textTransform: 'uppercase', marginBottom: space.xs },
  title: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.text },
  text: { fontFamily: fonts.bold, fontSize: 15, color: colors.textMuted, marginTop: space.sm, lineHeight: 22 },
  choice: {
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    borderBottomWidth: 4,
    borderBottomColor: colors.surfaceShadow,
    paddingVertical: space.md,
    paddingHorizontal: 14,
    marginBottom: space.sm,
  },
  choiceLabel: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.text },
  choiceText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.textMuted, marginTop: 2 },
});
