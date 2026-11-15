import React, { useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View, type ViewStyle } from 'react-native';
import { BackButton } from '../components/BackButton';
import { Board } from '../components/Board';
import { BoardSizeContext } from '../components/BoardSizeContext';
import { Button3D } from '../components/Button3D';
import { CardSurface } from '../components/CardSurface';
import { ColumnScrollView } from '../components/ColumnScrollView';
import { showDialog } from '../components/dialog';
import Piece from '../components/Piece';
import { Segmented } from '../components/Segmented';
import { SquareTexture } from '../components/SquareTexture';
import { StatIcon } from '../components/StatIcon';
import { statusBarTop } from '../components/statusBarTop';
import { Tip } from '../components/Tip';
import { useWideLayout } from '../components/useWideLayout';
import { useI18n } from '../i18n/I18nContext';
import type { MessageKey } from '../i18n/es';
import type { AnyPieceSetId } from '../pieces/materials';
import { previewAction, previewCombo, shopItems, type ShopContext, type ShopItem } from '../pieces/shopView';
import { SAMPLE_FEN } from '../pieces/sampleFen';
import { useProgress } from '../progress/ProgressContext';
import { PieceSetOverride, usePieceSet } from '../settings/PieceSetContext';
import { useSettings } from '../settings/SettingsContext';
import { TIP_MESSAGES } from '../settings/tips';
import { useBoardTheme } from '../settings/useBoardTheme';
import { useTips } from '../settings/useTips';
import { boardThemes, cardSkin, type, colors, fonts, radius, space } from '../theme';
import type { BoardThemeId } from '../theme';

export type ShopTab = 'boards' | 'pieces';

/**
 * Tienda única (spec de la tienda y la barra, sección 3): vista previa de la combinación, selector Tableros/Piezas,
 * grilla con estados y compra con confirmación. Los precios y el guardado son los de pieces/shop.ts.
 */
