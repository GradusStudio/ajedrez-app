import React, { useState } from 'react';
import { Pressable, ScrollView, StatusBar as RNStatusBar, StyleSheet, Text, View } from 'react-native';
import { BotAvatar } from '../components/BotAvatar';
import { Button3D } from '../components/Button3D';
import { Chip } from '../components/Chip';
import { Bot } from '../data/bots';
import { findOpening } from '../data/openings';
import { colors, fonts, radius, space } from '../theme';

export type ColorChoice = 'w' | 'b' | 'random';

type Props = {
  bot: Bot;
  onPlay: (userColor: 'w' | 'b') => void;
  onBack: () => void;
};

const CHOICES: { value: ColorChoice; label: string }[] = [
  { value: 'w', label: 'Blancas' },
  { value: 'b', label: 'Negras' },
  { value: 'random', label: 'Al azar' },
];

const openingNames = (ids: string[]) =>
  ids.length === 0 ? 'Sin libro: juega por principios' : ids.map((id) => findOpening(id)?.name ?? id).join(', ');

// Ficha del bot: personalidad, aperturas y elección de color (mapa-de-pantallas.md, 2.9).
export function BotDetailScreen({ bot, onPlay, onBack }: Props) {
  const [choice, setChoice] = useState<ColorChoice>('w');

  const play = () => onPlay(choice === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : choice);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: (RNStatusBar.currentHeight ?? 40) + space.sm }]}
    >
      <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Volver a Bots" hitSlop={12}>
        <Text style={styles.back}>‹ Bots</Text>
      </Pressable>

      <View style={styles.header}>
        <BotAvatar bot={bot} size={72} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{bot.name}</Text>
          <Text style={styles.tagline}>{bot.tagline}</Text>
          <View style={styles.chips}>
            <Chip label={`Nivel ${bot.elo}`} />
            <Chip label={bot.style} />
          </View>
        </View>
      </View>

      <View style={styles.bubble}>
        <Text style={styles.bubbleText}>«{bot.lines.greeting}»</Text>
      </View>

      <Text style={styles.body}>{bot.trait}</Text>
      <Text style={styles.label}>Te enseña</Text>
      <Text style={styles.body}>{bot.teaches}</Text>
      <Text style={styles.label}>Con blancas juega</Text>
      <Text style={styles.body}>{openingNames(bot.repertoire.white)}</Text>
      <Text style={styles.label}>Con negras juega</Text>
      <Text style={styles.body}>{openingNames(bot.repertoire.black)}</Text>

      <Text style={styles.label}>Tú juegas con</Text>
      <View style={styles.segmented}>
        {CHOICES.map((c) => {
          const selected = c.value === choice;
          return (
            <Pressable
              key={c.value}
              onPress={() => setChoice(c.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={c.label}
              style={[styles.segment, selected && styles.segmentSelected]}
            >
              <Text style={[styles.segmentText, selected && { color: colors.text }]}>{c.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Button3D label="Jugar" variant="primary" onPress={play} style={{ marginTop: space.lg }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  back: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted, marginBottom: space.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  title: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.text },
  tagline: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginTop: space.sm },
  bubble: {
    marginTop: space.lg,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.control,
    paddingVertical: space.md,
    paddingHorizontal: 14,
  },
  bubbleText: { fontFamily: fonts.bold, fontSize: 15, color: colors.text, lineHeight: 21 },
  label: {
    fontFamily: fonts.extrabold,
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: space.lg,
  },
  body: { fontFamily: fonts.bold, fontSize: 14, color: colors.text, marginTop: space.xs, lineHeight: 20 },
  segmented: { flexDirection: 'row', gap: space.sm, marginTop: space.sm },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    backgroundColor: colors.surface,
  },
  segmentSelected: { borderColor: colors.primary, backgroundColor: colors.surfaceRaised },
  segmentText: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.textMuted },
});
