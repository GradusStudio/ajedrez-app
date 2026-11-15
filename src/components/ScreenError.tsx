import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Button3D } from './Button3D';
import { useI18n } from '../i18n/I18nContext';
import { type, colors, fonts, space } from '../theme';

type Props = {
  onRetry: () => void;
  /** Recarga la app entera (solo en la web: es lo que toma la versión nueva publicada). */
  onReload?: () => void;
};

/**
 * Aviso que reemplaza a una pantalla que falló al mostrarse (límite de errores de AppErrorBoundary). En vez del
 * blanco, dice qué pasó y deja reintentar; en la web, además, recargar la app (tarea 33).
 */
export function ScreenError({ onRetry, onReload }: Props) {
  const { t } = useI18n();
  return (
    <View style={styles.wrap}>
      <View style={styles.box}>
        <Text accessibilityRole="header" aria-level={1} style={styles.title}>{t('error.title')}</Text>
        <Text style={styles.text}>{t('error.text')}</Text>
        <Button3D label={t('error.retry')} variant="primary" onPress={onRetry} style={styles.button} />
        {Platform.OS === 'web' && onReload && (
          <Button3D label={t('error.reload')} variant="secondary" onPress={onReload} style={styles.button} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.lg },
  box: { width: '100%', maxWidth: 440, gap: space.md },
  title: { fontFamily: fonts.extrabold, fontSize: type.title, color: colors.text },
  text: { fontFamily: fonts.semibold, fontSize: type.body, lineHeight: 23, color: colors.textMuted },
  button: { alignSelf: 'flex-start', marginTop: space.xs },
});
