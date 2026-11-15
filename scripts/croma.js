// Quita el fondo verde (#00FF00) o magenta (MAG=1) de una imagen generada y corrige el borde. Uso: node scripts/croma.js <entrada.png> <salida.png> [ancho alto]. NOTRIM=1 no recorta.
const sharp = require('sharp');
const [, , inp, out, W, H] = process.argv; const MAG = process.env.MAG === '1';
(async () => {
  const { data, info } = await sharp(inp).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const T1 = 30, T2 = 110;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const m = MAG ? Math.min(r, b) : Math.max(r, b), green = MAG ? m - g : g - m;
    let a = 1;
    if (green > T1) a = Math.max(0, 1 - (green - T1) / (T2 - T1));
    if (green > T1 && a > 0) { if (MAG) { const t = g + Math.min(green, 8); data[i] = Math.min(r, t); data[i + 2] = Math.min(b, t); } else data[i + 1] = m + Math.min(green, 8); } // sin derrame verde en los bordes
    data[i + 3] = Math.round(a * 255);
  }
  let img = sharp(data, { raw: info });
  img = sharp(await img.png().toBuffer()); if (!process.env.NOTRIM) img = img.trim({ threshold: 1 });
  const buf = await img.png().toBuffer();
  if (W) {
    await sharp(buf).resize(+W, +H, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(out);
  } else {
    // busto: vuelve al cuadrado original con el personaje centrado abajo
    await sharp(buf).resize(info.width, info.height, { fit: 'contain', position: 'bottom', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(out);
  }
  console.log('ok', out);
})();
