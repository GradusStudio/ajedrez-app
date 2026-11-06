import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { BotAvatar } from '../../components/BotAvatar';
import type { BotExpression } from '../../components/botFace';
import type { Bot } from '../../data/bots';
import { Badge, evalLabel } from './quality';
import { styles } from './reviewStyles';

type Props = {
  coach: Bot;
  expression: BotExpression;
  /** Cabecera de una jugada (insignia, título y evaluación). Sin jugada: `startTitle` o nada. */
  head: { badge: Badge | null; title: string; score: number; decimal: string } | null;
  startTitle: string | null;
  /** Frase con la voz del bot; vacía cuando hay hechos que explicar. */
  voice: string;
  /** Hechos de la jugada (qué buscaba, por qué falla, cuál era la mejor y por qué). */
  details: string[];
};

/** Cara del comentarista y su globo, de alto fijo para que el tablero no se mueva. */
export function CoachBubble({ coach, expression, head, startTitle, voice, details }: Props) {
  return (
    <View style={styles.coachRow}>
      <BotAvatar bot={coach} size={64} expression={expression} />
      <View style={styles.bubble}>
        <ScrollView
          key={`${head?.title ?? startTitle ?? ''}|${voice}|${details.join('|')}`}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.bubbleContent}
        >
          {head ? (
            <View style={styles.bubbleHead}>
              {head.badge && (
                <View style={[styles.miniBadge, { backgroundColor: head.badge.color }]}>
                  <Text style={styles.miniBadgeText}>{head.badge.label}</Text>
                </View>
              )}
              <Text style={styles.bubbleTitle} numberOfLines={1} adjustsFontSizeToFit>
                {head.title}
              </Text>
              <View style={[styles.evalChip, head.score < 0 && { backgroundColor: '#1B1A18' }]}>
                <Text style={[styles.evalChipText, head.score < 0 && { color: '#FFFFFF' }]}>{evalLabel(head.score, head.decimal)}</Text>
              </View>
            </View>
          ) : startTitle ? (
            <Text style={styles.bubbleTitle}>{startTitle}</Text>
          ) : null}
          {voice ? <Text style={styles.bubbleText}>{voice}</Text> : null}
          {details.map((line, i) => (
            <Text key={i} style={styles.bubbleExplain}>
              {line}
            </Text>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}
