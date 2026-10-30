// Elige los puzzles de la app a partir de la base abierta de Lichess: `npm run build:puzzles -- <archivo.csv.zst>`.
//
// Base: https://database.lichess.org/#puzzles (licencia CC0, dominio público).
// Lee el .csv.zst descomprimiéndolo sobre la marcha (no hace falta descomprimirlo a disco)
// y genera src/puzzles/puzzles.json. Criterios en docs/puzzles.md.
/* global __dirname */
const fs = require('fs');
const path = require('path');
const { Decompress } = require('fzstd');
const { Chess } = require('chess.js');

const input = process.argv[2];
if (!input || !fs.existsSync(input)) {
  console.error('Uso: npm run build:puzzles -- <ruta a lichess_db_puzzle.csv.zst>');
  process.exit(1);
}
const root = path.join(__dirname, '..');
const themes = require(path.join(root, 'src', 'puzzles', 'themes.json'));

// ---------- Criterios ----------
const RATING_MIN = 500;
const RATING_MAX = 2500; // sin incluir
const BAND = 100; // 20 franjas de 100 puntos
const PER_BAND = 2500; // 20 × 2500 = 50.000 puzzles
const MIN_POPULARITY = 85; // votos positivos en Lichess (−100 a 100)
const MIN_PLAYS = 1000;
const MAX_DEVIATION = 80; // rating bien establecido
const MAX_PLIES = 8; // jugada del rival + hasta 4 jugadas del usuario y 3 respuestas
const KEEP_PER_THEME = 1000; // candidatos que se guardan por tema y franja
// Temas que no se usan. Ninguno por ahora: las subpromociones ya entran porque el tablero tiene
// selector de coronación y la solución exige la pieza elegida (`e7e8n`).
const EXCLUDE = new Set();
// En los niveles más bajos hay pocos puzzles que cumplan todo: ahí se aceptan filtros más flexibles
// para completar la franja (solo si con los normales no alcanza).
const RELAXED_BELOW = 800;
const RELAXED = { MIN_POPULARITY: 60, MIN_PLAYS: 300, MAX_DEVIATION: 110 };
// Los temas que se pueden elegir en Práctica reciben el doble de lugar en el reparto.
const PRACTICE_WEIGHT = 2;

const bands = new Map(); // franja → tema principal → candidatos
const relaxedBands = new Map(); // igual, con los filtros flexibles (solo franjas bajas)
const mainTheme = (list) => themes.main.find((t) => list.includes(t)) ?? 'otros';
const score = (p) => p.popularity * 10 + Math.log10(p.plays);

let header = null;
let total = 0;
let passed = 0;

function handleLine(line) {
  if (!line) return;
  const f = line.split(',');
  if (!header) {
    header = f;
    return;
  }
  total++;
  const [id, fen, moves, rating, deviation, popularity, plays, themeStr] = f;
  const r = Number(rating);
  if (r < RATING_MIN || r >= RATING_MAX) return;
  const moveList = moves.split(' ');
  if (moveList.length < 2 || moveList.length > MAX_PLIES) return;
  const list = themeStr.split(' ');
  if (list.some((t) => EXCLUDE.has(t))) return;
  const [dev, pop, n] = [Number(deviation), Number(popularity), Number(plays)];
  let target;
  if (dev <= MAX_DEVIATION && pop >= MIN_POPULARITY && n >= MIN_PLAYS) {
    target = bands;
    passed++;
  } else if (r < RELAXED_BELOW && dev <= RELAXED.MAX_DEVIATION && pop >= RELAXED.MIN_POPULARITY && n >= RELAXED.MIN_PLAYS) {
    target = relaxedBands;
  } else {
    return;
  }

  const band = Math.floor((r - RATING_MIN) / BAND);
  const theme = mainTheme(list);
  if (!target.has(band)) target.set(band, new Map());
  const byTheme = target.get(band);
  if (!byTheme.has(theme)) byTheme.set(theme, []);
  const arr = byTheme.get(theme);
  arr.push({ id, fen, moves, rating: r, popularity: Number(popularity), plays: Number(plays), themes: list });
  // Se conservan solo los mejores de cada tema para no llenar la memoria.
  if (arr.length > KEEP_PER_THEME * 2) {
    arr.sort((a, b) => score(b) - score(a));
    arr.length = KEEP_PER_THEME;
  }
}

