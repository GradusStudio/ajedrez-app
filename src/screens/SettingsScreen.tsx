import React from 'react';
import { Alert, Pressable, ScrollView, StatusBar as RNStatusBar, StyleSheet, Text, View } from 'react-native';
import { Button3D } from '../components/Button3D';
import { Segmented } from '../components/Segmented';
import { SettingRow } from '../components/SettingRow';
import { useI18n } from '../i18n/I18nContext';
import { AVAILABLE_LANGUAGES, LANGUAGE_NAMES, Language } from '../i18n/languages';
import { resolveNotation, sanFromEnglish } from '../chess/notation';
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
  const { language, t } = useI18n();
  const { resetProgress } = useProgress();
  const { pieceSet } = usePieceSet();
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
        Alert.alert(t('settings.noPermission.title'), t('settings.noPermission.message'));
        update({ reminder: { enabled: false, hour } });
        return;
      }
      update({ reminder: { enabled: true, hour } });
    } catch {
      Alert.alert(t('settings.reminderFailed.title'), t('settings.reminderFailed.message'));
    }
  };

  const confirmReset = () =>
    Alert.alert(t('settings.reset.title'), t('settings.reset.message'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('settings.reset.confirm'), style: 'destructive', onPress: resetProgress },
    ]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: (RNStatusBar.currentHeight ?? 40) + space.sm }]}
    >
      <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel={t('common.backToProfile')} hitSlop={12}>
        <Text style={styles.back}>{t('common.backProfile')}</Text>
      </Pressable>
      <Text style={styles.title}>{t('settings.title')}</Text>

      {/* Práctica */}
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

      {/* Tablero */}
      <Text style={styles.section}>{t('settings.board')}</Text>
      <Text style={styles.label}>{t('settings.boardTheme')}</Text>
      <View style={styles.themes}>
        {(Object.keys(boardThemes) as BoardThemeId[]).map((id) => {
          const theme = boardThemes[id];
          const themeName = t(`boardTheme.${id}`);
          const selected = settings.boardTheme === id;
          return (
            <Pressable
              key={id}
              onPress={() => update({ boardTheme: id })}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={t('settings.boardThemeLabel', { name: themeName })}
              style={[styles.theme, selected && styles.themeSelected]}
            >
              <View style={styles.swatch}>
                {[theme.light, theme.dark, theme.dark, theme.light].map((c, i) => (
                  <View key={i} style={{ width: 18, height: 18, backgroundColor: c }} />
                ))}
              </View>
              <Text style={[styles.themeText, selected && { color: colors.text }]}>{themeName}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={{ height: space.md }} />
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
