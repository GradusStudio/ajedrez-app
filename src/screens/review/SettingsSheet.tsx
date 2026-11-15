import React, { useEffect, useRef } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BotAvatar } from '../../components/BotAvatar';
import { Button3D } from '../../components/Button3D';
import { Segmented } from '../../components/Segmented';
import { useContent } from '../../data/useContent';
import { useI18n } from '../../i18n/I18nContext';
import { colors, space } from '../../theme';
import { Icon } from './ReviewParts';
import { styles } from './reviewStyles';

type Props = {
  visible: boolean;
  /** 'coach': solo el selector (enlace «cambiar» del resumen). 'settings': bando, comentarista, reproducir y gráfico. */
  mode: 'coach' | 'settings';
  onClose: () => void;
  me: 'w' | 'b';
  onMe: (c: 'w' | 'b') => void;
  coachId: string;
  onCoach: (id: string) => void;
  graph: React.ReactNode;
  onChooseOther: () => void;
  /** Para que el botón diga «Pausar» mientras la partida se reproduce sola. */
  playing?: boolean;
  onPlay?: () => void;
};

/** Hoja de la revisión: en modo «coach» solo el comentarista; en «settings», además bando, reproducción y gráfico. */
export function SettingsSheet(p: Props) {
  const { t } = useI18n();
  // Los nombres de los bots cambian con el idioma (tarea 35); los ids no.
  const { bots } = useContent();
  const sheetRef = useRef<React.ComponentRef<typeof View>>(null);

  // En la web, el foco no sale de la hoja abierta y entra en el primer control al abrirla.
  useEffect(() => {
    if (!p.visible || Platform.OS !== 'web') return;
    const root = () => sheetRef.current as unknown as HTMLElement | null;
    const focusables = () => {
      const node = root();
      if (!node || typeof node.querySelectorAll !== 'function') return [];
      return Array.from(
        node.querySelectorAll<HTMLElement>('button, [role="button"], [role="radio"], [role="tab"], [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      ).filter((el) => !el.hasAttribute('disabled') && el.getClientRects().length > 0);
    };
    const timer = setTimeout(() => focusables()[0]?.focus(), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const inside = !!root()?.contains(active);
      const index = items.indexOf(active as HTMLElement);
      if (e.shiftKey) {
        if ((inside && index <= 0) || !inside) {
          e.preventDefault();
          last.focus();
        }
      } else if (index === items.length - 1 || !inside) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, [p.visible]);

  return (
    <Modal visible={p.visible} transparent animationType="slide" onRequestClose={p.onClose}>
      <View style={styles.modalRoot}>
        <Pressable style={StyleSheet.absoluteFill} onPress={p.onClose} accessibilityRole="button" accessibilityLabel={t('review.close')} />
        <View ref={sheetRef} style={styles.sheet}>
          <View style={styles.sheetHead}>
            <Text style={styles.sheetTitle}>{t(p.mode === 'coach' ? 'review.coach' : 'review.settings')}</Text>
            <Pressable onPress={p.onClose} accessibilityRole="button" accessibilityLabel={t('review.close')} hitSlop={12}>
              <Icon name="close" color={colors.textMuted} />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {p.mode === 'settings' && (
              <>
                <Text style={styles.sectionTitle}>{t('review.playingAs')}</Text>
                <Segmented
                  value={p.me}
                  onChange={p.onMe}
                  options={[
                    { value: 'w', label: t('common.white') },
                    { value: 'b', label: t('common.black') },
                  ]}
                />
              </>
            )}

            <Text style={[styles.sectionTitle, { marginTop: p.mode === 'settings' ? space.lg : 0 }]}>{t('review.coach')}</Text>
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

            {p.mode === 'settings' && (
              <>
                {p.onPlay && (
                  <Button3D
                    label={t(p.playing ? 'review.ctrlPause' : 'review.ctrlPlay')}
                    onPress={p.onPlay}
                    style={{ marginTop: space.lg }}
                  />
                )}
                <View style={{ height: space.lg }} />
                {p.graph}
                <View style={{ height: space.xl }} />
                <Button3D label={t('review.chooseOther')} onPress={p.onChooseOther} />
                <View style={{ height: space.md }} />
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
