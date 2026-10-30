import React from 'react';
import { Alert, Pressable, ScrollView, StatusBar as RNStatusBar, StyleSheet, Text, View } from 'react-native';
import { Button3D } from '../components/Button3D';
import { Segmented } from '../components/Segmented';
import { SettingRow } from '../components/SettingRow';
import { PIECE_SET_META } from '../pieces/pieceSets';
import { useProgress } from '../progress/ProgressContext';
import { usePieceSet } from '../settings/PieceSetContext';
import { cancelDailyReminder, ensureReminderPermission } from '../settings/reminders';
import { useSettings } from '../settings/SettingsContext';
import { BoardThemeId, boardThemes, colors, fonts, radius, space } from '../theme';

type Props = { onBack: () => void; onOpenPieces: () => void };

const REMINDER_HOURS = [9, 13, 19, 21];

// Ajustes (mapa-de-pantallas.md, 2.12). Cada cambio se guarda al instante.
export function SettingsScreen({ onBack, onOpenPieces }: Props) {
  const { settings, update } = useSettings();
  const { resetProgress } = useProgress();
  const { pieceSet } = usePieceSet();
  const pieceName = PIECE_SET_META.find((m) => m.id === pieceSet)?.name ?? '';

  const setReminder = async (enabled: boolean, hour = settings.reminder.hour) => {
    if (!enabled) {
      update({ reminder: { enabled: false, hour } });
      cancelDailyReminder().catch(() => {});
      return;
    }
    try {
      const ok = await ensureReminderPermission();
      if (!ok) {
        Alert.alert(
          'Sin permiso para avisarte',
          'Para recibir el recordatorio, permite las notificaciones de esta app en los ajustes del teléfono.'
        );
        update({ reminder: { enabled: false, hour } });
        return;
      }
      update({ reminder: { enabled: true, hour } });
    } catch {
      Alert.alert('No se pudo programar el recordatorio', 'Prueba otra vez en unos minutos.');
    }
  };

  const confirmReset = () =>
    Alert.alert(
      '¿Borrar todo el progreso?',
      'Se borran tus lecciones, racha, monedas, sets comprados, puzzles y partidas. Los ajustes no se borran. No se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Borrar', style: 'destructive', onPress: resetProgress },
      ]
    );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: (RNStatusBar.currentHeight ?? 40) + space.sm }]}
    >
      <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Volver a Perfil" hitSlop={12}>
        <Text style={styles.back}>‹ Perfil</Text>
      </Pressable>
      <Text style={styles.title}>Ajustes</Text>

      {/* Práctica */}
      <Text style={styles.section}>Práctica</Text>
      <SettingRow
        label="Recordatorio diario"
        description={settings.reminder.enabled ? `Todos los días a las ${settings.reminder.hour}:00` : 'Un aviso para practicar'}
        value={settings.reminder.enabled}
        onValueChange={(v) => setReminder(v)}
      />
      {settings.reminder.enabled && (
        <Segmented
          options={REMINDER_HOURS.map((h) => ({ value: h, label: `${h}:00` }))}
          value={settings.reminder.hour}
          onChange={(h) => setReminder(true, h)}
        />
      )}

      {/* Tablero */}
      <Text style={styles.section}>Tablero</Text>
      <Text style={styles.label}>Tema del tablero</Text>
      <View style={styles.themes}>
        {(Object.keys(boardThemes) as BoardThemeId[]).map((id) => {
          const t = boardThemes[id];
          const selected = settings.boardTheme === id;
          return (
            <Pressable
              key={id}
              onPress={() => update({ boardTheme: id })}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`Tablero ${t.name}`}
              style={[styles.theme, selected && styles.themeSelected]}
            >
              <View style={styles.swatch}>
                {[t.light, t.dark, t.dark, t.light].map((c, i) => (
                  <View key={i} style={{ width: 18, height: 18, backgroundColor: c }} />
                ))}
              </View>
              <Text style={[styles.themeText, selected && { color: colors.text }]}>{t.name}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={{ height: space.md }} />
      <SettingRow label="Piezas" detail={pieceName} onPress={onOpenPieces} />
      <Text style={styles.label}>Notación de las jugadas</Text>
      <Segmented
        options={[
          { value: 'es', label: 'Española', sub: 'Cf3, Axf7+' },
          { value: 'en', label: 'Inglesa', sub: 'Nf3, Bxf7+' },
        ]}
        value={settings.notation}
        onChange={(n) => update({ notation: n })}
      />

      {/* Sonido y vibración */}
      <Text style={styles.section}>Sonido y vibración</Text>
      <SettingRow
        label="Sonido"
        description="Al mover, capturar, acertar y fallar. Se calla con el teléfono en silencio."
        value={settings.sound}
        onValueChange={(v) => update({ sound: v })}
      />
      <SettingRow
        label="Vibración"
        description="Al acertar y al fallar."
        value={settings.vibration}
        onValueChange={(v) => update({ vibration: v })}
      />

      {/* Datos */}
      <Text style={styles.section}>Datos</Text>
      <Button3D label="Borrar progreso" variant="destructive" onPress={confirmReset} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  back: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted, marginBottom: space.sm },
  title: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.text },
  section: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.text, marginTop: space.xl, marginBottom: space.sm },
  label: {
    fontFamily: fonts.extrabold,
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: space.sm,
  },
  themes: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  theme: {
    alignItems: 'center',
    gap: space.xs,
    padding: space.sm,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    backgroundColor: colors.surface,
  },
  themeSelected: { borderColor: colors.primary, backgroundColor: colors.surfaceRaised },
  swatch: { width: 36, height: 36, flexDirection: 'row', flexWrap: 'wrap', borderRadius: 6, overflow: 'hidden' },
  themeText: { fontFamily: fonts.bold, fontSize: 12, color: colors.textMuted },
});