export function ShopScreen({ tab, onTab, onBack }: { tab: ShopTab; onTab: (tab: ShopTab) => void; onBack: () => void }) {
  const { progress, buyBoardTheme, buyPieceSet } = useProgress();
  const { pieceSet, setPieceSet } = usePieceSet();
  const { update } = useSettings();
  const boardTheme = useBoardTheme();
  const { t, number } = useI18n();
  const wide = useWideLayout();
  const { width } = useWindowDimensions();
  const tips = useTips(['shop']);
  const tipMessage = tips.current ? TIP_MESSAGES[tips.current] : null;
  const gridRef = useRef<React.ComponentRef<typeof View>>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const kind = tab === 'boards' ? 'board' : 'set';
  const ctx: ShopContext = {
    coins: progress.coins,
    boughtBoards: progress.boardThemes,
    boughtSets: progress.pieceSets,
    boardInUse: boardTheme,
    setInUse: pieceSet,
  };
  const items = shopItems(kind, ctx);
  const combo = previewCombo(kind, selected, ctx);
  const action = previewAction(kind, selected, ctx);
  const previewSize = wide ? 340 : Math.min(width - 60, 480);
  // En la web ancha la vista previa queda fija mientras se recorre la grilla.
  const sticky = wide && Platform.OS === 'web' ? ({ position: 'sticky', top: space.lg } as unknown as ViewStyle) : null;

  const boardName = (id: string) => t(`boardTheme.${id}` as MessageKey);
  const setName = (id: string) => t(`pieceSet.${id}.name` as MessageKey);
  const nameOf = (k: 'board' | 'set', id: string) => (k === 'board' ? boardName(id) : setName(id));

  const stateText = (item: ShopItem): string => {
    const s = item.state;
    if (s.kind === 'inUse') return t('shop.state.inUse');
    if (s.kind === 'free') return t('shop.state.free');
    if (s.kind === 'owned') return t('shop.state.owned');
    if (s.kind === 'affordable') return t('shop.buyFor', { price: item.price });
    return t('shop.state.short', { price: item.price, missing: s.missing });
  };

  const applySelected = () => {
    if (!selected) return;
    if (kind === 'board') update({ boardTheme: selected as BoardThemeId });
    else setPieceSet(selected as AnyPieceSetId);
    setSelected(null);
  };

  const buySelected = () => {
    const id = selected;
    const current = action;
    if (!id || !current || current.type !== 'buy') return;
    showDialog(
      t(kind === 'board' ? 'shop.buy.title.board' : 'shop.buy.title.set', { name: nameOf(kind, id) }),
      t('shop.buy.message', { price: current.price, left: current.left }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('shop.buy.confirm'),
          onPress: () => {
            const ok = kind === 'board' ? buyBoardTheme(id, current.price) : buyPieceSet(id, current.price);
            if (!ok) return;
            if (kind === 'board') update({ boardTheme: id as BoardThemeId });
            else setPieceSet(id as AnyPieceSetId);
            setSelected(null);
          },
        },
      ]
    );
  };

  const cap = action
    ? t(kind === 'board' ? 'shop.preview.board' : 'shop.preview.set', { name: nameOf(kind, selected ?? '') })
    : t('shop.inUse', { board: boardName(combo.board), set: setName(combo.set) });

  return (
    <ColumnScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: statusBarTop(space.sm) }]}
    >
      <View style={styles.inner}>
        <BackButton screen={t('home.back')} label={t('home.back')} onPress={onBack} />
        <View style={styles.titleRow}>
          <Text accessibilityRole="header" aria-level={1} style={styles.title}>{t('shop.title')}</Text>
          {!wide && (
            <View style={styles.balanceChip} accessible accessibilityLabel={t('pieces.balance', { n: progress.coins })}>
              <StatIcon name="coin" size={20} />
              <Text style={styles.balanceChipText}>{number(progress.coins)}</Text>
            </View>
          )}
        </View>
        <Text style={styles.lead}>{t('shop.lead')}</Text>

        <View style={wide ? styles.cols : undefined}>
          <View style={[styles.left, wide && styles.leftWide, sticky]}>
            <CardSurface style={styles.previewCard} radius={20}>
              <View style={styles.boardWrap}>
                <BoardSizeContext.Provider value={previewSize}>
                  <PieceSetOverride id={combo.set}>
                    <Board fen={SAMPLE_FEN} orientation="w" interactive={false} themeOverride={combo.board} />
                  </PieceSetOverride>
                </BoardSizeContext.Provider>
              </View>
              <Text style={styles.cap}>{cap}</Text>
              {action && (
                <View style={styles.actions}>
                  <Button3D label={t('shop.back')} variant="secondary" onPress={() => setSelected(null)} style={{ flex: 1 }} />
                  {action.type === 'use' ? (
                    <Button3D label={t('shop.use')} variant="primary" onPress={applySelected} style={{ flex: 2 }} />
                  ) : action.type === 'buy' ? (
                    <Button3D label={t('shop.buyFor', { price: action.price })} variant="primary" onPress={buySelected} style={{ flex: 2 }} />
                  ) : (
                    <View style={styles.shortBtn}>
                      <Text style={styles.shortBtnText}>{t('shop.short', { missing: action.missing })}</Text>
                    </View>
                  )}
                </View>
              )}
            </CardSurface>
            {wide && (
              <CardSurface style={styles.wallet} radius={20}>
                <View style={styles.walletRow}>
                  <StatIcon name="coin" size={28} />
                  <Text style={styles.walletNumber}>{number(progress.coins)}</Text>
                </View>
                <Text style={styles.walletHow}>{t('shop.balanceHow')}</Text>
              </CardSurface>
            )}
          </View>

          <View style={styles.right}>
            <Segmented
              options={[
                { value: 'boards', label: t('boards.title') },
                { value: 'pieces', label: t('pieces.title') },
              ]}
              value={tab}
              onChange={(next) => {
                setSelected(null);
                onTab(next);
              }}
            />
            <View ref={gridRef} style={styles.grid}>
              {items.map((item) => {
                const inUseNow = item.id === (kind === 'board' ? boardTheme : pieceSet);
                const marked = selected ? selected === item.id : inUseNow;
                const state = stateText(item);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setSelected(item.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: marked }}
                    accessibilityLabel={t(kind === 'board' ? 'shop.item.board' : 'shop.item.set', {
                      name: nameOf(kind, item.id),
                      state,
                    })}
                    style={[styles.item, wide ? styles.itemWide : styles.itemNarrow, marked && styles.itemSelected]}
                  >
                    {kind === 'board' ? (
                      <BoardThumb id={item.id as BoardThemeId} />
                    ) : (
                      <SetThumb id={item.id as AnyPieceSetId} board={boardTheme} />
                    )}
                    <Text style={styles.itemName}>{nameOf(kind, item.id)}</Text>
                    {item.state.kind === 'affordable' ? (
                      <View style={styles.itemPrice}>
                        <StatIcon name="coin" size={15} />
                        <Text style={styles.itemPriceText}>{item.price}</Text>
                      </View>
                    ) : (
                      <Text style={[styles.itemState, item.state.kind === 'inUse' && styles.itemStateInUse]}>{state}</Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <Tip
          visible={!!tips.current}
          title={tipMessage ? t(tipMessage.title) : ''}
          text={tipMessage ? t(tipMessage.text) : ''}
          target={gridRef}
          onNext={tips.next}
          onClose={tips.close}
        />
      </View>
    </ColumnScrollView>
  );
}

function BoardThumb({ id }: { id: BoardThemeId }) {
  const theme = boardThemes[id];
  return (
    <View style={styles.thumbBoard}>
      {Array.from({ length: 8 }, (_, i) => {
        const light = (Math.floor(i / 4) + (i % 4)) % 2 === 0;
        return (
          <View key={i} style={styles.thumbCell}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: light ? theme.light : theme.dark }]} />
            <SquareTexture theme={id} light={light} size={64} seed={i} />
          </View>
        );
      })}
    </View>
  );
}

