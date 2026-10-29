import React from 'react';
import { Linking, Pressable, ScrollView, StatusBar as RNStatusBar, StyleSheet, Text, View } from 'react-native';
import { STOCKFISH_VERSION } from '../engine/stockfish/stockfishAssets';
import { colors, fonts, radius, space } from '../theme';

type Credit = { name: string; what: string; license: string; links?: { label: string; url: string }[] };

// Licencias revisadas en el package.json de cada paquete (ver docs/motor.md y docs/puzzles.md).
const CREDITS: Credit[] = [
  {
    name: 'Esta app',
    what: 'Es software libre: puedes usarla, estudiar su código, modificarla y compartirla según la GPL v3 o posterior. Se ofrece sin ninguna garantía.',
    license: 'GNU GPL v3 o posterior',
    links: [
      { label: 'Código de la app', url: 'https://github.com/GradusStudio/ajedrez-app' },
      { label: 'Texto de la licencia GPL v3', url: 'https://www.gnu.org/licenses/gpl-3.0.html' },
    ],
  },
  {
    name: `Stockfish 19 · Stockfish.js ${STOCKFISH_VERSION.split(' ')[0]}`,
    what: 'Motor de ajedrez de los bots. Se incluye sin modificar y la app le habla solo por el protocolo UCI.',
    license: 'GNU GPL v3',
    links: [
      { label: 'Código de Stockfish', url: 'https://github.com/official-stockfish/Stockfish' },
      { label: 'Código de Stockfish.js', url: 'https://github.com/nmrugg/stockfish.js' },
      { label: 'Texto de la licencia GPL v3', url: 'https://www.gnu.org/licenses/gpl-3.0.html' },
    ],
  },
  {
    name: 'Puzzles de Lichess',
    what: '10.000 puzzles de la base abierta de lichess.org.',
    license: 'CC0 (dominio público)',
    links: [{ label: 'database.lichess.org', url: 'https://database.lichess.org/#puzzles' }],
  },
  {
    name: 'chess.js',
    what: 'Reglas del ajedrez: jugadas legales, jaque, mate y tablas.',
    license: 'BSD-2-Clause',
    links: [{ label: 'github.com/jhlywa/chess.js', url: 'https://github.com/jhlywa/chess.js' }],
  },
  {
    name: 'Fuente Nunito',
    what: 'La tipografía de toda la app.',
    license: 'SIL Open Font License 1.1',
    links: [{ label: 'Google Fonts', url: 'https://fonts.google.com/specimen/Nunito' }],
  },
  {
    name: 'Piezas',
    what: 'Los 5 sets de piezas se generaron a partir de imágenes creadas con ChatGPT (OpenAI) y se pasaron a dibujos vectoriales.',
    license: 'GNU GPL v3 o posterior, como la app',
  },
  {
    name: 'Sonidos',
    what: 'Generados por la propia app (síntesis de sonido).',
    license: 'GNU GPL v3 o posterior, como la app',
  },
  {
    name: 'Expo, React Native y React',
    what: 'La base de la app, más Expo Router, react-native-svg, react-native-webview, AsyncStorage, expo-audio, expo-haptics y expo-notifications.',
    license: 'MIT',
    links: [{ label: 'expo.dev', url: 'https://expo.dev' }],
  },
];

// Créditos y licencias (mapa-de-pantallas.md, 2.13). Obligatoria para cumplir la GPL de Stockfish.
export function CreditsScreen({ onBack }: { onBack: () => void }) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: (RNStatusBar.currentHeight ?? 40) + space.sm }]}
    >
      <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Volver a Perfil" hitSlop={12}>
        <Text style={styles.back}>‹ Perfil</Text>
      </Pressable>
      <Text style={styles.title}>Créditos y licencias</Text>
      <Text style={styles.subtitle}>Esta app usa trabajo de otras personas y proyectos. Gracias.</Text>

      {CREDITS.map((c) => (
        <View key={c.name} style={styles.card}>
          <Text style={styles.name}>{c.name}</Text>
          <Text style={styles.license}>{c.license}</Text>
          <Text style={styles.what}>{c.what}</Text>
          {c.links?.map((l) => (
            <Pressable key={l.url} onPress={() => Linking.openURL(l.url)} accessibilityRole="link" hitSlop={6}>
              <Text style={styles.link}>{l.label}</Text>
            </Pressable>
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
  link: { fontFamily: fonts.bold, fontSize: 13, color: colors.primary, marginTop: space.xs, textDecorationLine: 'underline' },
});
