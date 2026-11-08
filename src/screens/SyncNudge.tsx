import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button3D } from '../components/Button3D';
import { useI18n } from '../i18n/I18nContext';
import { useDriveSync } from '../sync/DriveSyncContext';
import { colors, fonts, radius, space } from '../theme';

// Cartel de las pantallas de resultado: cada 3 lecciones o partidas terminadas, si la copia en Drive está activada pero
// falta el permiso. El botón es un toque de la persona, así que el navegador deja abrir la ventana de Google.
// Se monta una vez por resultado: al montarse cuenta la acción terminada.
export function SyncNudge() {
  const { t } = useI18n();
  const sync = useDriveSync();
  const [due, setDue] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Contar es un efecto de la visita (escribe en el almacenamiento), no un cálculo del dibujo; `counted` evita contar dos veces.
  const counted = useRef(false);
  const { noteCompletion } = sync;
  useEffect(() => {
    if (counted.current) return;
    counted.current = true;
    setDue(noteCompletion());
  }, [noteCompletion]);

  // Al reconectar, el estado deja de ser needsAuth y el cartel se va solo.
  if (!due || dismissed || sync.status !== 'needsAuth') return null;
  return (
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>{t('sync.nudge.title')}</Text>
      <Text style={styles.text}>{t('sync.nudge.text')}</Text>
      <Button3D label={t('sync.reconnect')} onPress={() => void sync.reconnect()} style={{ marginTop: space.md, minHeight: 48 }} />
      <Button3D label={t('sync.nudge.later')} variant="secondary" onPress={() => setDismissed(true)} style={{ marginTop: space.sm }} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: space.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    borderBottomWidth: 4,
    borderBottomColor: colors.surfaceShadow,
    padding: space.lg,
  },
  title: { fontFamily: fonts.bold, fontSize: 16, color: colors.text, textAlign: 'center' },
  text: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: space.xs, lineHeight: 20 },
});
