// Detalles volcánicos de las piezas de magma, calculados a partir de la silueta (puro, sin React Native):
// lava que chorrea desde la punta, grietas encendidas, gotas que cuelgan de la base y brasas.
import { pathBounds } from './winter';

export type Ember = { x: number; y: number; r: number };
export type VolcanoShapes = {
  /** Capa de lava de la punta; se recorta con la silueta en las blancas y con la tinta en las negras. */
  lava: string;
  /** Extremos verticales del degradé de lava (amarillo arriba, rojo abajo). */
  lavaFrom: number;
  lavaTo: number;
  /** Dos zigzags y una rama corta: el mismo trazado para el halo naranja y el núcleo amarillo. */
  cracks: string;
  /** Cuatro gotas que cuelgan de la base. */
  drops: string;
  /** Tres brasas por encima de la pieza. */
  embers: Ember[];
};

const r1 = (v: number) => Math.round(v * 10) / 10;

// Largo de cada goteo de lava, en fracción del alto de la pieza.
const DRIPS = [0.16, 0.07, 0.22, 0.04, 0.18];
// Largo de cada gota de lava de la base, en unidades del dibujo.
const DROPS = [4.6, 7, 5.2, 8.2];

const EMPTY: VolcanoShapes = { lava: '', lavaFrom: 0, lavaTo: 0, cracks: '', drops: '', embers: [] };

/** Formas de magma para una silueta; si el trazado no tiene coordenadas, devuelve todo vacío. */
export function volcanoShapes(sil: string): VolcanoShapes {
  const b = pathBounds(sil);
  if (!Number.isFinite(b.minX) || !Number.isFinite(b.minY) || b.maxX <= b.minX || b.maxY <= b.minY) return EMPTY;
  const w = b.maxX - b.minX;
  const h = b.maxY - b.minY;
  const x0 = b.minX - 4;
  const x1 = b.maxX + 4;
  const y0 = b.minY + h * 0.07;
  const sw = (x1 - x0) / DRIPS.length;

  // Punta cubierta con cinco goteos de largo distinto, de derecha a izquierda.
  let lava = `M${r1(x0)} ${r1(b.minY - 4)}H${r1(x1)}V${r1(y0)}`;
  for (let i = 0; i < DRIPS.length; i++) {
    const xs = x1 - sw * (i + 0.5);
    const yb = y0 + h * DRIPS[i];
    lava +=
      `L${r1(xs + sw * 0.3)} ${r1(y0)}` +
      `Q${r1(xs + sw * 0.22)} ${r1(yb)} ${r1(xs)} ${r1(yb)}` +
      `Q${r1(xs - sw * 0.22)} ${r1(yb)} ${r1(xs - sw * 0.3)} ${r1(y0)}`;
  }
  lava += `L${r1(x0)} ${r1(y0)}Z`;

  // Dos zigzags que bajan por el cuerpo y una rama corta que sale del codo del primero.
  const cx = (b.minX + b.maxX) / 2;
  const top = b.minY + h * 0.3;
  const bottom = b.minY + h * 0.82;
  const span = bottom - top;
  const p = (x: number, y: number) => `${r1(x)} ${r1(y)}`;
  const cracks =
    `M${p(cx - w * 0.05, top)}L${p(cx + w * 0.08, top + span * 0.32)}` +
    `L${p(cx - w * 0.03, top + span * 0.64)}L${p(cx + w * 0.04, bottom)}` +
    `M${p(cx + w * 0.2, top + h * 0.04)}L${p(cx + w * 0.12, top + span * 0.5)}L${p(cx + w * 0.22, bottom - h * 0.08)}` +
    `M${p(cx - w * 0.03, top + span * 0.64)}L${p(cx + w * 0.13, top + span * 0.72)}`;

  // Cuatro gotas que cuelgan de la base, como los carámbanos del hielo.
  let drops = '';
  for (let i = 0; i < DROPS.length; i++) {
    const x = b.minX + w * (0.12 + (0.76 * i) / (DROPS.length - 1));
    const len = DROPS[i];
    const yTop = b.maxY - 1;
    drops +=
      `M${r1(x - 2.4)} ${r1(yTop)}L${r1(x + 2.4)} ${r1(yTop)}` +
      `Q${r1(x + 2)} ${r1(b.maxY + len * 0.55)} ${r1(x)} ${r1(b.maxY + len)}` +
      `Q${r1(x - 2)} ${r1(b.maxY + len * 0.55)} ${r1(x - 2.4)} ${r1(yTop)}Z`;
  }

  const embers: Ember[] = [0.2, 0.5, 0.8].map((f, i) => ({
    x: r1(b.minX + w * f),
    y: r1(b.minY - 5 - (i % 2) * 3.5),
    r: i % 2 === 0 ? 1.3 : 1.1,
  }));

  return { lava, lavaFrom: b.minY, lavaTo: y0 + h * Math.max(...DRIPS), cracks, drops, embers };
}
