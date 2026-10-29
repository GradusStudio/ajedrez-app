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
};

// Panel inferior de la lección: verde al acertar, rojo al fallar (design.md).
// Los paneles de acierto y error suben desde abajo al aparecer.
export function FeedbackPanel({ kind, title, message, buttonLabel, onButton }: Props) {
  const bg = kind === 'correct' ? colors.correctBg : kind === 'wrong' ? colors.incorrectBg : colors.surface;
  const titleColor = kind === 'correct' ? colors.primary : kind === 'wrong' ? colors.danger : colors.text;
  const panel = (
    <View style={[styles.panel, { backgroundColor: bg }]}>
      {!!title && <Text style={[styles.title, { color: titleColor }]}>{title}</Text>}
      {!!message && <Text style={styles.message}>{message}</Text>}
      {!!buttonLabel && onButton && (
        <Button3D
          label={buttonLabel}
          variant={kind === 'wrong' ? 'danger' : 'primary'}
          onPress={onButton}
          style={{ marginTop: space.md }}
        />
      )}
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
  message: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text, marginTop: 4, lineHeight: 21 },
});
