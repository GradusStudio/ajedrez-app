// Detalles invernales de las piezas de hielo, calculados a partir de la silueta del Clásico (puro, sin React Native):
// nieve que cae desde arriba, carámbanos que cuelgan de la base y un copo de nieve en el cuerpo.
export type Bounds = { minX: number; minY: number; maxX: number; maxY: number };

/** Caja que ocupa un trazado hecho de pares "x y" (los de pieceSets.ts no usan curvas). */
export function pathBounds(d: string): Bounds {
  const n = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
  const b = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  for (let i = 0; i + 1 < n.length; i += 2) {
    b.minX = Math.min(b.minX, n[i]);
    b.maxX = Math.max(b.maxX, n[i]);
    b.minY = Math.min(b.minY, n[i + 1]);
    b.maxY = Math.max(b.maxY, n[i + 1]);
  }
  return b;
}

const r1 = (v: number) => Math.round(v * 10) / 10;

// Largo de cada goteo de nieve y de cada carámbano, en fracción del alto / unidades del dibujo.
const DRIPS = [0.1, 0.03, 0.14, 0.05, 0.11];
const ICICLES = [4.6, 7, 5.4, 7.8, 4.4];

export type WinterShapes = { cap: string; icicles: string; flake: string; flakeAt: { x: number; y: number } };

/** `cap` se recorta con la silueta de la pieza: cubre la parte de arriba con un borde de goteo. */
export function winterShapes(sil: string): WinterShapes {
  const b = pathBounds(sil);
  const w = b.maxX - b.minX;
  const h = b.maxY - b.minY;
  const y0 = b.minY + h * 0.17;
  const x1 = b.maxX + 4;
  const x0 = b.minX - 4;
  const sw = (x1 - x0) / DRIPS.length;

  let cap = `M${r1(x0)} ${r1(b.minY - 4)}H${r1(x1)}V${r1(y0)}`;
  DRIPS.forEach((len, i) => {
    const xs = x1 - sw * i;
    cap += `L${r1(xs - sw * 0.12)} ${r1(y0)}Q${r1(xs - sw * 0.5)} ${r1(y0 + h * len * 2)} ${r1(xs - sw * 0.88)} ${r1(y0)}`;
  });
  cap += 'Z';

  let icicles = '';
  ICICLES.forEach((len, i) => {
    const x = b.minX + w * (0.14 + (0.72 * i) / (ICICLES.length - 1));
    icicles += `M${r1(x - 2.4)} ${r1(b.maxY - 1.5)}L${r1(x + 2.4)} ${r1(b.maxY - 1.5)}L${r1(x)} ${r1(b.maxY + len)}Z`;
  });

  const cx = (b.minX + b.maxX) / 2;
  const cy = b.minY + h * 0.5;
  const R = Math.min(6, w * 0.15);
  let flake = '';
  for (let k = 0; k < 3; k++) {
    const a = (k * Math.PI) / 3;
    flake += `M${r1(cx - R * Math.cos(a))} ${r1(cy - R * Math.sin(a))}L${r1(cx + R * Math.cos(a))} ${r1(cy + R * Math.sin(a))}`;
  }
  return { cap, icicles, flake, flakeAt: { x: cx, y: cy } };
}
