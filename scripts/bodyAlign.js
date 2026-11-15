// Lógica pura de la alineación de poses de cuerpo entero (scripts/build-avatars.js).
// `alpha` es el canal alfa de la figura (0..255), en fila mayor.
// Las botas son la franja inferior de la figura (un 6 % de su alto por defecto): su centro
// horizontal y la línea de pies se usan para que una pose no salte de costado ni de altura
// respecto del cuerpo neutro del mismo bot.

/** Primera y última fila con algún píxel opaco. */
function figureRows(alpha, width, height, threshold = 8) {
  let yMin = -1;
  let yMax = -1;
  for (let y = 0; y < height; y++) {
    let any = false;
    for (let x = 0; x < width; x++) {
      if (alpha[y * width + x] > threshold) {
        any = true;
        break;
      }
    }
    if (any) {
      if (yMin < 0) yMin = y;
      yMax = y;
    }
  }
  return { yMin, yMax };
}

/**
 * Centro horizontal ponderado por alfa de la franja de botas y línea de pies.
 * Devuelve { x, yMin, yMax }; si la figura está vacía, x queda en el centro.
 */
function bootStats(alpha, width, height, fraction = 0.06, threshold = 8) {
  const rows = figureRows(alpha, width, height, threshold);
  if (rows.yMin < 0) return { x: width / 2, yMin: 0, yMax: height - 1 };
  const figureH = rows.yMax - rows.yMin + 1;
  const bandH = Math.max(1, Math.round(figureH * fraction));
  const bandTop = Math.max(rows.yMin, rows.yMax - bandH + 1);
  let sum = 0;
  let weight = 0;
  for (let y = bandTop; y <= rows.yMax; y++) {
    for (let x = 0; x < width; x++) {
      const a = alpha[y * width + x];
      if (a <= threshold) continue;
      sum += x * a;
      weight += a;
    }
  }
  return { x: weight ? sum / weight : width / 2, yMin: rows.yMin, yMax: rows.yMax };
}

/** Desplazamiento para que la pose coincida con el neutro en botas y línea de pies. */
function alignOffset(pose, neutral) {
  return {
    dx: Math.round(neutral.x - pose.x),
    dy: Math.round(neutral.yMax - pose.yMax),
  };
}

/**
 * Cómo recortar la pose antes de componerla en el lienzo transparente cuando el desplazamiento
 * es negativo, y dónde dejarla. Siempre devuelve una caja válida dentro de `width` × `height`.
 */
function composeBox(width, height, dx, dy) {
  const extractLeft = Math.max(0, -dx);
  const extractTop = Math.max(0, -dy);
  return {
    extractLeft,
    extractTop,
    extractWidth: Math.max(0, width - extractLeft),
    extractHeight: Math.max(0, height - extractTop),
    left: Math.max(0, dx),
    top: Math.max(0, dy),
  };
}

module.exports = { figureRows, bootStats, alignOffset, composeBox };
