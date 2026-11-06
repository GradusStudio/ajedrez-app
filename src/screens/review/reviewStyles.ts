import { StyleSheet } from 'react-native';
import { colors, fonts, radius, space } from '../../theme';

const BUBBLE_H = 118; // alto fijo del globo: así el tablero nunca se mueve (3 líneas de texto y el resto se desliza)

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.lg, paddingBottom: space.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  back: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted, marginBottom: space.md },
  title: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.text },
  muted: { fontFamily: fonts.semibold, fontSize: 14, color: colors.textMuted },
  analyzing: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.text },

  // Barra superior: volver · título · ajustes
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.md },
  topBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  topTitle: { flex: 1, textAlign: 'center', fontFamily: fonts.extrabold, fontSize: 20, color: colors.text },

  // Comentarista
  coachRow: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  bubble: {
    flex: 1,
    height: BUBBLE_H,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
  },
  bubbleContent: { padding: space.md },
  bubbleHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: 4 },
  bubbleTitle: { flex: 1, fontFamily: fonts.extrabold, fontSize: 15, color: colors.text },
  bubbleText: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: colors.textMuted },
  bubbleExplain: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: colors.text, marginTop: 6 },
  miniBadge: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  miniBadgeText: { fontFamily: fonts.extrabold, fontSize: 11, color: '#FFFFFF' },
  evalChip: { backgroundColor: '#F2F2F2', borderRadius: 6, paddingVertical: 2, paddingHorizontal: 6 },
  evalChipText: { fontFamily: fonts.extrabold, fontSize: 12, color: colors.bg },

  // Resumen
  graph: { alignSelf: 'center', backgroundColor: '#403D39', borderRadius: radius.bar, overflow: 'hidden' },
  players: { flexDirection: 'row', gap: space.md, marginTop: space.lg },
  playerCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingVertical: space.md,
    paddingHorizontal: space.sm,
  },
  playerCardMe: { borderColor: colors.primary },
  playerName: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.text, maxWidth: '100%' },
  accBox: { marginTop: space.sm, backgroundColor: '#F2F2F2', borderRadius: radius.bar, paddingVertical: 4, paddingHorizontal: 14 },
  accNum: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.bg },
  accLabel: { fontFamily: fonts.bold, fontSize: 12, color: colors.textMuted, marginTop: 4 },
  catTable: { marginTop: space.lg, backgroundColor: colors.surface, borderRadius: radius.control, paddingVertical: space.sm, paddingHorizontal: space.md },
  catRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  catLabel: { flex: 1, fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  catCount: { width: 48, textAlign: 'center', fontFamily: fonts.extrabold, fontSize: 17, color: colors.outline },
  catIcon: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  catGlyph: { fontFamily: fonts.extrabold, fontSize: 12, color: '#FFFFFF' },

  // Tira de jugadas
  strip: { flexDirection: 'row', alignItems: 'center', marginTop: space.md },
  stripEnds: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  endBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  stripArrow: { width: 32, height: 40, alignItems: 'center', justifyContent: 'center' },
  stripContent: { gap: 6, paddingHorizontal: 4, alignItems: 'center' },
  moveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  moveChipCurrent: { backgroundColor: colors.primaryShadow, borderColor: colors.primary },
  moveNo: { fontFamily: fonts.bold, fontSize: 13, color: colors.textMuted },
  moveBadge: { fontFamily: fonts.extrabold, fontSize: 13 },
  moveText: { fontFamily: fonts.bold, fontSize: 15, color: colors.textMuted },

  // Barra inferior
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.lg,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceRaised,
  },
  tool: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: 4 },
  toolLabel: { fontFamily: fonts.bold, fontSize: 11, color: colors.textMuted },

  // Ajustes (hoja inferior)
  modalRoot: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    maxHeight: '85%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
  },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.md },
  sheetTitle: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.text },
  sectionTitle: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.text, marginBottom: space.sm },
  hlRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.sm },
  hlArrow: { fontFamily: fonts.extrabold, fontSize: 28, color: colors.text, paddingHorizontal: space.lg },
  hlText: { fontFamily: fonts.bold, fontSize: 13, color: colors.textMuted },
  coachPick: { alignItems: 'center', width: 72, paddingVertical: 6, borderRadius: radius.control, borderWidth: 2, borderColor: 'transparent' },
  coachPickOn: { borderColor: colors.primary, backgroundColor: colors.surfaceRaised },
  coachName: { fontFamily: fonts.bold, fontSize: 11, color: colors.textMuted, marginTop: 2 },
});
