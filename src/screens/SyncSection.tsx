import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button3D } from '../components/Button3D';
import { showDialog } from '../components/dialog';
import type { MessageKey } from '../i18n/es';
import { useI18n } from '../i18n/I18nContext';
import { DriveKeyLeftError } from '../sync/driveSyncTypes';
import { isPopupError } from '../sync/popupError';
import { useDriveSync } from '../sync/DriveSyncContext';
import { colors, fonts, space } from '../theme';

// Bloque de Ajustes > Datos para sincronizar el progreso entre dispositivos con una llave guardada en el Drive de la persona.
// Solo aparece en la web.
export function SyncSection() {
  const { t } = useI18n();
  const sync = useDriveSync();
  // La ventana de Google no se abrió o se cerró (no se distingue un bloqueo de un cierre): se avisa en lugar de no hacer nada.
  const [popupFailed, setPopupFailed] = useState(false);
  const { supported, prepare } = sync;
  // Al mostrar la sección se baja el script de Google (también con la sincronización activa, para «Borrar mis datos»):
  // si se descargara dentro del toque, Safari bloquearía la ventana. Quien nunca abre Ajustes no carga nada de Google.
  useEffect(() => {
    if (supported) prepare();
  }, [supported, prepare]);
  if (!sync.supported) return null;

  const problem = sync.status === 'revoked' || sync.status === 'corrupt' || sync.status === 'tooNew' || sync.status === 'error';
  // Sin activar solo se muestra un aviso que quedó pendiente: datos borrados desde otro dispositivo o una activación que falló.
  const showStatus = sync.enabled || sync.status === 'revoked' || sync.status === 'error';

  const confirmDelete = () => {
    showDialog(t('sync.delete.title'), t('sync.delete.message'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('sync.delete.confirm'),
        style: 'destructive',
        onPress: () => {
          // Sin await antes de `deleteServerData`: la ventana de Google tiene que abrirse dentro del toque.
          setPopupFailed(false);
          sync.deleteServerData().catch((e) => {
            if (isPopupError(e)) setPopupFailed(true);
            else showDialog(t('sync.section'), t(e instanceof DriveKeyLeftError ? 'sync.delete.partial' : 'sync.delete.failed'));
          });
        },
      },
    ]);
  };

  return (
    <View style={styles.box}>
      <Text accessibilityRole="header" aria-level={3} style={styles.title}>{t('sync.section')}</Text>
      <Text style={styles.text}>{t('sync.description')}</Text>
      {showStatus && (
        // aria-live: el lector de pantalla avisa cuando cambia el estado sin que la persona lo busque.
        <Text accessibilityRole="text" aria-live="polite" style={[styles.status, problem && styles.statusProblem]}>
          {/* Sin activar, un 'error' es una activación fallida: no hay nada que se reintente solo. */}
          {t(!sync.enabled && sync.status === 'error' ? 'sync.enable.failed' : (`sync.status.${sync.status}` as MessageKey))}
        </Text>
      )}
      {popupFailed && (
        <Text accessibilityRole="alert" aria-live="assertive" style={[styles.status, styles.statusProblem]}>{t('sync.popup.failed')}</Text>
      )}
      {!sync.enabled ? (
        <Button3D label={t('sync.enable')} style={styles.button} onPress={() => {
          setPopupFailed(false);
          sync.enable().catch((e) => isPopupError(e) && setPopupFailed(true));
        }} />
      ) : (
        <>
          <Button3D label={t('sync.disable')} variant="secondary" style={styles.button} onPress={() => void sync.disable()} />
          <Text style={styles.note}>{t('sync.disable.note')}</Text>
          <Button3D label={t('sync.delete')} variant="destructive" style={styles.button} onPress={confirmDelete} />
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
