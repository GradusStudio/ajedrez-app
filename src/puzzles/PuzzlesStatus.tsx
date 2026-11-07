import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button3D } from '../components/Button3D';
import { useI18n } from '../i18n/I18nContext';
import { applyUpdate } from '../pwa/register';
import { colors, fonts, space } from '../theme';
import { PuzzlesState } from './usePuzzles';

/**
 * Pantalla de espera o de error mientras los puzzles se descargan; con error, un botón para reintentar.
 * En la web, si hay una versión nueva esperando, «Reintentar» la aplica y recarga: un trozo de los puzzles que
 * falta suele ser de una versión vieja que ya no está publicada.
 */
export function PuzzlesStatus({ state }: { state: Exclude<PuzzlesState, { status: 'ready' }> }) {
  const { t } = useI18n();
  const retry = () => {
    if (state.status === 'error' && !applyUpdate(true)) state.retry();
  };
  return (
    <View style={styles.box}>
      <Text accessibilityRole="alert" style={styles.text}>
        {state.status === 'error' ? t('puzzles.loadError') : t('puzzles.loading')}
      </Text>
      {state.status === 'error' && <Button3D label={t('common.retry')} variant="primary" onPress={retry} style={{ marginTop: space.md }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.lg, backgroundColor: colors.bg },
  text: { fontFamily: fonts.bold, fontSize: 16, color: colors.textMuted, textAlign: 'center' },
});
