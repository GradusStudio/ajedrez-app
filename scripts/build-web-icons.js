// Íconos de la versión web, derivados de assets/fuente/icono-figura.png sobre el fondo #262421.
// Misma regla que icon.png y el ícono adaptable de Android (docs/design.md, «Icono de la app»):
// la figura se centra según su caja y se escala para que su círculo envolvente tenga un radio fijo.
//   icon-192, icon-512, apple-touch-icon-180: radio del 41 % del ancho (como icon.png).
//   maskable-512: la figura ocupa el 60 % central (radio 30 %), dentro del círculo seguro del 40 %.
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const SOURCE = path.join(ROOT, 'assets', 'fuente', 'icono-figura.png');
const OUT = path.join(ROOT, 'public', 'icons');
const BG = '#262421';

const OUTPUTS = [
  { file: 'icon-192.png', size: 192, radius: 0.41 },
  { file: 'icon-512.png', size: 512, radius: 0.41 },
  { file: 'maskable-512.png', size: 512, radius: 0.3 },
  { file: 'apple-touch-icon-180.png', size: 180, radius: 0.41 },
];

async function main() {
  // Caja de la figura (la parte no transparente) y su círculo envolvente.
  const { data, info } = await sharp(SOURCE).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let x0 = info.width, y0 = info.height, x1 = -1, y1 = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * info.channels + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  const w = x1 - x0 + 1;
  const h = y1 - y0 + 1;
  const figure = await sharp(SOURCE).extract({ left: x0, top: y0, width: w, height: h }).toBuffer();
  const halfDiagonal = Math.hypot(w, h) / 2;

  fs.mkdirSync(OUT, { recursive: true });
  for (const { file, size, radius } of OUTPUTS) {
    const scale = (radius * size) / halfDiagonal;
    const fw = Math.max(1, Math.round(w * scale));
    const fh = Math.max(1, Math.round(h * scale));
    const resized = await sharp(figure).resize(fw, fh).toBuffer();
    await sharp({ create: { width: size, height: size, channels: 3, background: BG } })
      .composite([{ input: resized, left: Math.round((size - fw) / 2), top: Math.round((size - fh) / 2) }])
      .png()
      .toFile(path.join(OUT, file));
    console.log(`public/icons/${file} (${size} px)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
