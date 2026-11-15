// Tokens de design.md. Cualquier pantalla o componente nuevo debe usar estos valores.

export const colors = {
  primary: '#81B64C',
  primaryShadow: '#45753C',
  gold: '#F7C631',
  flame: '#F5912F',
  danger: '#FA412D',
  dangerShadow: '#A02A1E',

  bg: '#262421',
  // Fondo de la app (luz cálida, viñeta y base): ver AppBackground.tsx. `bg` queda para los textos
  // oscuros sobre verde y para la barra del sistema.
  bgTop: '#2A2724',
  bgBottom: '#1D1B19',
  lamp: 'rgba(255, 196, 128, 0.13)',
  cardTop: 'rgba(60, 58, 55, 0.78)',
  cardBottom: 'rgba(48, 46, 43, 0.78)',
  cardBorder: 'rgba(255, 255, 255, 0.07)',
  cardShadow: 'rgba(0, 0, 0, 0.28)',
  surface: '#302E2B',
  surfaceRaised: '#3C3A37',
  surfaceShadow: '#2B2926',
  outline: '#5A5753',
  text: '#FFFFFF',
  textMuted: '#C3C2C1',

  correctBg: '#3F5A2A',
  incorrectBg: '#5A2A26',

  boardLight: '#EBECD0',
  boardDark: '#779556',
} as const;

export const radius = {
  control: 16,
  bar: 8,
} as const;

// Relieve de tarjeta del fondo nuevo (spec del feedback del tester, sección 1): composición plana del
// mismo degradé de CardSurface, para estilos de tarjeta que no pueden envolverse en el componente.
export const cardSkin = {
  backgroundColor: 'rgba(60, 58, 55, 0.78)',
  borderColor: 'rgba(255, 255, 255, 0.07)',
  shadowColor: '#000000',
  shadowOpacity: 0.28,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 10 },
  elevation: 6,
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

// Nombres de fuente de @expo-google-fonts/nunito
export const fonts = {
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extrabold: 'Nunito_800ExtraBold',
} as const;

// Escala de letra (feedback del primer tester, 14-11-2026): tokens semánticos. En el celular y en
// la web angosta conservan los tamaños de siempre; en la web ancha (960 px o más al cargar) suben
// según typeScale.web.ts. En la web ancha no queda texto por debajo de 13 px.
export { type } from './typeScale';
export type { TypeRole } from './typeScale';

// Temas del tablero (Ajustes > Tema del tablero). "verde" es el de design.md.
export const boardThemes = {
  verde: { name: 'Verde', light: '#EBECD0', dark: '#779556' },
  marron: { name: 'Marrón', light: '#F0D9B5', dark: '#B58863' },
  azul: { name: 'Azul', light: '#DEE3E6', dark: '#8CA2AD' },
  gris: { name: 'Gris', light: '#E3E3E3', dark: '#969696' },
  morado: { name: 'Morado', light: '#EAE3F2', dark: '#9C83B8' },
  // Con textura (assets/texturas, ver src/pieces/textures.ts). Los colores son el promedio de las texturas
  // nuevas (15-11-2026): sirven de respaldo mientras cargan, para las coordenadas y para la vista previa.
  madera: { name: 'Madera', light: '#D3B18B', dark: '#79583F', texture: 'madera' },
  marmol: { name: 'Mármol', light: '#CCCBCE', dark: '#56575C', texture: 'marmol' },
  hielo: { name: 'Hielo', light: '#91B1C7', dark: '#265E73', texture: 'hielo' },
  // `label`: color propio de las coordenadas cuando el del tema no llega a 3:1 sobre las dos casillas.
  // `seams`: lava dibujada en las juntas del tablero (BoardSeams), solo magma.
  magma: { name: 'Magma', light: '#7D7D7F', dark: '#454547', texture: 'magma', label: '#F2F2F2', seams: true },
} as const satisfies Record<string, { name: string; light: string; dark: string; texture?: string; label?: string; seams?: boolean }>;
export type BoardThemeId = keyof typeof boardThemes;
/** Tema del tablero con textura: `texture` es el estilo de material (`MaterialSetId`). */
export const boardTexture = (id: BoardThemeId): string | undefined => (boardThemes[id] as { texture?: string }).texture;
/** Color de las coordenadas: el propio del tema o el complemento de la casilla. */
export const boardLabel = (id: BoardThemeId, light: boolean): string => {
  const theme = boardThemes[id] as { light: string; dark: string; label?: string };
  return theme.label ?? (light ? theme.dark : theme.light);
};
/** El tablero dibuja la lava de las juntas (solo magma). */
export const boardSeams = (id: BoardThemeId): boolean => !!(boardThemes[id] as { seams?: boolean }).seams;

// Resaltados del tablero (sección 5 de design.md)
export const boardHighlight = {
  lastMove: 'rgba(247, 198, 49, 0.4)',
  selected: 'rgba(247, 198, 49, 0.6)',
  legalMove: 'rgba(129, 182, 76, 0.6)',
  check: 'rgba(250, 65, 45, 0.4)',
  mark: 'rgba(247, 198, 49, 0.7)', // casilla resaltada en una explicación
  markBorder: '#F7C631',
  pick: 'rgba(79, 163, 224, 0.7)', // casilla tocada por el usuario antes de comprobar
  pickBorder: '#4FA3E0',
  dragOver: 'rgba(255, 255, 255, 0.75)', // casilla bajo la pieza que se arrastra
  mate: 'rgba(250, 65, 45, 0.92)', // rey vencido en jaque mate (casi lleno: tiene que verse sobre cualquier tablero)
  mateEscape: 'rgba(250, 65, 45, 0.55)', // casillas vacías alrededor del rey vencido (no puede escapar)
} as const;