function SetThumb({ id, board }: { id: AnyPieceSetId; board: BoardThemeId }) {
  const theme = boardThemes[board];
  const pieces = [
    { type: 'k', color: 'w' },
    { type: 'q', color: 'b' },
    { type: 'n', color: 'w' },
  ] as const;
  return (
    <View style={styles.thumbPieces}>
      {pieces.map((p, i) => {
        const light = i % 2 === 0;
        return (
          <View key={p.type} style={[styles.thumbPieceCell, { backgroundColor: light ? theme.light : theme.dark }]}>
            <SquareTexture theme={board} light={light} size={64} seed={i} />
            <Piece type={p.type} color={p.color} size={44} set={id} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  inner: { width: '100%' },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  title: { fontFamily: fonts.extrabold, fontSize: type.title, color: colors.text },
  balanceChip: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  balanceChipText: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.gold },
  lead: { fontFamily: fonts.bold, fontSize: type.secondary, color: colors.textMuted, marginTop: 2, marginBottom: space.lg },
  cols: { flexDirection: 'row', gap: space.xxl, alignItems: 'flex-start' },
  left: { width: '100%', gap: space.lg },
  leftWide: { width: 372, flexShrink: 0 },
  previewCard: { padding: space.md, gap: space.md },
  boardWrap: { alignItems: 'center' },
  cap: { fontFamily: fonts.bold, fontSize: type.secondary, color: colors.textMuted, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: space.sm },
  shortBtn: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    paddingVertical: 12,
    paddingHorizontal: 18,
    opacity: 0.7,
  },
  shortBtnText: { fontFamily: fonts.extrabold, fontSize: type.button, color: colors.textMuted, textAlign: 'center' },
  wallet: { padding: space.lg, gap: space.sm },
  walletRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  walletNumber: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.gold },
  walletHow: { fontFamily: fonts.semibold, fontSize: type.caption, color: colors.textMuted },
  right: { flex: 1, minWidth: 0 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginTop: space.lg },
  item: { ...cardSkin, borderRadius: 18, borderWidth: 2, padding: space.sm, gap: 10 },
  itemWide: { flexGrow: 1, flexBasis: '30%' },
  itemNarrow: { flexGrow: 1, flexBasis: '46%' },
  itemSelected: { borderColor: colors.gold },
  itemName: { fontFamily: fonts.extrabold, fontSize: type.body, color: colors.text },
  itemState: { fontFamily: fonts.bold, fontSize: type.secondary, color: colors.textMuted, minHeight: 20 },
  itemStateInUse: { color: colors.primary },
  itemPrice: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 20 },
  itemPriceText: { fontFamily: fonts.extrabold, fontSize: type.secondary, color: colors.gold },
  thumbBoard: { flexDirection: 'row', flexWrap: 'wrap', width: '100%', aspectRatio: 1.6, borderRadius: 12, overflow: 'hidden' },
  thumbCell: { width: '25%', height: '50%' },
  thumbPieces: { flexDirection: 'row', width: '100%', aspectRatio: 1.6, borderRadius: 12, overflow: 'hidden' },
  thumbPieceCell: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center' },
});
