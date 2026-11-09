import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button3D } from './Button3D';
import { FadeIn } from './FadeIn';
import { colors, fonts, space } from '../theme';

type Props = {
  kind: 'neutral' | 'correct' | 'wrong';
  title?: string;
  message?: string;
  /** Si se indica, se muestra el botón con este texto (verde, o rojo en el panel de error). */
  buttonLabel?: string;
  onButton?: () => void;
  /** Pantalla ancha: ancho del tablero con su panel (useBoardLayoutWidth), para alinear el contenido con ellos. */
  contentWidth?: number | null;
};

// Panel inferior de la lección: verde al acertar, rojo al fallar (design.md).
// Los paneles de acierto y error suben desde abajo al aparecer.
export function FeedbackPanel({ kind, title, message, buttonLabel, onButton, contentWidth }: Props) {
  const bg = kind === 'correct' ? colors.correctBg : kind === 'wrong' ? colors.incorrectBg : colors.surface;
  const titleColor = kind === 'correct' ? colors.primary : kind === 'wrong' ? colors.danger : colors.text;
  const panel = (
    <View style={[styles.panel, { backgroundColor: bg }]}>
      {/* Pantalla ancha: una barra de lado a lado, con el texto alineado al tablero y el botón a la derecha. */}
      <View style={contentWidth ? [styles.wideRow, { width: contentWidth }] : undefined}>
        <View style={contentWidth ? { flex: 1 } : undefined}>
          {!!title && <Text style={[styles.title, { color: titleColor }]}>{title}</Text>}
          {!!message && <Text style={styles.message}>{message}</Text>}
        </View>
        {!!buttonLabel && onButton && (
          <Button3D
            label={buttonLabel}
            variant={kind === 'wrong' ? 'danger' : 'primary'}
            onPress={onButton}
            style={contentWidth ? styles.wideButton : { marginTop: space.md }}
          />
        )}
      </View>
    </View>
  );
  if (kind === 'neutral') return panel;
  return (
    <FadeIn from={40} duration={220}>
      {panel}
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  panel: { paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.xl },
  title: { fontFamily: fonts.extrabold, fontSize: 18 },
  wideRow: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: space.xl },
  wideButton: { minWidth: 240 },
  message: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text, marginTop: 4, lineHeight: 21 },
});
