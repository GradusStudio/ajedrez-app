import { isWideWidth } from './components/wideLayout';

// Escala de letra de la web (feedback del primer tester, 14-11-2026). Se fija al cargar: con la
// ventana en 960 px o más la letra sube; si después cambia el ancho, se ve la escala elegida al cargar.
const wide = typeof window !== 'undefined' && isWideWidth(window.innerWidth);

export const type = {
  caption: wide ? 13 : 12, // rótulos chicos: nada por debajo de 13 px en la web ancha
  secondary: wide ? 15 : 14, // secundario (hoy 13-14)
  body: wide ? 17 : 15, // texto de lectura (hoy 14-15)
  button: wide ? 16 : 14, // botones
  title: wide ? 30 : 24, // títulos de pantalla
  display: wide ? 46 : 40, // números grandes (monedas, racha)
} as const;

export type TypeRole = keyof typeof type;
