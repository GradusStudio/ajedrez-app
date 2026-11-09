import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button3D } from '../components/Button3D';
import { ColumnScrollView } from '../components/ColumnScrollView';
import { Segmented } from '../components/Segmented';
import { MessageKey, useI18n } from '../i18n/I18nContext';
import { parseGame } from '../review/pgn';
import { setPendingGame } from '../review/session';
import { cleanUsername, fetchGames, FetchError, GameSource, ListedGame, parseStoredUsers, validUsername } from '../review/sources';
import { colors, fonts, radius, space } from '../theme';
import { statusBarTop } from '../components/statusBarTop';

type Tab = GameSource | 'pgn';

const USERS_KEY = '@ajedrez/reviewUsers';
type Users = Partial<Record<GameSource, string>>;

const ERROR_KEY: Record<FetchError, MessageKey> = {
  notFound: 'import.errorNotFound',
  network: 'import.errorNetwork',
  empty: 'import.errorEmpty',
};

type Props = { onBack: () => void; onReview: () => void };

/** Fecha corta del idioma del teléfono (día y mes). */
const shortDate = (ms: number, language: string) =>
  ms ? new Date(ms).toLocaleDateString(language, { day: 'numeric', month: 'short' }) : '';

// Elegir qué partida revisar: de chess.com o Lichess por usuario, o un PGN pegado.
export function ImportGameScreen({ onBack, onReview }: Props) {
  const { t, language } = useI18n();
  const [tab, setTab] = useState<Tab>('chesscom');
  const [users, setUsers] = useState<Users>({});
  const [games, setGames] = useState<ListedGame[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pgn, setPgn] = useState('');

  // El último usuario que se usó en cada sitio queda guardado.
  useEffect(() => {
    AsyncStorage.getItem(USERS_KEY)
      .then((raw) => raw && setUsers(parseStoredUsers(raw)))
      .catch(() => {});
  }, []);

  const changeTab = (next: Tab) => {
    setTab(next);
    setGames(null);
    setError(null);
  };

  const search = async () => {
    if (tab === 'pgn') return;
    const name = cleanUsername(users[tab] ?? '');
    if (!validUsername(name)) {
      setError(t('import.errorInvalidName'));
      return;
    }
    setError(null);
    setGames(null);
    setLoading(true);
    AsyncStorage.setItem(USERS_KEY, JSON.stringify({ ...users, [tab]: name })).catch(() => {});
    const res = await fetchGames(tab, name);
    setLoading(false);
    if (res.ok) setGames(res.games);
    else setError(t(ERROR_KEY[res.error]));
  };

  const open = (g: ListedGame) => {
    const name = cleanUsername(users[g.source] ?? '');
    setPendingGame({ pgn: g.pgn, username: name || undefined });
    onReview();
  };

  const openPgn = () => {
    if (!parseGame(pgn)) {
      setError(t('import.pgnInvalid'));
      return;
    }
    setError(null);
    setPendingGame({ pgn });
    onReview();
  };

  const resultChip = (g: ListedGame): { label: string; color: string } => {
    const me = cleanUsername(users[g.source] ?? '').toLowerCase();
    const side = g.white.toLowerCase() === me ? 'w' : g.black.toLowerCase() === me ? 'b' : null;
    if (g.result === '1/2-1/2') return { label: t('import.drew'), color: colors.textMuted };
    if (side && (g.result === '1-0') === (side === 'w')) return { label: t('import.youWon'), color: colors.primary };
    if (side) return { label: t('import.youLost'), color: colors.danger };
    return { label: g.result, color: colors.textMuted };
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ColumnScrollView
        contentContainerStyle={[styles.content, { paddingTop: statusBarTop(space.sm) }]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel={t('analysisMenu.title')} hitSlop={12}>
          <Text style={styles.back}>{t('analysisMenu.back')}</Text>
        </Pressable>
        <Text style={styles.title}>{t('import.title')}</Text>
        <View style={{ height: space.lg }} />
        <Segmented
          value={tab}
          onChange={changeTab}
          options={[
            { value: 'chesscom', label: t('import.chesscom') },
            { value: 'lichess', label: t('import.lichess') },
            { value: 'pgn', label: t('import.pgn') },
          ]}
        />
        <View style={{ height: space.lg }} />

        {tab !== 'pgn' ? (
          <>
            <Text style={styles.label}>{t('import.usernameLabel', { site: t(tab === 'chesscom' ? 'import.chesscom' : 'import.lichess') })}</Text>
            <TextInput
              value={users[tab] ?? ''}
              onChangeText={(v) => setUsers((u) => ({ ...u, [tab]: v }))}
              placeholder={t('import.usernamePlaceholder')}
              placeholderTextColor={colors.outline}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={search}
              style={styles.input}
            />
            <View style={{ height: space.md }} />
            <Button3D label={t('import.search')} variant="primary" onPress={search} />
          </>
        ) : (
          <>
            <Text style={styles.label}>{t('import.pgnLabel')}</Text>
            <TextInput
              value={pgn}
              onChangeText={setPgn}
              placeholder={t('import.pgnPlaceholder')}
              placeholderTextColor={colors.outline}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
              textAlignVertical="top"
              style={[styles.input, styles.pgnInput]}
            />
            <View style={{ height: space.md }} />
            <Button3D label={t('import.analyze')} variant="primary" onPress={openPgn} />
          </>
        )}

        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.muted}>{t('import.searching')}</Text>
          </View>
        )}
        {!!error && <Text style={styles.error}>{error}</Text>}

        {games && (
          <>
            <Text style={[styles.label, { marginTop: space.xl }]}>{t('import.recent')}</Text>
            {games.map((g) => {
              const chip = resultChip(g);
              return (
                <Pressable
                  key={g.id}
                  onPress={() => open(g)}
                  accessibilityRole="button"
                  accessibilityLabel={`${g.white} - ${g.black}`}
                  style={({ pressed }) => [styles.game, pressed && { backgroundColor: colors.surfaceRaised }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.players} numberOfLines={1}>
                      {g.white}
                      {g.whiteRating ? ` (${g.whiteRating})` : ''}
                    </Text>
                    <Text style={styles.players} numberOfLines={1}>
                      {g.black}
                      {g.blackRating ? ` (${g.blackRating})` : ''}
                    </Text>
                    <Text style={styles.meta}>{[g.speed, shortDate(g.date, language)].filter(Boolean).join(' · ')}</Text>
                  </View>
                  <Text style={[styles.chip, { color: chip.color }]}>{chip.label}</Text>
                </Pressable>
              );
            })}
          </>
        )}
      </ColumnScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  back: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted, marginBottom: space.md },
  title: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.text },
  label: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.text, marginBottom: space.sm },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.text,
  },
  pgnInput: { minHeight: 160, fontSize: 14 },
  center: { alignItems: 'center', gap: space.sm, marginTop: space.xl },
  muted: { fontFamily: fonts.semibold, fontSize: 13, color: colors.textMuted },
  error: { fontFamily: fonts.bold, fontSize: 14, color: colors.danger, marginTop: space.md },
  game: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    borderBottomWidth: 4,
    borderBottomColor: colors.surfaceShadow,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: space.sm,
  },
  players: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  meta: { fontFamily: fonts.semibold, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  chip: { fontFamily: fonts.extrabold, fontSize: 13 },
});
