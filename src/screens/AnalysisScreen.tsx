import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useIsFocused } from 'expo-router';
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
import { BotAvatar } from '../components/BotAvatar';
import { Button3D } from '../components/Button3D';
import { ColumnScrollView } from '../components/ColumnScrollView';
import { MiniBoard } from '../components/MiniBoard';
import { statusBarTop } from '../components/statusBarTop';
import { useWideLayout } from '../components/useWideLayout';
import { WideListColumn } from '../components/WideListColumn';
import { useContent } from '../data/useContent';
import { useI18n } from '../i18n/I18nContext';
import type { GameRecord } from '../progress/progressStore';
import { useProgress } from '../progress/ProgressContext';
import { botGamePgn, botGameReviewId } from '../review/botGames';
import { parseGame } from '../review/pgn';
import { pendingMistakes } from '../review/pendingMistakes';
import { reasonKey } from '../progress/reasonKey';
import { loadReviews } from '../review/reviewStore';
import { setPendingGame } from '../review/session';
import { cleanUsername, fetchGames, FetchError, type GameSource, type ListedGame, validUsername } from '../review/sources';
import { findReview, reviewId, type StoredReview } from '../review/store';
import { setPendingQuiz } from '../review/turningPoints';
import { useSettings } from '../settings/SettingsContext';
import { useTodayKey } from '../settings/useTodayKey';
import { type, colors, fonts, radius, space } from '../theme';

type Source = 'bots' | GameSource | 'pgn';
type Props = { onReview: () => void; onFree: () => void; onQuiz: () => void; onBots: () => void };

const ERROR_KEY = {
  notFound: 'import.errorNotFound',
  network: 'import.errorNetwork',
  empty: 'import.errorEmpty',
} as const satisfies Record<FetchError, string>;

/** Ancho de la columna de la pestaña en la web ancha (dos columnas: partidas y errores). */
const WIDE_COLUMN = 1000;

/** Fecha relativa de una partida: hoy, ayer o hace N días (clave local YYYY-MM-DD). */
function daysAgo(playedAt: string, today: string): number {
  const day = playedAt.slice(0, 10);
  if (day === today) return 0;
  const a = new Date(`${today}T12:00:00`).getTime();
  const b = new Date(`${day}T12:00:00`).getTime();
  return Math.max(1, Math.round((a - b) / 86400000));
}

/** Piezas de la posición inicial para el mini tablero del análisis libre. */
const START_PIECES = {
  a1: 'wr', b1: 'wn', c1: 'wb', d1: 'wq', e1: 'wk', f1: 'wb', g1: 'wn', h1: 'wr',
  a2: 'wp', b2: 'wp', c2: 'wp', d2: 'wp', e2: 'wp', f2: 'wp', g2: 'wp', h2: 'wp',
  a7: 'bp', b7: 'bp', c7: 'bp', d7: 'bp', e7: 'bp', f7: 'bp', g7: 'bp', h7: 'bp',
  a8: 'br', b8: 'bn', c8: 'bb', d8: 'bq', e8: 'bk', f8: 'bb', g8: 'bn', h8: 'br',
} as const;

/**
 * Pestaña Análisis (tarea 34, spec «Análisis»): revisar una partida de los bots, de chess.com, de Lichess o un PGN
 * pegado; practicar los errores pendientes de las revisiones guardadas; y abrir el tablero libre. En la web ancha
 * van dos columnas; en el celular, una.
 */
