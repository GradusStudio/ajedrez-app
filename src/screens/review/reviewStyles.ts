import { StyleSheet } from 'react-native';
import { type, colors, fonts, radius, space } from '../../theme';

/** Estilos que siguen usando la pantalla de revisión y sus piezas (Analizando, barra, tira y hoja). */
export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingHorizontal: space.lg, paddingBottom: space.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.extrabold, fontSize: type.title, color: colors.text },
  muted: { fontFamily: fonts.semibold, fontSize: type.secondary, color: colors.textMuted },
  analyzing: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.text },

  // Barra superior: BackButton + engranaje redondo
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.md },
  gear: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    borderBottomWidth: 4,
    borderBottomColor: colors.surfaceShadow,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  // Gráfico
  graph: { alignSelf: 'center', backgroundColor: '#403D39', borderRadius: radius.bar, overflow: 'hidden' },

  // Tira de jugadas del celular
  strip: { flexDirection: 'row', alignItems: 'center', marginTop: space.md },
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
  moveNo: { fontFamily: fonts.bold, fontSize: type.secondary, color: colors.textMuted },
  moveBadge: { fontFamily: fonts.extrabold, fontSize: type.secondary },
  moveText: { fontFamily: fonts.bold, fontSize: type.body, color: colors.textMuted },

  // Hoja inferior
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
  sectionTitle: { fontFamily: fonts.extrabold, fontSize: type.body, color: colors.text, marginBottom: space.sm },
  coachPick: { alignItems: 'center', width: 72, paddingVertical: 6, borderRadius: radius.control, borderWidth: 2, borderColor: 'transparent' },
  coachPickOn: { borderColor: colors.primary, backgroundColor: colors.surfaceRaised },
  coachName: { fontFamily: fonts.bold, fontSize: type.caption, color: colors.textMuted, marginTop: 2 },
});
