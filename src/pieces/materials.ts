import { PIECE_SET_META, PieceKey, PieceSetId, PathSetId } from './pieceSets';

// Neón y vintage quedaron fuera por ahora (sus texturas siguen en assets/texturas y los textos en i18n).
// Sets de piezas "de material": usan las siluetas del Clásico y las rellenan con una textura.
// Las texturas (generadas con ComfyUI, ver docs/design.md) se cargan en `textures.ts`.
export type MaterialSetId = 'madera' | 'marmol' | 'hielo' | 'magma';
export type AnyPieceSetId = PieceSetId | MaterialSetId;

// `winter`: suma nieve, carámbanos y un copo (winter.ts). `volcano`: lava, grietas, gotas y brasas (volcano.ts).
// `outline`: contorno de las piezas blancas. `rim`: filo alrededor de las negras (separa la pieza de una casilla oscura);
// `rimStrong` lo engrosa y lo deja opaco (magma).
export const MATERIAL_SETS: Record<
  MaterialSetId,
  { outline: string; rim: string; winter?: boolean; volcano?: boolean; rimStrong?: boolean }
> = {
  madera: { outline: '#3B2412', rim: '#C89A5E' },
  marmol: { outline: '#2A2A2A', rim: '#D8C48A' },
  hielo: { outline: '#14304A', rim: '#9FD8F2', winter: true },
  magma: { outline: '#3A0F02', rim: '#FF9A4D', volcano: true, rimStrong: true },
};

export const isMaterialSet = (id: string): id is MaterialSetId => id in MATERIAL_SETS;

/**
 * Set cuyas siluetas se usan para dibujar `id`: madera, mármol y magma tienen las suyas; hielo sigue
 * con las del Clásico (decisión del autor: el hielo no se toca).
 */
export const pathSetOf = (id: AnyPieceSetId): PathSetId => {
  if (id === 'madera' || id === 'marmol' || id === 'magma') return id;
  return isMaterialSet(id) ? 'clasico' : id;
};

/**
 * Ids de los recortes SVG (silueta y tinta) de una pieza. Dependen del trazado (set de siluetas y tipo de pieza)
 * y, si se indica, de la instancia: en la web los SVG comparten el documento y `url(#id)` no se resuelve igual
 * con ids repetidos en Safari, así que cada pieza les agrega su propio sufijo.
 */
export const pieceClipIds = (id: AnyPieceSetId, key: PieceKey, instance = ''): { sil: string; ink: string } => {
  const base = `${pathSetOf(id)}-${key}${instance ? `-${instance}` : ''}`;
  return { sil: `sil-${base}`, ink: `ink-${base}` };
};

export const PIECE_SET_LIST: { id: AnyPieceSetId }[] = [
  ...PIECE_SET_META,
  ...(Object.keys(MATERIAL_SETS) as MaterialSetId[]).map((id) => ({ id })),
];

export const isAnyPieceSetId = (v: string | null): v is AnyPieceSetId => !!v && PIECE_SET_LIST.some((m) => m.id === v);
