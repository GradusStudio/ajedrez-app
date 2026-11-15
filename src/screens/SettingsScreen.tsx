import React from 'react';
import { router } from 'expo-router';
import { showDialog } from '../components/dialog';
import { StyleSheet, Text, View } from 'react-native';
import { ColumnScrollView } from '../components/ColumnScrollView';
import { Button3D } from '../components/Button3D';
import { BackButton } from '../components/BackButton';
import { Segmented } from '../components/Segmented';
import { SyncSection } from './SyncSection';
import { SettingRow } from '../components/SettingRow';
import { useI18n } from '../i18n/I18nContext';
import { AVAILABLE_LANGUAGES, LANGUAGE_NAMES, Language } from '../i18n/languages';
import { resolveNotation, sanFromEnglish } from '../chess/notation';
import { FILE_IO_SUPPORTED, pickTextFile, saveTextFile } from '../progress/fileIO';
import { parseProgressFile, progressToFile } from '../progress/progressFile';
import { useProgress } from '../progress/ProgressContext';
import { todayKey } from '../progress/streak';
import { usePieceSet } from '../settings/PieceSetContext';
import { cancelDailyReminder, ensureReminderPermission, REMINDER_SUPPORT } from '../settings/reminders';
import { useSettings } from '../settings/SettingsContext';
import { useBoardTheme } from '../settings/useBoardTheme';
import { type, colors, fonts, space } from '../theme';
import { statusBarTop } from '../components/statusBarTop';

type Props = { onBack: () => void; onOpenPieces: () => void; onOpenBoards: () => void; onOpenCredits: () => void };

const REMINDER_HOURS = [9, 13, 19, 21];

// Ajustes (mapa-de-pantallas.md, 2.12). Cada cambio se guarda al instante.
export function SettingsScreen({ onBack, onOpenPieces, onOpenBoards, onOpenCredits }: Props) {
  const { settings, update } = useSettings();
  const { language, t } = useI18n();
  const { progress, resetProgress, importProgress } = useProgress();
  const { pieceSet } = usePieceSet();
  const boardTheme = useBoardTheme();
  const pieceName = t(`pieceSet.${pieceSet}.name`);
  // Con un nivel distinto de «nunca jugué» todas las unidades están abiertas por el nivel (unitOpen, path.ts).
  const levelOpensAll = progress.profile.level !== 'nuevo';

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
          try {
            importProgress(result.progress);
          } catch {
            // Si algo del archivo rompe la combinación, no se guarda nada y se avisa como con cualquier archivo inválido.
            showDialog(t('settings.load.error.title'), t('settings.load.error.notGradus'));
            return;
          }
          showDialog(t('settings.load.done.title'), t('settings.load.done.message'));
        },
      },
    ]);
  };

  return (
    <ColumnScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: statusBarTop(space.sm) }]}
    >
      <BackButton screen={t('tabs.profile')} onPress={onBack} />
      <Text style={styles.title}>{t('settings.title')}</Text>

      {/* Práctica: el nivel de puzzles en las dos plataformas; el recordatorio depende del soporte de cada una */}
      <Text style={styles.section}>{t('settings.practice')}</Text>
      <SettingRow
        label={t('settings.showPuzzleRating')}
        description={t('settings.showPuzzleRating.description')}
        value={settings.showPuzzleRating}
        onValueChange={(v) => update({ showPuzzleRating: v })}
      />
      <SettingRow
        label={t('settings.openAllUnits')}
        description={levelOpensAll ? t('settings.openAllUnits.byLevel') : t('settings.openAllUnits.description')}
        value={levelOpensAll ? true : settings.openAllUnits}
        onValueChange={(v) => update({ openAllUnits: v })}
        disabled={levelOpensAll}
      />
      {REMINDER_SUPPORT === 'supported' && (
        <>
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
      {REMINDER_SUPPORT === 'ios-needs-install' && (
        <SettingRow
          label={t('settings.reminder')}
          description={t('settings.reminder.installFirst')}
          detail={t('settings.reminder.installAction')}
          onPress={() => router.push('/instalar')}
        />
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

      {/* Consejos */}
      <Text style={styles.section}>{t('settings.tipsSection')}</Text>
      <SettingRow
        label={t('settings.tipsReset')}
        description={t('settings.tipsReset.description')}
        onPress={() => update({ seenTips: [] })}
      />

      {/* Datos */}
      <Text style={styles.section}>{t('settings.data')}</Text>
      <SyncSection />
      {FILE_IO_SUPPORTED && (
        <>
          <Button3D label={t('settings.save')} style={styles.dataButton} onPress={saveCopy} />
          <Button3D label={t('settings.load')} style={styles.dataButton} onPress={loadCopy} />
        </>
      )}
      <Button3D label={t('settings.reset')} variant="destructive" onPress={confirmReset} />
      <View style={styles.credits}>
        <SettingRow label={t('credits.title')} onPress={onOpenCredits} />
      </View>
    </ColumnScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  title: { fontFamily: fonts.extrabold, fontSize: type.title, color: colors.text },
  section: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.text, marginTop: space.xl, marginBottom: space.sm },
  dataButton: { marginBottom: space.sm },
  credits: { marginTop: space.xl },
  label: {
    fontFamily: fonts.extrabold,
    fontSize: type.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: space.sm,
  },
});
