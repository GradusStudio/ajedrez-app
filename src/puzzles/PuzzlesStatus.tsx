import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button3D } from '../components/Button3D';
import { useI18n } from '../i18n/I18nContext';
import { colors, fonts, space } from '../theme';
import { PuzzlesState } from './usePuzzles';

/** Pantalla de espera o de error mientras los puzzles se descargan; con error, un botón para reintentar. */
export function PuzzlesStatus({ state }: { state: Exclude<PuzzlesState, { status: 'ready' }> }) {
  const { t } = useI18n();
  return (
    <View style={styles.box}>
      <Text accessibilityRole="alert" style={styles.text}>
        {state.status === 'error' ? t('puzzles.loadError') : t('puzzles.loading')}
      </Text>
      {state.status === 'error' && <Button3D label={t('common.retry')} variant="primary" onPress={state.retry} style={{ marginTop: space.md }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.lg, backgroundColor: colors.bg },
  text: { fontFamily: fonts.bold, fontSize: 16, color: colors.textMuted, textAlign: 'center' },
});
