import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { BotAvatar, botBodySource } from '../../components/BotAvatar';
import type { BotExpression } from '../../components/botFace';
import type { Bot } from '../../data/bots';
import { formatScore } from '../../engine/evalFormat';
import { useI18n } from '../../i18n/I18nContext';
import { useWideLayout } from '../../components/useWideLayout';
import { colors, fonts, space, type } from '../../theme';
import { Badge } from './quality';

type Head = {
  badge: Badge | null;
  /** La jugada en la notación del usuario («Axb5+»). */
  move: string;
  /** «Excelente», «Error grave»… */
  quality: string;
  color: string;
  score: number;
  decimal: string;
};

type Props = {
  coach: Bot;
  expression: BotExpression;
  head: Head | null;
  startTitle: string | null;
  /** Frase con la voz del bot; vacía cuando hay hechos que explicar. */
  voice: string;
  /** Hechos de la jugada (qué buscaba, por qué falla, cuál era la mejor y por qué). */
  details: string[];
  /** La línea del motor con la mejor jugada, ya con su texto. */
  line: string;
};

/**
 * Comentarista de cuerpo entero (spec 2026-11-15, sección 3): el bot a la izquierda y el globo blanco de la lección a
 * la derecha. Arriba del texto, el símbolo, la jugada y la calidad en su color. Los hechos largos se despliegan con
 * «Explicar». Si el bot no tiene cuerpo, se usa su cara.
 */
export function CoachBubble({ coach, expression, head, startTitle, voice, details, line }: Props) {
  const { t } = useI18n();
  const wide = useWideLayout();
  const [expanded, setExpanded] = useState(false);
  const body = botBodySource(coach.id);
  const visible = expanded ? details : details.slice(0, 1);

  return (
    <View style={styles.row}>
      <View style={[styles.coachCol, !wide && styles.coachColNarrow]}>
        {body ? (
          <Image source={body} style={[styles.body, !wide && styles.bodyNarrow]} resizeMode="contain" fadeDuration={0} accessible accessibilityLabel={coach.name} />
        ) : (
          <BotAvatar bot={coach} size={wide ? 64 : 48} expression={expression} />
        )}
      </View>
      <View style={styles.bubbleWrap}>
        <View style={styles.tail} />
        <View style={styles.bubble} accessibilityLiveRegion="polite">
          {head ? (
            <View style={styles.head}>
              {head.badge && (
                <View style={[styles.badge, { backgroundColor: head.badge.color }]}>
                  <Text style={styles.badgeText}>{head.badge.label}</Text>
                </View>
              )}
              <Text style={styles.move} numberOfLines={1}>
                {head.move}
              </Text>
              <Text style={[styles.quality, { color: head.color }]} numberOfLines={1}>
                {head.quality}
              </Text>
              <Text style={styles.score}>{formatScore(head.score, head.decimal)}</Text>
            </View>
          ) : startTitle ? (
            <Text style={styles.startTitle}>{startTitle}</Text>
          ) : null}
          {voice ? <Text style={styles.voice}>{voice}</Text> : null}
          {visible.map((lineText, i) => (
            <Text key={i} style={styles.detail}>
              {lineText}
            </Text>
          ))}
          {details.length > 1 && (
            <Pressable onPress={() => setExpanded((v) => !v)} accessibilityRole="button" hitSlop={6} style={styles.explainBtn}>
              <Text style={styles.explain}>{expanded ? t('review.hide') : t('review.explain')}</Text>
            </Pressable>
          )}
          {line ? <Text style={styles.line}>{line}</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  coachCol: { width: 92, alignItems: 'center' },
  coachColNarrow: { width: 64 },
  body: { width: 92, height: 122 },
  bodyNarrow: { width: 64, height: 85 },
  bubbleWrap: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'flex-start' },
  tail: {
    width: 14,
    height: 14,
    marginTop: 24,
    marginRight: -7,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
    zIndex: 1,
  },
  bubble: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderBottomWidth: 4,
    borderBottomColor: '#C9C6BF',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontFamily: fonts.extrabold, fontSize: 11, color: '#FFFFFF' },
  move: { fontFamily: fonts.extrabold, fontSize: type.body, color: colors.bg },
  quality: { fontFamily: fonts.bold, fontSize: type.secondary, flexShrink: 1 },
  score: { marginLeft: 'auto', fontFamily: fonts.extrabold, fontSize: type.secondary, color: '#6B6660' },
  startTitle: { fontFamily: fonts.extrabold, fontSize: type.body, color: colors.bg },
  voice: { fontFamily: fonts.bold, fontSize: type.body, color: colors.bg, marginTop: 4, lineHeight: 21 },
  detail: { fontFamily: fonts.semibold, fontSize: type.secondary, color: '#403D39', marginTop: 4, lineHeight: 19 },
  explainBtn: { alignSelf: 'flex-start', marginTop: 6 },
  explain: { fontFamily: fonts.extrabold, fontSize: type.secondary, color: colors.primary },
  line: { fontFamily: fonts.semibold, fontSize: type.secondary, color: '#6B6660', marginTop: 6, lineHeight: 18 },
});
