import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button3D } from '../components/Button3D';
import type { MessageKey } from '../i18n/es';
import { useI18n } from '../i18n/I18nContext';
import { useDriveSync } from '../sync/DriveSyncContext';
import { colors, fonts, space } from '../theme';

// Bloque de Ajustes > Datos para guardar el progreso en el Drive de la persona. Solo aparece en la web.
export function SyncSection() {
  const { t } = useI18n();
  const sync = useDriveSync();
  if (!sync.supported) return null;

  const problem = sync.status === 'needsAuth' || sync.status === 'quota' || sync.status === 'blocked' || sync.status === 'corrupt' || sync.status === 'tooNew' || sync.status === 'error';

  return (
    <View style={styles.box}>
      <Text accessibilityRole="header" aria-level={3} style={styles.title}>{t('sync.section')}</Text>
      <Text style={styles.text}>{t('sync.description')}</Text>
      {!sync.enabled ? (
        <Button3D label={t('sync.enable')} style={styles.button} onPress={() => void sync.enable()} />
      ) : (
        <>
          {/* aria-live: el lector de pantalla avisa cuando cambia el estado sin que la persona lo busque. */}
          <Text accessibilityRole="text" aria-live="polite" style={[styles.status, problem && styles.statusProblem]}>
            {t(`sync.status.${sync.status}` as MessageKey)}
          </Text>
          {sync.status === 'needsAuth' && (
            <Button3D label={t('sync.reconnect')} style={styles.button} onPress={() => void sync.reconnect()} />
          )}
          <Button3D label={t('sync.disable')} variant="secondary" style={styles.button} onPress={() => void sync.disable()} />
          <Text style={styles.note}>{t('sync.disable.note')}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { marginBottom: space.lg },
  title: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.text },
  text: { fontFamily: fonts.semibold, fontSize: 14, color: colors.textMuted, marginTop: space.xs, lineHeight: 21 },
  status: { fontFamily: fonts.bold, fontSize: 14, color: colors.primary, marginTop: space.md },
  statusProblem: { color: colors.gold },
  note: { fontFamily: fonts.semibold, fontSize: 13, color: colors.textMuted, marginTop: space.sm, lineHeight: 19 },
  button: { marginTop: space.md },
});
