import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppLink } from '../components/AppLink';
import { useI18n } from '../i18n/I18nContext';
import { SOURCE_URL } from '../links';
import { PRIVACY_PAGE_AVAILABLE } from '../privacyPage';
import { STOCKFISH_VERSION } from '../engine/stockfish/stockfishAssets';
import { colors, fonts, radius, space } from '../theme';
import { statusBarTop } from '../components/statusBarTop';

type Credit = { name: string; what: string; note?: string; license: string; links?: { label: string; url: string }[] };

type Translate = ReturnType<typeof useI18n>['t'];

// Licencias revisadas en el package.json de cada paquete (ver docs/motor.md y docs/puzzles.md).
// Los nombres de licencias y de paquetes de terceros se dejan tal cual; se traduce solo el texto propio de la app.
const credits = (t: Translate): Credit[] => [
  {
    name: t('credits.app.name'),
    what: t('credits.app.what'),
    note: t('credits.app.codeNote'),
    license: t('credits.license.gplOrLater'),
    links: [
      { label: t('credits.app.code'), url: SOURCE_URL },
      { label: t('credits.gplText'), url: 'https://www.gnu.org/licenses/gpl-3.0.html' },
    ],
  },
  {
    name: `Stockfish 19 · Stockfish.js ${STOCKFISH_VERSION.split(' ')[0]}`,
    what: t('credits.stockfish.what'),
    license: 'GNU GPL v3',
    links: [
      { label: t('credits.stockfish.code'), url: 'https://github.com/official-stockfish/Stockfish' },
      { label: t('credits.stockfishJs.code'), url: 'https://github.com/nmrugg/stockfish.js' },
      { label: t('credits.gplText'), url: 'https://www.gnu.org/licenses/gpl-3.0.html' },
    ],
  },
  {
    name: 'Maia · Lc0',
    what: t('credits.maia.what'),
    license: 'GNU GPL v3',
    links: [
      { label: t('credits.maia.code'), url: 'https://github.com/CSSLab/maia-chess' },
      { label: t('credits.lc0.code'), url: 'https://github.com/LeelaChessZero/lc0' },
      { label: t('credits.gplText'), url: 'https://www.gnu.org/licenses/gpl-3.0.html' },
    ],
  },
  {
    name: t('credits.lichess.name'),
    what: t('credits.lichess.what'),
    license: t('credits.license.cc0'),
    links: [{ label: 'database.lichess.org', url: 'https://database.lichess.org/#puzzles' }],
  },
  {
    name: 'chess.js',
    what: t('credits.chessjs.what'),
    license: 'BSD-2-Clause',
    links: [{ label: 'github.com/jhlywa/chess.js', url: 'https://github.com/jhlywa/chess.js' }],
  },
  {
    name: t('credits.font.name'),
    what: t('credits.font.what'),
    license: 'SIL Open Font License 1.1',
    links: [{ label: 'Google Fonts', url: 'https://fonts.google.com/specimen/Nunito' }],
  },
  { name: t('credits.pieces.name'), what: t('credits.pieces.what'), license: t('credits.license.sameAsApp') },
  { name: t('credits.bots.name'), what: t('credits.bots.what'), license: t('credits.license.sameAsApp') },
  { name: t('credits.icon.name'), what: t('credits.icon.what'), license: t('credits.license.sameAsApp') },
  { name: t('credits.sounds.name'), what: t('credits.sounds.what'), license: t('credits.license.sameAsApp') },
  {
    name: t('credits.expo.name'),
    what: t('credits.expo.what'),
    license: 'MIT',
    links: [{ label: 'expo.dev', url: 'https://expo.dev' }],
  },
];

// Créditos y licencias (mapa-de-pantallas.md, 2.13). Obligatoria para cumplir la GPL de Stockfish y de Maia.
export function CreditsScreen({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: statusBarTop(space.sm) }]}
    >
      <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel={t('common.backToProfile')} hitSlop={12}>
        <Text style={styles.back}>{t('common.backProfile')}</Text>
      </Pressable>
      <Text style={styles.title}>{t('credits.title')}</Text>
      <Text style={styles.subtitle}>{t('credits.subtitle')}</Text>
      <Text style={styles.note}>{t('credits.translationsNote')}</Text>
      {PRIVACY_PAGE_AVAILABLE && <AppLink href="/privacidad" style={styles.privacyLink}>{t('privacy.link')}</AppLink>}
      {PRIVACY_PAGE_AVAILABLE && <AppLink href="/terminos" style={styles.privacyLink}>{t('terms.link')}</AppLink>}

      {credits(t).map((c) => (
        <View key={c.name} style={styles.card}>
          <Text style={styles.name}>{c.name}</Text>
          <Text style={styles.license}>{c.license}</Text>
          <Text style={styles.what}>{c.what}</Text>
          {c.note && <Text style={styles.what}>{c.note}</Text>}
          {c.links?.map((l) => (
            <AppLink key={l.url} href={l.url} style={styles.link}>{l.label}</AppLink>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  back: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted, marginBottom: space.sm },
  title: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.text },
  subtitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted, marginTop: 2, marginBottom: space.lg },
  note: { fontFamily: fonts.bold, fontSize: 13, color: colors.textMuted, marginBottom: space.lg },
  privacyLink: { fontSize: 14, marginBottom: space.sm },
  card: {
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
  name: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.text },
  license: { fontFamily: fonts.bold, fontSize: 12, color: colors.gold, marginTop: 2 },
  what: { fontFamily: fonts.semibold, fontSize: 14, color: colors.textMuted, marginTop: space.xs, lineHeight: 20 },
  link: { fontSize: 13, marginTop: space.xs },
});
