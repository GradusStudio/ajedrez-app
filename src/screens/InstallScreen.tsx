import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StatusBar as RNStatusBar, StyleSheet, Text, View } from 'react-native';
import { AppLink } from '../components/AppLink';
import { Button3D } from '../components/Button3D';
import type { MessageKey } from '../i18n/es';
import { useI18n } from '../i18n/I18nContext';
import { InstallPlatform } from '../pwa/installPlatform';
import { colors, fonts, radius, space } from '../theme';

type System = Exclude<InstallPlatform, 'installed'>;

const SYSTEMS: System[] = ['ios', 'android', 'desktop'];
// Cuántos pasos tiene cada sistema en es.ts: install.<sistema>.<n>.
const STEP_COUNT: Record<System, number> = { ios: 4, android: 3, desktop: 3 };

type Props = {
  /** null mientras no se sabe (exportación estática): se muestra solo el encabezado. */
  platform: InstallPlatform | null;
  /** Chrome ofreció instalar: se muestra el botón y los pasos del menú quedan plegados. */
  canPrompt: boolean;
  onInstall: () => void;
  /** Se instaló desde el botón en esta visita. */
  justInstalled: boolean;
  onOpen: () => void;
};

// Instalar Gradus (diseño web, sección 3). Pantalla utilitaria: ícono, nombre, qué es y los pasos del sistema del visitante.
export function InstallScreen({ platform, canPrompt, onInstall, justInstalled, onOpen }: Props) {
  const { t } = useI18n();
  const installed = platform === 'installed';
  const own: System | null = platform && platform !== 'installed' ? platform : null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: (RNStatusBar.currentHeight ?? 40) + space.xxl }]}>
      <View style={styles.column}>
        <Image source={require('../../assets/icon.png')} style={styles.icon} accessibilityLabel={t('install.logoLabel')} />
        <Text accessibilityRole="header" aria-level={1} style={styles.brand}>Gradus</Text>
        <Text style={styles.tagline}>{t('install.tagline')}</Text>

        {installed && (
          <View style={styles.block}>
            <Text accessibilityRole="header" aria-level={2} style={styles.heading}>{t('install.installed')}</Text>
            <Text style={styles.text}>{t('install.installedText')}</Text>
            <Button3D label={t('install.button.open')} variant="primary" onPress={onOpen} style={styles.button} />
          </View>
        )}

        {own && (
          <View style={styles.block}>
            {justInstalled ? (
              <Text accessibilityRole="alert" style={styles.heading}>{t('install.accepted')}</Text>
            ) : (
              canPrompt && <Button3D label={t('install.button.install')} variant="primary" onPress={onInstall} style={styles.button} />
            )}
            <Button3D label={t('install.button.openBrowser')} onPress={onOpen} style={styles.button} />

            <Steps system={own} open={!canPrompt} first />
            <Text accessibilityRole="header" aria-level={2} style={styles.others}>{t('install.others')}</Text>
            {SYSTEMS.filter((s) => s !== own).map((s) => (
              <Steps key={s} system={s} open={false} />
            ))}
          </View>
        )}

        <AppLink href="/privacidad" style={styles.privacy}>{t('privacy.link')}</AppLink>
      </View>
    </ScrollView>
  );
}

// Pasos de un sistema. `first` y `open`: es el del visitante y se muestra sin plegar; si no, va en un disclosure.
function Steps({ system, open, first }: { system: System; open: boolean; first?: boolean }) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const name = t(`install.system.${system}`);

  const list = (
    <View accessibilityRole="list" style={styles.card}>
      {Array.from({ length: STEP_COUNT[system] }, (_, i) => (
        <View key={i} accessibilityRole="listitem" style={[styles.step, i > 0 && { marginTop: space.md }]}>
          <View style={styles.num}>
            <Text style={styles.numText}>{i + 1}</Text>
          </View>
          <Text style={styles.stepText}>{t(`install.${system}.${i + 1}` as MessageKey)}</Text>
        </View>
      ))}
    </View>
  );

  if (first && open) {
    return (
      <View style={{ marginTop: space.xl }}>
        <Text accessibilityRole="header" aria-level={2} style={styles.stepsTitle}>{t('install.stepsTitle', { system: name })}</Text>
        {list}
      </View>
    );
  }

  return (
    <View style={{ marginTop: first ? space.xl : space.sm }}>
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={t(expanded ? 'install.hideSteps' : 'install.showSteps', { system: name })}
        aria-expanded={expanded}
        style={({ pressed }) => [styles.toggle, pressed && { transform: [{ translateY: 2 }], borderBottomWidth: 2 }]}
      >
        <Text style={styles.toggleText}>{t(`install.label.${system}` as MessageKey)}</Text>
        <Text style={styles.chevron}>{expanded ? '▾' : '▸'}</Text>
      </Pressable>
      {expanded && <View style={{ marginTop: space.sm }}>{list}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, paddingHorizontal: space.lg, paddingBottom: space.xxl, alignItems: 'center' },
  column: { width: '100%', maxWidth: 480 },
  icon: { width: 72, height: 72, borderRadius: 16 },
  brand: { fontFamily: fonts.extrabold, fontSize: 28, color: colors.text, marginTop: space.md },
  tagline: { fontFamily: fonts.bold, fontSize: 15, color: colors.textMuted, marginTop: space.xs, lineHeight: 22 },
  privacy: { fontFamily: fonts.bold, fontSize: 14, color: colors.primary, marginTop: space.xxl, textDecorationLine: 'underline' },
  block: { marginTop: space.xl },
  heading: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.text },
  text: { fontFamily: fonts.bold, fontSize: 15, color: colors.textMuted, marginTop: space.sm, lineHeight: 22 },
  button: { marginTop: space.md, minHeight: 48 },
  stepsTitle: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.text, marginBottom: space.md },
  others: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.textMuted, marginTop: space.xl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    borderBottomWidth: 4,
    borderBottomColor: colors.surfaceShadow,
    padding: space.lg,
  },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  num: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  numText: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.text },
  stepText: { flex: 1, fontFamily: fonts.bold, fontSize: 15, color: colors.text, lineHeight: 22, paddingTop: 3 },
  toggle: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    borderBottomWidth: 4,
    borderBottomColor: colors.surfaceShadow,
    paddingHorizontal: 14,
  },
  toggleText: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.text },
  chevron: { fontFamily: fonts.bold, fontSize: 16, color: colors.textMuted },
});
