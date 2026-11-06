import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BotAvatar } from '../../components/BotAvatar';
import { Button3D } from '../../components/Button3D';
import { Segmented } from '../../components/Segmented';
import { bots } from '../../data/bots';
import { useI18n } from '../../i18n/I18nContext';
import { colors, space } from '../../theme';
import { Icon } from './ReviewParts';
import { styles } from './reviewStyles';
import type { Filter } from './useReviewPlayback';

type Props = {
  visible: boolean;
  onClose: () => void;
  me: 'w' | 'b';
  onMe: (c: 'w' | 'b') => void;
  coachId: string;
  onCoach: (id: string) => void;
  /** Solo cambia a dónde salta «Siguiente»; todo lo demás sigue libre. */
  filter: Filter;
  onFilter: (f: Filter) => void;
  highlights: number[];
  idx: number;
  onJump: (dir: 1 | -1) => void;
  graph: React.ReactNode;
  onChooseOther: () => void;
};

/** Hoja de ajustes de la revisión: bando, comentarista, salto entre destacadas y gráfico. */
export function SettingsSheet(p: Props) {
  const { t } = useI18n();
  const hlPos = p.highlights.findIndex((h) => h + 1 === p.idx);
  const total = p.highlights.length;
  const hlText =
    total === 0
      ? t('review.noHighlights')
      : hlPos >= 0
        ? t('review.highlightPos', { n: hlPos + 1, total })
        : t('common.xOfY', { n: p.highlights.filter((h) => h + 1 < p.idx).length, total });

  return (
    <Modal visible={p.visible} transparent animationType="slide" onRequestClose={p.onClose}>
      <View style={styles.modalRoot}>
        <Pressable style={StyleSheet.absoluteFill} onPress={p.onClose} accessibilityRole="button" accessibilityLabel={t('review.close')} />
        <View style={styles.sheet}>
          <View style={styles.sheetHead}>
            <Text style={styles.sheetTitle}>{t('review.settings')}</Text>
            <Pressable onPress={p.onClose} accessibilityRole="button" accessibilityLabel={t('review.close')} hitSlop={12}>
              <Icon name="close" color={colors.textMuted} />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>{t('review.playingAs')}</Text>
            <Segmented
              value={p.me}
              onChange={p.onMe}
              options={[
                { value: 'w', label: t('common.white') },
                { value: 'b', label: t('common.black') },
              ]}
            />

            <Text style={[styles.sectionTitle, { marginTop: space.lg }]}>{t('review.coach')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm, paddingVertical: 4 }}>
              {bots.map((b) => (
                <Pressable
                  key={b.id}
                  onPress={() => p.onCoach(b.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: b.id === p.coachId }}
                  accessibilityLabel={b.name}
                  style={[styles.coachPick, b.id === p.coachId && styles.coachPickOn]}
                >
                  <BotAvatar bot={b} size={44} />
                  <Text style={styles.coachName} numberOfLines={1}>
                    {b.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={[styles.sectionTitle, { marginTop: space.lg }]}>{t('review.jumpTo')}</Text>
            <Segmented
              value={p.filter}
              onChange={p.onFilter}
              options={[
                { value: 'highlights', label: t('review.filterHighlights') },
                { value: 'all', label: t('review.filterAll') },
              ]}
            />
            {p.filter === 'highlights' && (
              <View style={styles.hlRow}>
                <Pressable onPress={() => p.onJump(-1)} accessibilityRole="button" accessibilityLabel={t('review.prevHighlight')} hitSlop={10}>
                  <Text style={styles.hlArrow}>‹</Text>
                </Pressable>
                <Text style={styles.hlText}>{hlText}</Text>
                <Pressable onPress={() => p.onJump(1)} accessibilityRole="button" accessibilityLabel={t('review.nextHighlight')} hitSlop={10}>
                  <Text style={styles.hlArrow}>›</Text>
                </Pressable>
              </View>
            )}

            <View style={{ height: space.lg }} />
            {p.graph}

            <View style={{ height: space.xl }} />
            <Button3D label={t('review.chooseOther')} onPress={p.onChooseOther} />
            <View style={{ height: space.md }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
