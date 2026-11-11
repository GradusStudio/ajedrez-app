import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ColumnScrollView } from '../components/ColumnScrollView';
import { AppLink } from '../components/AppLink';
import type { MessageKey } from '../i18n/es';
import { useI18n } from '../i18n/I18nContext';
import { CONTACT_EMAIL, SOURCE_URL } from '../links';
import { colors, fonts, radius, space } from '../theme';
import { statusBarTop } from '../components/statusBarTop';

// Cada sección es un título y un párrafo: privacy.<id>.title / privacy.<id>.text. `extra` agrega un enlace debajo.
const SECTIONS = ['stored', 'offline', 'leaves', 'drive', 'reminders', 'host', 'children', 'delete', 'free', 'contact'] as const;
type Section = (typeof SECTIONS)[number];

// Política de privacidad (diseño web, sección 7). Pantalla utilitaria de texto, igual que Instalar y Créditos.
export function PrivacyScreen({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();

  const extra = (id: Section) => {
    if (id === 'free') return <AppLink href={SOURCE_URL} style={styles.link}>{t('credits.app.code')}</AppLink>;
    if (id === 'contact') return <AppLink href={`mailto:${CONTACT_EMAIL}`} style={styles.link}>{CONTACT_EMAIL}</AppLink>;
    return null;
  };

  return (
    <ColumnScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: statusBarTop(space.sm) }]}
    >
      <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel={t('privacy.backLabel')} hitSlop={12} style={styles.backButton}>
        <Text style={styles.back}>{t('privacy.back')}</Text>
      </Pressable>

      <Text accessibilityRole="header" aria-level={1} style={styles.title}>{t('privacy.title')}</Text>
      <Text style={styles.updated}>{t('privacy.updated')}</Text>

      <View style={styles.summary}>
        <Text style={styles.summaryText}>{t('privacy.summary')}</Text>
      </View>

      {SECTIONS.map((id) => (
        <View key={id} style={styles.section}>
          <Text accessibilityRole="header" aria-level={2} style={styles.heading}>{t(`privacy.${id}.title` as MessageKey)}</Text>
          <Text style={styles.text}>{t(`privacy.${id}.text` as MessageKey)}</Text>
          {extra(id)}
        </View>
      ))}
    </ColumnScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  backButton: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  back: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted },
  title: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.text, marginTop: space.xs },
  updated: { fontFamily: fonts.bold, fontSize: 13, color: colors.textMuted, marginTop: space.xs, lineHeight: 19 },
  summary: {
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    borderBottomWidth: 4,
    borderBottomColor: colors.surfaceShadow,
    padding: space.lg,
    marginTop: space.lg,
  },
  summaryText: { fontFamily: fonts.bold, fontSize: 15, color: colors.text, lineHeight: 23 },
  section: { marginTop: space.xl },
  heading: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.text },
  text: { fontFamily: fonts.semibold, fontSize: 15, color: colors.textMuted, marginTop: space.sm, lineHeight: 23 },
  link: { fontSize: 15, marginTop: space.xs },
});
