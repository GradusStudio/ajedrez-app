// Tokens de design.md. Cualquier pantalla o componente nuevo debe usar estos valores.

export const colors = {
  primary: '#81B64C',
  primaryShadow: '#45753C',
  gold: '#F7C631',
  danger: '#FA412D',
  dangerShadow: '#A02A1E',

  bg: '#262421',
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

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

// Nombres de fuente de @expo-google-fonts/nunito
export const fonts = {
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extrabold: 'Nunito_800ExtraBold',
} as const;

// Temas del tablero (Ajustes > Tema del tablero). "verde" es el de design.md.
export const boardThemes = {
  verde: { name: 'Verde', light: '#EBECD0', dark: '#779556' },
  marron: { name: 'Marrón', light: '#F0D9B5', dark: '#B58863' },
  azul: { name: 'Azul', light: '#DEE3E6', dark: '#8CA2AD' },
  gris: { name: 'Gris', light: '#E3E3E3', dark: '#969696' },
  morado: { name: 'Morado', light: '#EAE3F2', dark: '#9C83B8' },
  // Con textura (assets/texturas, ver src/pieces/textures.ts). Los colores son el promedio de la textura:
  // sirven de respaldo, para las coordenadas y para la vista previa.
  madera: { name: 'Madera', light: '#E0BE8A', dark: '#7A4A2A', texture: 'madera' },
  marmol: { name: 'Mármol', light: '#E8E6E1', dark: '#2F5A44', texture: 'marmol' },
  hielo: { name: 'Hielo', light: '#91B1C7', dark: '#265E73', texture: 'hielo' },
  magma: { name: 'Magma', light: '#6D3F2F', dark: '#362A2A', texture: 'magma' },
} as const satisfies Record<string, { name: string; light: string; dark: string; texture?: string }>;
export type BoardThemeId = keyof typeof boardThemes;
/** Tema del tablero con textura: `texture` es el estilo de material (`MaterialSetId`). */
export const boardTexture = (id: BoardThemeId): string | undefined => (boardThemes[id] as { texture?: string }).texture;

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
} as const;