export function AnalysisScreen({ onReview, onFree, onQuiz, onBots }: Props) {
  const { t, tn, number } = useI18n();
  const { progress } = useProgress();
  const { findBot } = useContent();
  const { settings, update } = useSettings();
  const wide = useWideLayout();
  const focused = useIsFocused();
  const today = useTodayKey();

  const botGames = useMemo(() => progress.games.filter((g) => !g.practiceCourseId).slice(0, 10), [progress.games]);
  const [reviews, setReviews] = useState<StoredReview[]>([]);
  const mistakes = useMemo(() => pendingMistakes(reviews, progress.turningPoints), [reviews, progress.turningPoints]);

  const [source, setSource] = useState<Source>(botGames.length > 0 ? 'bots' : 'chesscom');
  const [games, setGames] = useState<ListedGame[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pgn, setPgn] = useState('');

  // Las revisiones guardadas se recargan al volver de una revisión (puede haber una nueva).
  useEffect(() => {
    if (!focused) return;
    let alive = true;
    loadReviews().then((list) => alive && setReviews(list));
    return () => {
      alive = false;
    };
  }, [focused]);

  // La búsqueda automática (usuario recordado) se hace una vez por fuente al elegirla.
  const autoSearched = useRef(new Set<string>());

  const search = useCallback(
    async (site: 'chesscom' | 'lichess') => {
      autoSearched.current.add(site);
      const name = cleanUsername(settings.importUser[site] ?? '');
      if (!validUsername(name)) {
        setError(t('import.errorInvalidName'));
        return;
      }
      setError(null);
      setGames(null);
      setLoading(true);
      update({ importUser: { ...settings.importUser, [site]: name } });
      const res = await fetchGames(site, name);
      setLoading(false);
      if (res.ok) setGames(res.games);
      else setError(t(ERROR_KEY[res.error]));
    },
    [settings.importUser, t, update]
  );

  // Al elegir chess.com o Lichess con usuario recordado, la búsqueda se hace sola (una vez por fuente).
  useEffect(() => {
    if (source !== 'chesscom' && source !== 'lichess') return;
    if (autoSearched.current.has(source)) return;
    const name = cleanUsername(settings.importUser[source] ?? '');
    autoSearched.current.add(source);
    if (!name) return;
    // Es una acción de red, no un estado derivado: el aviso de error y la lista llegan después de la respuesta.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void search(source);
    // Solo al cambiar de fuente: el usuario recordado se busca una vez y no al escribir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  const changeSource = (next: Source) => {
    setSource(next);
    setGames(null);
    setError(null);
  };

  /**
   * La revisión guardada de una partida de bot: por el id de la partida (`bot:<playedAt>`) o por el hash de su PGN,
   * que es como se guardó cuando se revisó desde la capa del resultado.
   */
  const savedFor = (record: GameRecord) => {
    const botName = findBot(record.botId)?.name ?? record.botId;
    const pgnText = botGamePgn(record, botName, t('analysis.you'));
    const botId = botGameReviewId(record);
    const saved = findReview(reviews, botId, reviewId(pgnText));
    return { saved, pgnText, id: saved?.id ?? botId };
  };

  const openGame = (record: GameRecord) => {
    const { saved, pgnText, id } = savedFor(record);
    const userName = t('analysis.you');
    setPendingGame(
      saved
        ? { pgn: pgnText, username: userName, id, review: saved.review, me: saved.me, coachId: saved.coachId }
        : { pgn: pgnText, username: userName, id }
    );
    onReview();
  };

  const openImported = (g: ListedGame) => {
    const name = cleanUsername(settings.importUser[g.source] ?? '');
    setPendingGame({ pgn: g.pgn, username: name || undefined, id: reviewId(g.pgn) });
    onReview();
  };

  const openPgn = () => {
    if (!parseGame(pgn)) {
      setError(t('import.pgnInvalid'));
      return;
    }
    setError(null);
    setPendingGame({ pgn, id: reviewId(pgn) });
    onReview();
  };

  const practiceMistakes = () => {
    if (!mistakes) return;
    setPendingQuiz({ points: mistakes.points, me: mistakes.me, coachId: mistakes.coachId });
    onQuiz();
  };

  /** El motivo guardado en español se muestra en el idioma elegido; los textos viejos desconocidos, como están. */
  const reasonText = (reason: string) => {
    const key = reasonKey(reason);
    return key ? t(key) : reason;
  };

  const resultOf = (record: GameRecord) => {
    if (record.result === 'win') return { label: t('import.youWon'), color: colors.gold };
    if (record.result === 'loss') return { label: t('import.youLost'), color: colors.textMuted };
    return { label: t('import.drew'), color: colors.text };
  };

  const whenOf = (playedAt: string) => {
    const days = daysAgo(playedAt, today);
    if (days === 0) return t('analysis.when.today');
    if (days === 1) return t('analysis.when.yesterday');
    return tn('analysis.when.days', days);
  };

  const resultChip = (g: ListedGame): { label: string; color: string } => {
    const me = cleanUsername(settings.importUser[g.source] ?? '').toLowerCase();
    const side = g.white.toLowerCase() === me ? 'w' : g.black.toLowerCase() === me ? 'b' : null;
    if (g.result === '1/2-1/2') return { label: t('import.drew'), color: colors.textMuted };
    if (side && (g.result === '1-0') === (side === 'w')) return { label: t('import.youWon'), color: colors.primary };
    if (side) return { label: t('import.youLost'), color: colors.danger };
    return { label: g.result, color: colors.textMuted };
  };

  const sources: { value: Source; label: string }[] = [
    { value: 'bots', label: t('analysis.source.bots') },
    { value: 'chesscom', label: t('import.chesscom') },
    { value: 'lichess', label: t('import.lichess') },
    { value: 'pgn', label: t('import.pgn') },
  ];

  const sourceTabs = (
    <View style={styles.tabs} accessibilityRole="tablist">
      {sources.map((s) => {
        const selected = s.value === source;
        return (
          <Pressable
            key={s.value}
            onPress={() => changeSource(s.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={[styles.tab, wide && styles.tabWide, selected && styles.tabSelected]}
          >
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85} style={[styles.tabText, selected && { color: colors.text }]}>
              {s.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  const botGamesList =
    botGames.length === 0 ? (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>{t('analysis.bots.emptyTitle')}</Text>
        <Text style={styles.muted}>{t('analysis.bots.emptyText')}</Text>
        <Button3D label={t('analysis.bots.go')} onPress={onBots} style={styles.emptyButton} />
      </View>
    ) : (
      botGames.map((record) => {
        const bot = findBot(record.botId);
        const result = resultOf(record);
        const saved = !!savedFor(record).saved;
        const meta = [
          reasonText(record.reason),
          tn('analysis.moves', record.moves.length),
          whenOf(record.playedAt),
        ].join(' · ');
        return (
          <View key={record.playedAt} style={styles.game}>
            {bot && <BotAvatar bot={bot} size={36} />}
            <View style={styles.gameBody}>
              <View style={styles.gameHead}>
                <Text style={styles.gameTitle} numberOfLines={1}>{t('analysis.vs', { bot: bot?.name ?? record.botId })}</Text>
                <Text style={[styles.result, { color: result.color }]}>{result.label}</Text>
              </View>
              <Text style={styles.gameMeta} numberOfLines={2}>{meta}</Text>
            </View>
            <Button3D
              label={saved ? t('analysis.game.viewReview') : t('analysis.game.review')}
              variant={saved ? 'secondary' : 'primary'}
              onPress={() => openGame(record)}
              style={styles.gameButton}
            />
          </View>
        );
      })
    );

  const importedList =
    source !== 'pgn' && source !== 'bots' ? (
      <>
        <Text style={styles.label}>{t('import.usernameLabel', { site: t(source === 'chesscom' ? 'import.chesscom' : 'import.lichess') })}</Text>
        <View style={[styles.searchRow, !wide && styles.searchColumn]}>
          <TextInput
            value={settings.importUser[source] ?? ''}
            onChangeText={(value) => update({ importUser: { ...settings.importUser, [source]: value } })}
            placeholder={t('import.usernamePlaceholder')}
            placeholderTextColor={colors.outline}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={() => search(source)}
            style={[styles.input, wide && { flex: 1 }]}
          />
          <Button3D label={t('import.search')} onPress={() => search(source)} />
        </View>
        <Text style={styles.hint}>{t('analysis.userRemembered')}</Text>
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.muted}>{t('import.searching')}</Text>
          </View>
        )}
        {!!error && <Text style={styles.error}>{error}</Text>}
        {games && games.length > 0 && (
          <>
            <Text style={[styles.label, { marginTop: space.xl }]}>{t('import.recent')}</Text>
            {games.map((g) => {
              const chip = resultChip(g);
              return (
                <Pressable
                  key={g.id}
                  onPress={() => openImported(g)}
                  accessibilityRole="button"
                  accessibilityLabel={`${g.white} - ${g.black}`}
                  style={({ pressed }) => [styles.imported, pressed && { backgroundColor: colors.surfaceRaised }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.players} numberOfLines={1}>
                      {g.white}{g.whiteRating ? ` (${g.whiteRating})` : ''}
                    </Text>
                    <Text style={styles.players} numberOfLines={1}>
                      {g.black}{g.blackRating ? ` (${g.blackRating})` : ''}
                    </Text>
                    <Text style={styles.gameMeta}>{[g.speed, whenOf(new Date(g.date).toISOString())].filter(Boolean).join(' · ')}</Text>
                  </View>
                  <Text style={[styles.chip, { color: chip.color }]}>{chip.label}</Text>
                </Pressable>
              );
            })}
          </>
        )}
      </>
    ) : null;

  const pgnForm =
    source === 'pgn' ? (
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
        <Button3D label={t('import.analyze')} variant="primary" onPress={openPgn} style={{ marginTop: space.md }} />
        {!!error && <Text style={styles.error}>{error}</Text>}
      </>
    ) : null;

  const reviewCard = (
    <View style={styles.card}>
      <Text style={styles.kicker}>{t('analysis.reviewTitle')}</Text>
      <Text style={styles.cardTitle}>{t('analysis.pickGame')}</Text>
      {sourceTabs}
      {source === 'bots' ? botGamesList : source === 'pgn' ? pgnForm : importedList}
    </View>
  );

  const side = (
    <View style={styles.side}>
      {mistakes && (
        <View style={[styles.card, styles.mistakesCard]}>
          <Text style={styles.kicker}>{t('analysis.mistakes.title')}</Text>
          <View style={styles.mistakesRow}>
            <Text style={styles.mistakesNumber}>{number(mistakes.points.length)}</Text>
            <Text style={styles.mistakesText}>{tn('analysis.mistakes.body', mistakes.points.length)}</Text>
          </View>
          <Button3D label={t('analysis.mistakes.action')} variant="secondary" onPress={practiceMistakes} style={{ marginTop: space.md }} />
        </View>
      )}

      <View style={styles.card}>
        <View style={styles.freeRow}>
          <View style={styles.eval}>
            <View style={styles.evalWhite} />
          </View>
          <MiniBoard size={110} corner="a1" span={8} pieces={START_PIECES} />
          <View style={styles.freeBody}>
            <Text style={styles.kicker}>{t('analysis.free.title')}</Text>
            <Text style={styles.cardTitle}>{t('analysis.free.subtitle')}</Text>
            <Text style={styles.muted}>{t('analysis.free.text')}</Text>
          </View>
        </View>
        <Button3D label={t('analysis.free.action')} variant="secondary" onPress={onFree} style={{ marginTop: space.md }} />
      </View>

      <Text style={styles.how}>{t('analysis.how')}</Text>
    </View>
  );

  const content = (
    <>
      <Text accessibilityRole="header" aria-level={1} style={styles.title}>{t('tabs.analysis')}</Text>
      <Text style={styles.lead}>{t('analysis.lead')}</Text>
      {wide ? (
        <View style={styles.cols}>
          <View style={styles.col}>{reviewCard}</View>
          <View style={styles.colSide}>{side}</View>
        </View>
      ) : (
        <>
          {reviewCard}
          {side}
        </>
      )}
    </>
  );

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <WideListColumn width={WIDE_COLUMN}>
        <ColumnScrollView
          contentContainerStyle={[styles.content, { paddingTop: statusBarTop(space.md) }]}
          keyboardShouldPersistTaps="handled"
        >
          {content}
        </ColumnScrollView>
      </WideListColumn>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  title: { fontFamily: fonts.extrabold, fontSize: type.title, color: colors.text },
  lead: { fontFamily: fonts.bold, fontSize: type.secondary, color: colors.textMuted, marginTop: 2, marginBottom: space.lg, lineHeight: 20 },
  cols: { flexDirection: 'row', alignItems: 'flex-start', gap: space.xl },
  col: { flex: 1.5, minWidth: 0 },
  colSide: { flex: 1, minWidth: 0 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    borderBottomWidth: 4,
    borderBottomColor: colors.surfaceShadow,
    padding: space.lg,
    marginBottom: space.md,
  },
  kicker: { fontFamily: fonts.extrabold, fontSize: type.caption, color: colors.primary, letterSpacing: 0.6, textTransform: 'uppercase' },
  cardTitle: { fontFamily: fonts.extrabold, fontSize: 19, color: colors.text, marginTop: 2, marginBottom: space.md },
  label: { fontFamily: fonts.extrabold, fontSize: type.secondary, color: colors.text, marginBottom: space.sm },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.lg },
  tab: {
    flexBasis: '48%',
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: space.sm,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    backgroundColor: colors.surface,
  },
  tabWide: { flexBasis: 'auto', flexGrow: 1 },
  tabSelected: { backgroundColor: colors.surfaceRaised, borderColor: colors.primary },
  tabText: { fontFamily: fonts.extrabold, fontSize: type.secondary, color: colors.textMuted },
  game: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 10,
  },
  gameBody: { flex: 1, minWidth: 0 },
  gameHead: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
  gameTitle: { flexShrink: 1, fontFamily: fonts.extrabold, fontSize: type.body, color: colors.text },
  gameMeta: { fontFamily: fonts.semibold, fontSize: type.caption, color: colors.textMuted, marginTop: 2 },
  result: { fontFamily: fonts.extrabold, fontSize: type.secondary },
  gameButton: { paddingHorizontal: 12 },
  empty: { alignItems: 'flex-start', gap: space.xs, paddingVertical: space.sm },
  emptyTitle: { fontFamily: fonts.extrabold, fontSize: type.body, color: colors.text },
  emptyButton: { marginTop: space.sm },
  muted: { fontFamily: fonts.semibold, fontSize: type.secondary, color: colors.textMuted, lineHeight: 19 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  // En el celular el campo y «Buscar partidas» no entran en una fila: el botón va debajo.
  searchColumn: { flexDirection: 'column', alignItems: 'stretch' },
  input: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceShadow,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: fonts.semibold,
    fontSize: type.body,
    color: colors.text,
  },
  pgnInput: { minHeight: 140 },
  hint: { fontFamily: fonts.semibold, fontSize: type.caption, color: colors.textMuted, marginTop: space.sm },
  center: { alignItems: 'center', gap: space.sm, marginTop: space.lg },
  error: { fontFamily: fonts.bold, fontSize: type.body, color: colors.danger, marginTop: space.md },
  imported: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 10,
  },
  players: { fontFamily: fonts.bold, fontSize: type.body, color: colors.text },
  chip: { fontFamily: fonts.extrabold, fontSize: type.secondary },
  side: { gap: space.md },
  mistakesCard: { borderColor: colors.surfaceRaised },
  mistakesRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  mistakesNumber: { fontFamily: fonts.extrabold, fontSize: type.display, color: colors.gold, lineHeight: type.display + 4 },
  mistakesText: { flex: 1, fontFamily: fonts.bold, fontSize: type.body, color: colors.text, lineHeight: 21 },
  freeRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  eval: { width: 10, height: 110, borderRadius: 5, backgroundColor: '#403D39', overflow: 'hidden' },
  evalWhite: { flex: 1, backgroundColor: '#F2F2F2' },
  freeBody: { flex: 1, minWidth: 0 },
  how: { fontFamily: fonts.semibold, fontSize: type.caption, color: colors.textMuted, lineHeight: 18, paddingHorizontal: space.xs },
});
