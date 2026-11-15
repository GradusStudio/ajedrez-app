import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useI18n } from '../../i18n/I18nContext';
import { colors } from '../../theme';
import { Icon, IconName } from './ReviewParts';

type Props = {
  onStart: () => void;
  onPrev: () => void;
  onNext: () => void;
  onEnd: () => void;
  /** Dentro de una variante, «siguiente» no hace nada: se deshabilita. */
  inBranch?: boolean;
};

const BUTTONS: { icon: IconName; key: 'ctrlStart' | 'ctrlPrev' | 'ctrlNext' | 'ctrlEnd' }[] = [
  { icon: 'first', key: 'ctrlStart' },
  { icon: 'back', key: 'ctrlPrev' },
  { icon: 'next', key: 'ctrlNext' },
  { icon: 'last', key: 'ctrlEnd' },
];

/** Los cuatro botones de navegación de la revisión (48 × 44, relieve de 4 px), debajo del tablero. */
export function NavButtons({ onStart, onPrev, onNext, onEnd, inBranch }: Props) {
  const { t } = useI18n();
  const handlers = { ctrlStart: onStart, ctrlPrev: onPrev, ctrlNext: onNext, ctrlEnd: onEnd };
  return (
    <View style={styles.row}>
      {BUTTONS.map(({ icon, key }) => {
        const disabled = key === 'ctrlNext' && !!inBranch;
        return (
          <Pressable
            key={key}
            onPress={handlers[key]}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={t(`review.${key}`)}
            accessibilityState={{ disabled }}
            style={({ pressed }) => [styles.btn, disabled && styles.disabled, pressed && { opacity: 0.6 }]}
          >
            <Icon name={icon} color={colors.text} size={20} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 8 },
  btn: {
    width: 48,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    borderBottomWidth: 4,
    borderBottomColor: colors.surfaceShadow,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  disabled: { opacity: 0.35 },
});
