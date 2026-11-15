import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { botBodySource } from './BotAvatar';
import { BotGlow } from './BotGlow';
import { Button3D } from './Button3D';
import { CoinReward } from './CoinReward';
import { StatIcon } from './StatIcon';
import { StreakFlame } from './StreakFlame';
import { useReducedMotion } from './useReducedMotion';
import { useWideLayout } from './useWideLayout';
import type { Bot } from '../data/bots';
import type { OpeningCourse } from '../data/lessonTypes';
import { MessageKey, useI18n } from '../i18n/I18nContext';
import { botHistory, historyNote } from '../progress/botHistory';
import type { GameRecord } from '../progress/progressStore';
import { type, colors, fonts, space } from '../theme';

type Props = {
  bot: Bot;
  userColor: 'w' | 'b';
  kind: 'win' | 'loss' | 'draw';
  reason: MessageKey;
  /** Jugadas de la partida (plies): el número de jugada es la mitad, redondeado para arriba. */
  plies: number;
  coins: number;
  dailyBonus: number;
  streak: number;
  streakLit: boolean;
  streakRecovered: boolean;
  games: GameRecord[];
  practiceCourse?: OpeningCourse;
  onClose: () => void;
  onReview: () => void;
  onRematch: () => void;
  onOtherBot: () => void;
};

const BG = 'rgba(38, 36, 33, 0.92)'; // colors.bg al 92 % (spec del resultado)
const FLAME = '#F5912F';
const COINS_TITLE_ID = 'gradus-result-title';

type NodeRef = React.ComponentRef<typeof View>;
type Measurable = { measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) => void };

/** `measureInWindow` existe en el nodo real (ReactNativeElement) pero no en el tipo del ref de View. */
const measureWindow = (node: NodeRef | null, cb: (x: number, y: number, w: number, h: number) => void) =>
  (node as unknown as Measurable | null)?.measureInWindow(cb);

/**
 * Capa del resultado de una partida contra un bot (tarea 37, spec «resultado de partida»): el bot de cuerpo
 * entero con su frase y su reacción, el resultado con el motivo, lo que se ganó, el historial contra ese bot y los
 * botones. «Ver el tablero» la cierra y deja la tarjeta del panel como antes.
 */
