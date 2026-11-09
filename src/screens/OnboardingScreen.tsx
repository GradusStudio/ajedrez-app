import React, { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BotAvatar } from '../components/BotAvatar';
import { Button3D } from '../components/Button3D';
import { MiniBoard } from '../components/MiniBoard';
import { useContent } from '../data/useContent';
import { useI18n } from '../i18n/I18nContext';
import { declineInstallOffer, isInstallOfferDeclined } from '../pwa/installOffer';
import { playedOnPortada } from '../pwa/portadaMark';
import { useInstallPlatform } from '../pwa/useInstallPlatform';
import { PlayerLevel } from '../progress/progressStore';
import { colors, fonts, radius, space } from '../theme';
import { statusBarTop } from '../components/statusBarTop';

type Props = {
  onFinish: (choice: { level?: PlayerLevel }) => void;
};

// El texto de cada nivel está en es.ts: onboarding.level.<nivel> y onboarding.level.<nivel>.description.
const LEVELS: PlayerLevel[] = ['nuevo', 'basico', 'casual'];

/** Quien recibe: Pipo enseña la Unidad 1 y es el anfitrión de la portada (sitio/), así la bienvenida la continúa. */
const HOST_ID = 'pipo';
const MINI = 72;

/** Lo que se practica en cada nivel, en un recorte de tablero. */
const LEVEL_BOARD: Record<PlayerLevel, React.ComponentProps<typeof MiniBoard>> = {
  // Cómo se mueve cada pieza: el caballo y sus saltos.
  nuevo: { size: MINI, corner: 'b1', span: 5, pieces: { d3: 'wn' }, dots: ['b2', 'b4', 'c1', 'c5', 'e1', 'e5', 'f2', 'f4'] },
  // Reglas que ya conoce: el rey enrocado.
  basico: { size: MINI, corner: 'e1', span: 4, pieces: { g1: 'wk', f1: 'wr', f2: 'wp', g2: 'wp', h2: 'wp' } },
  // Táctica: una clavada contra el rey.
  casual: { size: MINI, corner: 'b5', span: 4, pieces: { b5: 'wb', c6: 'bn', e8: 'bk' }, arrow: 'b5e8' },
};

// Primera vez que se abre la app: bienvenida y nivel. Todo se puede saltar (mapa-de-pantallas.md, 2.2).
export function OnboardingScreen({ onFinish }: Props) {
  const { t } = useI18n();
  const { findBot } = useContent();
  const host = findBot(HOST_ID);
  // Si ya jugó el primer paso en la portada, la presentación sobra: va directo al nivel.
  const [step, setStep] = useState(() => (playedOnPortada() ? 1 : 0));
  // Solo en Safari de iPhone: lo guardado ahí no pasa a la app instalada, así que se ofrece instalar antes de empezar.
  const platform = useInstallPlatform();
  const [stayInBrowser, setStayInBrowser] = useState(isInstallOfferDeclined);
  const offerInstall = platform === 'ios' && !stayInBrowser;
  const showInstall = step === 0 && offerInstall;

  return (
    <View style={[styles.screen, { paddingTop: statusBarTop(space.lg) }]}>
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

      {showInstall && (
        <View style={styles.body}>
          <Text accessibilityRole="header" style={styles.title}>{t('onboarding.install.title')}</Text>
          <Text style={styles.text}>{t('onboarding.install.text')}</Text>
          <View style={{ flex: 1 }} />
          <Button3D label={t('onboarding.install.go')} variant="primary" onPress={() => router.push('/instalar')} />
          <Button3D label={t('onboarding.install.stay')} onPress={() => { declineInstallOffer(); setStayInBrowser(true); }} style={{ marginTop: space.md }} />
        </View>
      )}

      {step === 0 && !offerInstall && (
        <View style={styles.body}>
          {host && (
            <View
              style={styles.host}
              accessible
              accessibilityLabel={t('lesson.teacherSays', { name: host.name, text: host.teaching.welcome[0] })}
            >
              <BotAvatar bot={host} size={96} expression="explica" />
              <View style={styles.bubble}>
                <Text style={styles.name}>{host.name}</Text>
                <Text style={styles.bubbleText}>{host.teaching.welcome[0]}</Text>
              </View>
            </View>
          )}
          <Text accessibilityRole="header" style={styles.title}>{t('onboarding.title')}</Text>
          <Text style={styles.text}>{t('onboarding.text')}</Text>
          <View style={{ flex: 1 }} />
          <Button3D label={t('common.start')} variant="primary" onPress={() => setStep(1)} />
        </View>
      )}

      {step === 1 && (
        <View style={styles.body}>
          <Text accessibilityRole="header" style={styles.title}>{t('onboarding.question')}</Text>
          <Text style={styles.text}>{t('onboarding.questionText')}</Text>
          <View style={{ height: space.lg }} />
          {LEVELS.map((level) => (
            <Choice
              key={level}
              board={LEVEL_BOARD[level]}
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

function Choice({
  board,
  label,
  description,
  onPress,
}: {
  board: React.ComponentProps<typeof MiniBoard>;
  label: string;
  description: string;
  onPress: () => void;
}) {
  const { t } = useI18n();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('onboarding.choiceLabel', { label, description })}
      style={({ pressed }) => [styles.choice, pressed && { transform: [{ translateY: 2 }], borderBottomWidth: 2 }]}
    >
      <MiniBoard {...board} />
      <View style={styles.choiceBody}>
        <Text style={styles.choiceLabel}>{label}</Text>
        <Text style={styles.choiceText}>{description}</Text>
      </View>
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
  host: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md, marginBottom: space.xl },
  bubble: {
    flex: 1,
    marginTop: space.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    borderBottomWidth: 4,
    borderBottomColor: colors.surfaceShadow,
    paddingVertical: space.md,
    paddingHorizontal: 14,
  },
  name: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.gold },
  bubbleText: { fontFamily: fonts.bold, fontSize: 17, color: colors.text, lineHeight: 24, marginTop: 2 },
  title: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.text },
  text: { fontFamily: fonts.bold, fontSize: 15, color: colors.textMuted, marginTop: space.sm, lineHeight: 22 },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    borderBottomWidth: 4,
    borderBottomColor: colors.surfaceShadow,
    padding: space.md,
    marginBottom: space.sm,
  },
  choiceBody: { flex: 1 },
  choiceLabel: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.text },
  choiceText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.textMuted, marginTop: 2 },
});
