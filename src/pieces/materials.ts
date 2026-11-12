import { PIECE_SET_META, PieceKey, PieceSetId } from './pieceSets';

// Neón y vintage quedaron fuera por ahora (sus texturas siguen en assets/texturas y los textos en i18n).
// Sets de piezas "de material": usan las siluetas del Clásico y las rellenan con una textura.
// Las texturas (generadas con ComfyUI, ver docs/design.md) se cargan en `textures.ts`.
export type MaterialSetId = 'madera' | 'marmol' | 'hielo' | 'magma';
export type AnyPieceSetId = PieceSetId | MaterialSetId;

// `winter`: suma nieve, carámbanos y un copo (winter.ts). `outline`: contorno de las piezas blancas. `rim`: filo fino alrededor de las negras (separa la pieza de una casilla oscura).
export const MATERIAL_SETS: Record<MaterialSetId, { outline: string; rim: string; winter?: boolean }> = {
  madera: { outline: '#3B2412', rim: '#C89A5E' },
  marmol: { outline: '#2A2A2A', rim: '#D8C48A' },
  hielo: { outline: '#14304A', rim: '#9FD8F2', winter: true },
  magma: { outline: '#3A0F02', rim: '#FF9A4D' },
};

export const isMaterialSet = (id: string): id is MaterialSetId => id in MATERIAL_SETS;

/** Set cuyas siluetas se usan para dibujar `id`. */
export const pathSetOf = (id: AnyPieceSetId): PieceSetId => (isMaterialSet(id) ? 'clasico' : id);

/**
 * Ids de los recortes SVG (silueta y tinta) de una pieza. Dependen solo del trazado: el set de siluetas y el
 * tipo de pieza. Todos los sets de material comparten los trazados del Clásico, así que pueden repetir ids entre
 * sí sin problema. Hace falta que sean distintos por tipo: en la web los SVG de toda la pantalla comparten el
 * documento y `url(#id)` toma el primer elemento con ese id, por eso antes todas las piezas se recortaban con la
 * silueta del rey (la primera que se dibujaba).
 */
export const pieceClipIds = (id: AnyPieceSetId, key: PieceKey): { sil: string; ink: string } => {
  const base = `${pathSetOf(id)}-${key}`;
  return { sil: `sil-${base}`, ink: `ink-${base}` };
};

export const PIECE_SET_LIST: { id: AnyPieceSetId }[] = [
  ...PIECE_SET_META,
  ...(Object.keys(MATERIAL_SETS) as MaterialSetId[]).map((id) => ({ id })),
];

export const isAnyPieceSetId = (v: string | null): v is AnyPieceSetId => !!v && PIECE_SET_LIST.some((m) => m.id === v);