export function GameResultLayer(props: Props) {
  const { bot, userColor, kind, reason, plies, coins, dailyBonus, streak, streakLit, streakRecovered, games, practiceCourse } = props;
  const { t, tn, number } = useI18n();
  const wide = useWideLayout();
  const { height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const [fade] = useState(() => new Animated.Value(reduced ? 1 : 0));
  const [react] = useState(() => new Animated.Value(0));
  const [pulse] = useState(() => new Animated.Value(1));
  const [pillLanded, setPillLanded] = useState(false);
  const [coords, setCoords] = useState<{ from: { x: number; y: number }; to: { x: number; y: number }; size: number } | null>(null);
  const layerRef = useRef<NodeRef>(null);
  const botRef = useRef<NodeRef>(null);
  const coinRef = useRef<NodeRef>(null);

  const bodyHeight = wide ? 380 : height >= 900 ? 220 : 160;
  const bodyWidth = Math.round(bodyHeight * 0.75);
  const glowSize = wide ? 360 : bodyHeight + 120;
  const glowColor = kind === 'win' ? colors.gold : kind === 'loss' ? colors.primary : '#FFFFFF';
  const speech = kind === 'win' ? bot.lines.onLose : kind === 'loss' ? bot.lines.onWin : bot.lines.onDraw;
  const titleColor = kind === 'win' ? colors.gold : kind === 'loss' ? colors.text : colors.textMuted;
  const moveNo = Math.max(1, Math.ceil(plies / 2));
  const history = botHistory(games, bot.id);
  const note = history ? historyNote(history) : null;

  // El motivo con el número de jugada (spec, sección «Derecha»).
  const how = (() => {
    switch (reason) {
      case 'game.reason.checkmate':
        return kind === 'win'
          ? t('result.checkmateWin', { n: moveNo, color: t(userColor === 'w' ? 'game.colorWhite' : 'game.colorBlack') })
          : t('result.checkmateLoss', { bot: bot.name, n: moveNo });
      case 'game.reason.stalemate':
        return t('result.stalemate', { n: moveNo });
      case 'game.reason.insufficient':
        return t('result.insufficient');
      case 'game.reason.threefold':
        return t('result.threefold');
      case 'game.reason.fifty':
        return t('result.fifty');
      case 'game.reason.resigned':
        return t('result.resigned', { n: moveNo });
      case 'game.reason.abandoned':
        return t('result.abandoned', { n: moveNo });
      case 'game.reason.agreed':
        return t('result.agreed');
      default:
        return t(reason);
    }
  })();

  // Fundido de la capa y una sola reacción del bot (0,7 a 1,2 s).
  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: reduced ? 0 : 250, useNativeDriver: true }).start();
    if (reduced) return;
    const hop = () =>
      Animated.sequence([
        Animated.timing(react, { toValue: 1, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(react, { toValue: 0, duration: 240, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]);
    const animation =
      kind === 'win'
        ? Animated.timing(react, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true })
        : kind === 'loss'
          ? Animated.sequence([hop(), hop()])
          : Animated.sequence([
              Animated.timing(react, { toValue: 1, duration: 500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
              Animated.timing(react, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            ]);
    animation.start();
    return () => animation.stop();
    // Solo al montar: es una reacción de una vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Posiciones para el vuelo de monedas (del bot a la pastilla), medidas en la ventana.
  useEffect(() => {
    if (reduced || coins <= 0 || pillLanded) return;
    const id = setTimeout(() => {
      measureWindow(layerRef.current, (lx, ly, lw) => {
        measureWindow(botRef.current, (bx, by, bw, bh) => {
          measureWindow(coinRef.current, (cx, cy, cw, ch) => {
            setCoords({
              from: { x: bx - lx + bw / 2, y: by - ly + bh * 0.45 },
              to: { x: cx - lx + cw / 2, y: cy - ly + ch / 2 },
              size: Math.max(320, lw * 0.6),
            });
          });
        });
      });
    }, 350);
    return () => clearTimeout(id);
  }, [reduced, coins, pillLanded]);

  // Escape cierra la capa en la web. El foco va al resultado.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') props.onClose();
    };
    window.addEventListener('keydown', onKey);
    const node = document.getElementById(COINS_TITLE_ID) as (HTMLElement & { tabIndex: number }) | null;
    if (node) {
      node.tabIndex = -1;
      node.style.setProperty('outline', 'none', 'important');
      node.style.setProperty('box-shadow', 'none', 'important');
      node.focus();
    }
    return () => window.removeEventListener('keydown', onKey);
  }, [props]);

  const onCoinsLanded = () => {
    setPillLanded(true);
    pulse.setValue(1);
    Animated.sequence([
      Animated.timing(pulse, { toValue: 1.12, duration: 90, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  };

  const bodyStyle =
    kind === 'win'
      ? {
          transform: [
            { translateY: react.interpolate({ inputRange: [0, 1], outputRange: [0, 10] }) },
            { rotate: react.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-4deg'] }) },
            { scale: react.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97] }) },
          ],
        }
      : kind === 'loss'
        ? { transform: [{ translateY: react.interpolate({ inputRange: [0, 1], outputRange: [0, -26] }) }] }
        : { transform: [{ rotate: react.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['-2deg', '2deg', '0deg'] }) }] };

  const botColumn = (
    <View style={[styles.botCol, !wide && styles.botColNarrow]}>
      <View style={styles.bubble}>
        <Text style={styles.bubbleText}>{speech}</Text>
      </View>
      <Svg width={24} height={13} viewBox="0 0 24 13" style={styles.tail}>
        <Path d="M0 0h24L12 13Z" fill="#FFFFFF" />
      </Svg>
      <View ref={botRef} style={[styles.stage, { height: bodyHeight + 70 }]}>
        <View style={[styles.glow, { width: glowSize, height: glowSize, top: (bodyHeight + 70 - glowSize) / 2, left: '50%' }]}>
          <BotGlow size={glowSize} color={glowColor} intensity={kind === 'draw' ? 0.16 : 0.3} />
        </View>
        <Animated.View style={[styles.bodyWrap, { width: bodyWidth, height: bodyHeight }, bodyStyle]}>
          <Image source={botBodySource(bot.id)} style={{ width: bodyWidth, height: bodyHeight }} resizeMode="contain" accessible accessibilityLabel={bot.name} />
        </Animated.View>
        <View style={[styles.floor, { width: bodyWidth * 0.58 }]} />
      </View>
    </View>
  );

  const pills = (
    <View style={styles.pills}>
      {coins > 0 && (
        <View
          ref={coinRef}
          onLayout={() => {}}
          style={[styles.pill, styles.pillCoins]}
          accessibilityLabel={t('result.coinsPill', { n: coins })}
        >
          <Animated.View style={[styles.pillContent, { transform: [{ scale: pulse }] }]}>
            <StatIcon name="coin" size={18} />
            <Text style={styles.pillCoinsText}>{t('result.coinsPill', { n: coins })}</Text>
          </Animated.View>
        </View>
      )}
      {dailyBonus > 0 && (
        <View style={[styles.pill, styles.pillDaily]}>
          <StatIcon name="coin" size={16} />
          <Text style={styles.pillDailyText}>{t('result.dailyPill', { n: dailyBonus })}</Text>
        </View>
      )}
      {streakRecovered ? (
        <View style={[styles.pill, styles.pillFlame]}>
          <StreakFlame state="recovering" size={18} />
          <Text style={styles.pillFlameText}>{t('result.streakRecovered')}</Text>
        </View>
      ) : (
        streak > 0 && (
          <View style={[styles.pill, styles.pillFlame]}>
            <StreakFlame state={streakLit ? 'lit' : 'ember'} size={18} />
            <Text style={styles.pillFlameText}>{tn('result.streakPill', streak)}</Text>
          </View>
        )
      )}
    </View>
  );

  const infoBlock = (
    <>
      <Text style={styles.kicker}>{t('result.match', { bot: bot.name, elo: number(bot.elo) })}</Text>
      <Text
        nativeID={COINS_TITLE_ID}
        accessibilityRole="header"
        aria-level={1}
        style={[styles.big, { color: titleColor }]}
      >
        {kind === 'win' ? t('game.win') : kind === 'loss' ? t('game.loss') : t('game.draw')}
      </Text>
      <Text style={styles.howText}>{how}</Text>
      {pills}
      {kind === 'win' && coins === 0 && !practiceCourse && <Text style={styles.coinsNote}>{t('game.coinsNote')}</Text>}

      {history && (
        <View style={styles.history}>
          <Text style={styles.historyMain}>
            {t('result.history', { bot: bot.name, wins: history.wins, losses: history.losses })}
            {history.draws > 0 ? ` · ${tn('result.history.drawsCount', history.draws)}` : ''}
          </Text>
          {note?.kind === 'wonLast' && <Text style={styles.historyNote}>{t('result.history.wonLast', { n: note.wins, m: note.total })}</Text>}
          {note?.kind === 'draws' && <Text style={styles.historyNote}>{tn('result.history.drawsCount', note.draws)}</Text>}
          {note?.kind === 'review' && <Text style={styles.historyNote}>{t('result.history.review')}</Text>}
        </View>
      )}
    </>
  );

  const actionsBlock = (
    <View style={styles.actions}>
      {plies > 0 && <Button3D label={t('result.review')} variant="primary" onPress={props.onReview} style={styles.actionWide} />}
      <Button3D
        label={practiceCourse ? t('result.rematchPractice') : t('result.rematch')}
        onPress={props.onRematch}
        style={[styles.actionHalf, !wide && styles.actionFull]}
      />
      <Button3D
        label={practiceCourse ? t('result.backToOpening') : t('result.otherBot')}
        onPress={props.onOtherBot}
        style={[styles.actionHalf, !wide && styles.actionFull]}
      />
      <Pressable onPress={props.onClose} accessibilityRole="button" style={styles.showBoard} hitSlop={8}>
        <Text style={styles.showBoardText}>{t('result.showBoard')}</Text>
      </Pressable>
    </View>
  );

  return (
    <Animated.View ref={layerRef} style={[styles.layer, { opacity: fade }]} role="dialog" aria-modal aria-label={t('result.match', { bot: bot.name, elo: number(bot.elo) })}>
      <Pressable onPress={props.onClose} accessibilityRole="button" accessibilityLabel={t('result.close')} hitSlop={10} style={styles.close}>
        <Text style={styles.closeGlyph}>✕</Text>
      </Pressable>

      {wide ? (
        <View style={[styles.inner, styles.innerWide]}>
          {botColumn}
          <View style={styles.right}>
            {infoBlock}
            {actionsBlock}
          </View>
        </View>
      ) : (
        <View style={styles.narrow}>
          <ScrollView contentContainerStyle={styles.narrowContent} showsVerticalScrollIndicator={false}>
            {botColumn}
            {infoBlock}
          </ScrollView>
          <View style={styles.narrowActions}>{actionsBlock}</View>
        </View>
      )}

      {coins > 0 && coords && !reduced && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <CoinReward
            boardSize={coords.size}
            orientation={userColor}
            amount={coins}
            from={coords.from}
            to={coords.to}
            hidePill
            onDone={onCoinsLanded}
          />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: BG, zIndex: 20, justifyContent: 'center' },
  close: { position: 'absolute', right: space.lg, top: space.lg, width: 44, height: 44, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  closeGlyph: { fontFamily: fonts.extrabold, fontSize: type.title, color: colors.textMuted },
  inner: { width: '100%', maxWidth: 980, alignSelf: 'center', paddingHorizontal: space.lg, gap: space.lg },
  innerWide: { flexDirection: 'row', alignItems: 'center', gap: 36 },
  // Celular: el contenido se desplaza y los botones quedan fijos al pie (spec, «Celular»).
  narrow: { flex: 1, paddingTop: 56 },
  narrowContent: { paddingHorizontal: space.lg, gap: space.md, paddingBottom: space.lg },
  narrowActions: { paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.md, backgroundColor: BG },
  botCol: { width: 420, alignItems: 'center', flexShrink: 0 },
  botColNarrow: { width: '100%' },
  bubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 18,
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 5 },
    maxWidth: 420,
  },
  bubbleText: { fontFamily: fonts.extrabold, fontSize: type.body, color: colors.bg, textAlign: 'center', lineHeight: 22 },
  tail: { marginTop: -1 },
  stage: { width: '100%', alignItems: 'center', justifyContent: 'flex-end', position: 'relative' },
  glow: { position: 'absolute' },
  bodyWrap: { alignItems: 'center', justifyContent: 'flex-end' },
  floor: { height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.35)', marginTop: -14 },
  right: { flex: 1, minWidth: 0 },
  kicker: { fontFamily: fonts.extrabold, fontSize: type.caption, color: colors.primary, letterSpacing: 0.6, textTransform: 'uppercase' },
  big: { fontFamily: fonts.extrabold, fontSize: 46, lineHeight: 52, marginTop: 4 },
  howText: { fontFamily: fonts.semibold, fontSize: type.body, color: colors.textMuted, marginTop: 6, marginBottom: space.lg, lineHeight: 22 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: space.lg },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, borderWidth: 2, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: 'rgba(38,36,33,0.8)' },
  pillContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pillCoins: { borderColor: colors.gold },
  pillCoinsText: { fontFamily: fonts.extrabold, fontSize: type.body, color: colors.gold },
  pillDaily: { borderColor: 'rgba(255,255,255,0.12)' },
  pillDailyText: { fontFamily: fonts.extrabold, fontSize: type.body, color: colors.text },
  pillFlame: { borderColor: FLAME },
  pillFlameText: { fontFamily: fonts.extrabold, fontSize: type.body, color: FLAME },
  coinsNote: { fontFamily: fonts.semibold, fontSize: type.secondary, color: colors.textMuted, marginTop: -8, marginBottom: space.lg },
  history: { marginBottom: space.lg, gap: 2 },
  historyMain: { fontFamily: fonts.extrabold, fontSize: type.body, color: colors.text },
  historyNote: { fontFamily: fonts.semibold, fontSize: type.secondary, color: colors.textMuted },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionWide: { width: '100%' },
  actionHalf: { flexGrow: 1, flexBasis: '45%' },
  actionFull: { flexBasis: '100%' },
  showBoard: { alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 12 },
  showBoardText: { fontFamily: fonts.bold, fontSize: type.secondary, color: colors.textMuted },
});