/** Comprueba con chess.js que todas las jugadas son legales. */
function isValid(p) {
  try {
    const c = new Chess(p.fen);
    for (const uci of p.moves.split(' ')) {
      c.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
    }
    return true;
  } catch {
    return false;
  }
}

// ---------- Lectura en streaming ----------
const decoder = new TextDecoder();
let rest = '';
const stream = new Decompress((chunk, final) => {
  const text = rest + decoder.decode(chunk, { stream: !final });
  const lines = text.split('\n');
  rest = final ? '' : lines.pop();
  for (const l of lines) handleLine(l.trim());
});

const t0 = Date.now();
const file = fs.createReadStream(input, { highWaterMark: 1 << 20 });
file.on('data', (buf) => stream.push(new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)));
file.on('end', () => {
  stream.push(new Uint8Array(0), true);
  if (rest) handleLine(rest.trim());
  build();
});

// ---------- Selección ----------
function build() {
  const chosen = [];
  const perTheme = {};
  let relaxedUsed = 0;
  for (let b = 0; b < (RATING_MAX - RATING_MIN) / BAND; b++) {
    const taken = [];
    // Primero los que cumplen los filtros normales; si falta, los flexibles.
    for (const source of [bands, relaxedBands]) {
      const byTheme = source.get(b) ?? new Map();
      // Por tema, del mejor al peor; después se toma de a uno por tema (variedad).
      // Los temas de Práctica aparecen PRACTICE_WEIGHT veces por vuelta.
      const queues = [];
      for (const [theme, arr] of byTheme) {
        arr.sort((x, y) => score(y) - score(x));
        const turns = themes.practice.includes(theme) ? PRACTICE_WEIGHT : 1;
        for (let k = 0; k < turns; k++) queues.push([theme, arr]);
      }
      let i = 0;
      while (taken.length < PER_BAND && queues.some(([, q]) => q.length)) {
        const [theme, q] = queues[i % queues.length];
        const p = q.shift();
        if (p && isValid(p)) {
          taken.push(p);
          perTheme[theme] = (perTheme[theme] ?? 0) + 1;
          if (source === relaxedBands) relaxedUsed++;
        }
        i++;
      }
    }
    if (taken.length < PER_BAND) console.warn(`Franja ${RATING_MIN + b * BAND}: solo ${taken.length} puzzles`);
    chosen.push(...taken);
  }
  console.log(`Con filtros flexibles (franjas < ${RELAXED_BELOW}): ${relaxedUsed}`);
  chosen.sort((a, b) => a.rating - b.rating);

  // Formato compacto: [id, fen, jugadas, rating, temas conocidos]
  const known = new Set(Object.keys(themes.names));
  const out = {
    source: 'Lichess puzzle database (https://database.lichess.org/#puzzles), CC0',
    generated: new Date().toISOString().slice(0, 10),
    criteria: { RATING_MIN, RATING_MAX, PER_BAND, MIN_POPULARITY, MIN_PLAYS, MAX_DEVIATION, MAX_PLIES },
    puzzles: chosen.map((p) => [p.id, p.fen, p.moves, p.rating, p.themes.filter((t) => known.has(t)).join(' ')]),
  };
  const dest = path.join(root, 'src', 'puzzles', 'puzzles.json');
  fs.writeFileSync(dest, JSON.stringify(out));

  console.log(`Leídos: ${total.toLocaleString('es')} puzzles; pasan los filtros: ${passed.toLocaleString('es')}`);
  console.log(`Elegidos: ${chosen.length} (${(fs.statSync(dest).size / 1048576).toFixed(2)} MB) en ${Math.round((Date.now() - t0) / 1000)} s`);
  console.log('Por tema principal:', Object.entries(perTheme).sort((a, b) => b[1] - a[1]).map(([t, n]) => `${t} ${n}`).join(', '));
}
