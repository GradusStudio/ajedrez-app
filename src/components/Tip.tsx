import React, { useEffect, useId, useRef, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Mask, Rect } from 'react-native-svg';
import { useContent } from '../data/useContent';
import { useI18n } from '../i18n/I18nContext';
import { type, colors, fonts } from '../theme';
import { BotAvatar } from './BotAvatar';
import { useWideLayout } from './useWideLayout';

type TargetRect = { x: number; y: number; width: number; height: number };

type Props = {
  visible: boolean;
  title: string;
  text: string;
  /** Consejo actual dentro de una serie (1-based), para el «1 de 2». */
  step?: number;
  total?: number;
  /** Elemento que se ilumina con el borde dorado. */
  target?: React.RefObject<React.ComponentRef<typeof View> | null>;
  /** «Entendido»: pasa al siguiente consejo. */
  onNext: () => void;
  /** Escape o tocar fuera: cierra la serie. */
  onClose: () => void;
};

const PAD = 8;

/**
 * Consejo de Pipo (feedback del primer tester, 14-11-2026): globo blanco con su cara, el resto de la
 * pantalla oscurecido y el elemento explicado iluminado con un borde dorado.
 */
export function Tip({ visible, title, text, step, total, target, onNext, onClose }: Props) {
  const { t } = useI18n();
  const wide = useWideLayout();
  const { bots } = useContent();
  const pipo = bots.find((b) => b.id === 'pipo') ?? bots[0];
  const [rect, setRect] = useState<TargetRect | null>(null);
  const okRef = useRef<React.ComponentRef<typeof View>>(null);
  const maskId = `tip${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  // Medir el objetivo con el modal ya abierto. En la web el modal es un portal y las coordenadas son las de la ventana.
  useEffect(() => {
    if (!visible || !target?.current) return;
    const raf = requestAnimationFrame(() => {
      target.current?.measureInWindow((x, y, width, height) => setRect({ x, y, width, height }));
    });
    return () => cancelAnimationFrame(raf);
  }, [visible, target]);

  // Escape cierra en la web (en Android lo hace onRequestClose).
  useEffect(() => {
    if (!visible || Platform.OS !== 'web') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, onClose]);

  // El foco va al botón «Entendido» (lectores de pantalla y teclado).
  useEffect(() => {
    if (!visible || Platform.OS !== 'web') return;
    const node = okRef.current as unknown as { focus?: () => void } | null;
    node?.focus?.();
  }, [visible]);

  const hole = rect
    ? { x: rect.x - PAD, y: rect.y - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }
    : null;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t('tips.close')} />
        {hole ? (
          <Svg pointerEvents="none" width="100%" height="100%" style={StyleSheet.absoluteFill}>
            <Defs>
              <Mask id={maskId}>
                <Rect x={0} y={0} width="100%" height="100%" fill="#FFFFFF" />
                <Rect x={hole.x} y={hole.y} width={hole.width} height={hole.height} rx={16} fill="#000000" />
              </Mask>
            </Defs>
            <Rect x={0} y={0} width="100%" height="100%" fill="rgba(0,0,0,0.55)" mask={`url(#${maskId})`} />
            <Rect
              x={hole.x}
              y={hole.y}
              width={hole.width}
              height={hole.height}
              rx={16}
              fill="none"
              stroke={colors.gold}
              strokeWidth={4}
            />
          </Svg>
        ) : (
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.shade]} />
        )}

        <View
          style={[styles.tip, wide ? styles.tipWide : styles.tipNarrow]}
          onStartShouldSetResponder={() => true}
          accessibilityViewIsModal
          accessibilityRole="alert"
        >
          {pipo && (
            <View style={styles.face}>
              <BotAvatar bot={pipo} size={64} expression="explica" />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.text}>{text}</Text>
            <View style={styles.actions}>
              <Pressable
                ref={okRef}
                accessibilityRole="button"
                accessibilityLabel={t('tips.ok')}
                onPress={onNext}
                style={({ pressed }) => [styles.ok, pressed && styles.okPressed]}
              >
                <Text style={styles.okText}>{t('tips.ok')}</Text>
              </Pressable>
              {total && total > 1 && step ? <Text style={styles.step}>{t('tips.step', { n: step, total })}</Text> : null}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  shade: { backgroundColor: 'rgba(0,0,0,0.55)' },
  tip: {
    position: 'absolute',
    flexDirection: 'row',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  tipWide: { width: 400, right: 32, bottom: 32 },
  tipNarrow: { left: 16, right: 16, bottom: 24 },
  face: { width: 64, height: 64 },
  title: { fontFamily: fonts.extrabold, fontSize: 17, color: colors.bg },
  text: { fontFamily: fonts.bold, fontSize: 16, color: '#3A3733', lineHeight: 22, marginTop: 4 },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  ok: {
    backgroundColor: colors.primary,
    borderBottomWidth: 3,
    borderBottomColor: colors.primaryShadow,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  okPressed: { transform: [{ translateY: 2 }], borderBottomWidth: 1 },
  okText: { fontFamily: fonts.extrabold, fontSize: type.body, color: colors.bg, textTransform: 'uppercase', letterSpacing: 0.5 },
  step: { fontFamily: fonts.bold, fontSize: 13, color: '#8A8580' },
});
