import React from 'react';
import { showDialog } from '../components/dialog';
import { Pressable, ScrollView, StatusBar as RNStatusBar, StyleSheet, Text } from 'react-native';
import { Button3D } from '../components/Button3D';
import { Segmented } from '../components/Segmented';
import { SettingRow } from '../components/SettingRow';
import { useI18n } from '../i18n/I18nContext';
import { AVAILABLE_LANGUAGES, LANGUAGE_NAMES, Language } from '../i18n/languages';
import { resolveNotation, sanFromEnglish } from '../chess/notation';
import { FILE_IO_SUPPORTED, pickTextFile, saveTextFile } from '../progress/fileIO';
import { parseProgressFile, progressToFile } from '../progress/progressFile';
import { useProgress } from '../progress/ProgressContext';
import { todayKey } from '../progress/streak';
import { usePieceSet } from '../settings/PieceSetContext';
import { cancelDailyReminder, ensureReminderPermission, REMINDERS_SUPPORTED } from '../settings/reminders';
import { useSettings } from '../settings/SettingsContext';
import { useBoardTheme } from '../settings/useBoardTheme';
import { colors, fonts, space } from '../theme';

type Props = { onBack: () => void; onOpenPieces: () => void; onOpenBoards: () => void };

const REMINDER_HOURS = [9, 13, 19, 21];

// Ajustes (mapa-de-pantallas.md, 2.12). Cada cambio se guarda al instante.
export function SettingsScreen({ onBack, onOpenPieces, onOpenBoards }: Props) {
  const { settings, update } = useSettings();
  const { language, t } = useI18n();
  const { progress, resetProgress, importProgress } = useProgress();
  const { pieceSet } = usePieceSet();
  const boardTheme = useBoardTheme();
  const pieceName = t(`pieceSet.${pieceSet}.name`);

  const setReminder = async (enabled: boolean, hour = settings.reminder.hour) => {
    if (!enabled) {
      update({ reminder: { enabled: false, hour } });
      cancelDailyReminder().catch(() => {});
      return;
    }
    try {
      const ok = await ensureReminderPermission(t('settings.reminder'));
      if (!ok) {
        showDialog(t('settings.noPermission.title'), t('settings.noPermission.message'));
        update({ reminder: { enabled: false, hour } });
        return;
      }
      update({ reminder: { enabled: true, hour } });
    } catch {
      showDialog(t('settings.reminderFailed.title'), t('settings.reminderFailed.message'));
    }
  };

  const confirmReset = () =>
    showDialog(t('settings.reset.title'), t('settings.reset.message'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('settings.reset.confirm'), style: 'destructive', onPress: resetProgress },
    ]);

  const saveCopy = () => saveTextFile(`gradus-progreso-${todayKey()}.json`, progressToFile(progress, new Date()));

  const loadCopy = async () => {
    const text = await pickTextFile();
    if (text === null) return;
    const result = parseProgressFile(text);
    if (!result.ok) {
      showDialog(t('settings.load.error.title'), t(`settings.load.error.${result.error}`));
      return;
    }
    showDialog(t('settings.load.title'), t('settings.load.message'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.load.confirm'),
        onPress: () => {
          importProgress(result.progress);
          showDialog(t('settings.load.done.title'), t('settings.load.done.message'));
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: (RNStatusBar.currentHeight ?? 40) + space.sm }]}
    >
      <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel={t('common.backToProfile')} hitSlop={12}>
        <Text style={styles.back}>{t('common.backProfile')}</Text>
      </Pressable>
      <Text style={styles.title}>{t('settings.title')}</Text>

      {/* Práctica: el recordatorio solo existe en el celular */}
      {REMINDERS_SUPPORTED && (
        <>
          <Text style={styles.section}>{t('settings.practice')}</Text>
          <SettingRow
            label={t('settings.reminder')}
            description={settings.reminder.enabled ? t('settings.reminder.on', { hour: settings.reminder.hour }) : t('settings.reminder.off')}
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
        </>
      )}

      {/* Tablero */}
      <Text style={styles.section}>{t('settings.board')}</Text>
      <SettingRow label={t('settings.boardTheme')} detail={t(`boardTheme.${boardTheme}`)} onPress={onOpenBoards} />
      <SettingRow label={t('settings.pieces')} detail={pieceName} onPress={onOpenPieces} />
      <Text style={styles.label}>{t('settings.language')}</Text>
      <Segmented
        options={[
          { value: 'auto' as 'auto' | Language, label: t('settings.language.auto') },
          ...AVAILABLE_LANGUAGES.map((l) => ({ value: l as 'auto' | Language, label: LANGUAGE_NAMES[l] })),
        ]}
        value={settings.language}
        onChange={(l) => update({ language: l })}
      />
      <Text style={styles.label}>{t('settings.notation')}</Text>
      <Segmented
        options={[
          { value: 'auto' as const, label: t('settings.notation.auto'), sub: sanFromEnglish('Nf3, Bxf7+', resolveNotation('auto', language)) },
          { value: 'en' as const, label: t('settings.notation.english'), sub: 'Nf3, Bxf7+' },
        ]}
        value={settings.notation}
        onChange={(n) => update({ notation: n })}
      />

      {/* Sonido y vibración */}
      <Text style={styles.section}>{t('settings.soundSection')}</Text>
      <SettingRow
        label={t('settings.sound')}
        description={t('settings.sound.description')}
        value={settings.sound}
        onValueChange={(v) => update({ sound: v })}
      />
      <SettingRow
        label={t('settings.vibration')}
        description={t('settings.vibration.description')}
        value={settings.vibration}
        onValueChange={(v) => update({ vibration: v })}
      />

      {/* Datos */}
      <Text style={styles.section}>{t('settings.data')}</Text>
      {FILE_IO_SUPPORTED && (
        <>
          <Button3D label={t('settings.save')} style={styles.dataButton} onPress={saveCopy} />
          <Button3D label={t('settings.load')} style={styles.dataButton} onPress={loadCopy} />
        </>
      )}
      <Button3D label={t('settings.reset')} variant="destructive" onPress={confirmReset} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  back: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted, marginBottom: space.sm },
  title: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.text },
  section: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.text, marginTop: space.xl, marginBottom: space.sm },
  dataButton: { marginBottom: space.sm },
  label: {
    fontFamily: fonts.extrabold,
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: space.sm,
  },
});
