import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button3D } from '../components/Button3D';
import { useI18n } from '../i18n/I18nContext';
import { colors, fonts, space } from '../theme';
import { statusBarTop } from '../components/statusBarTop';

// Dirección que no corresponde a ninguna pantalla. El título de la pestaña y el noindex los pone useRouteMeta.
export function NotFoundScreen({ onHome }: { onHome: () => void }) {
  const { t } = useI18n();
  return (
    <View style={[styles.screen, { paddingTop: statusBarTop(space.xxl) }]}>
      <Text style={styles.glyph} accessibilityElementsHidden importantForAccessibility="no">♞</Text>
      <Text accessibilityRole="header" aria-level={1} style={styles.title}>{t('notFound.title')}</Text>
      <Text style={styles.text}>{t('notFound.text')}</Text>
      <Button3D label={t('notFound.button')} onPress={onHome} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space.lg, alignItems: 'center' },
  glyph: { fontSize: 64, color: colors.textMuted },
  title: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.text, marginTop: space.lg, textAlign: 'center' },
  text: { fontFamily: fonts.semibold, fontSize: 15, color: colors.textMuted, marginTop: space.sm, lineHeight: 23, textAlign: 'center' },
  button: { marginTop: space.xl, alignSelf: 'stretch' },
});
