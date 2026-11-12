import { ImageSourcePropType } from 'react-native';
import { MaterialSetId } from './materials';

// Texturas de los estilos de material (256 × 256, generadas con ComfyUI; originales en assets/fuente/texturas).
// Cada estilo sirve para el tablero (casillas) y para las piezas.
export type MaterialTextures = {
  light: ImageSourcePropType;
  dark: ImageSourcePropType;
  white: ImageSourcePropType;
  black: ImageSourcePropType;
};

export const TEXTURES: Record<MaterialSetId, MaterialTextures> = {
  madera: {
    light: require('../../assets/texturas/madera-casilla-clara.webp'),
    dark: require('../../assets/texturas/madera-casilla-oscura.webp'),
    white: require('../../assets/texturas/madera-pieza-blanca.webp'),
    black: require('../../assets/texturas/madera-pieza-negra.webp'),
  },
  // Las piezas usan una versión aclarada (blancas) u oscurecida (negras) de la misma piedra,
  // con contraste local (CLAHE): las vetas se ven sin que la pieza se camufle con la casilla.
  marmol: {
    light: require('../../assets/texturas/marmol-casilla-clara.webp'),
    dark: require('../../assets/texturas/marmol-casilla-oscura.webp'),
    white: require('../../assets/texturas/marmol-pieza-blanca.webp'),
    black: require('../../assets/texturas/marmol-pieza-negra.webp'),
  },
  hielo: {
    light: require('../../assets/texturas/hielo-casilla-clara.webp'),
    dark: require('../../assets/texturas/hielo-casilla-oscura.webp'),
    white: require('../../assets/texturas/hielo-pieza-blanca.webp'),
    black: require('../../assets/texturas/hielo-pieza-negra.webp'),
  },
  magma: {
    light: require('../../assets/texturas/magma-casilla-clara.webp'),
    dark: require('../../assets/texturas/magma-casilla-oscura.webp'),
    white: require('../../assets/texturas/magma-pieza-blanca.webp'),
    black: require('../../assets/texturas/magma-pieza-negra.webp'),
  },
};
