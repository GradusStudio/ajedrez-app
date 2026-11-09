// Arma los puzzles de la app a partir de la base abierta de Lichess:
//   npm run build:puzzles -- <archivo.csv.zst> [--salida <carpeta>] [--muestra N]
//
// Base: https://database.lichess.org/#puzzles (licencia CC0, dominio público).
// Lee el .csv.zst descomprimiéndolo sobre la marcha (no hace falta descomprimirlo a disco) y genera:
//   - src/puzzles/lichess-puzzles.json: los 50.000 de la app nativa (solo lo reescribe si cambió la selección).
//   - la base completa por trozos para la web, en <salida> (por defecto C:\dev\datos-lichess\trozos, fuera del
//     proyecto): v1/<nivel>/<grupo>/<n>.json, el puzzle del día por año (v1/dia/<año>.json) y el _headers del Worker.
//   - src/puzzles/manifest.json: el índice de los trozos (va dentro de la app).
// Con --muestra N arma solo los primeros N puzzles, sin tocar src/ (el índice queda en <salida>/manifest.json).
// Criterios en docs/puzzles.md; reparto en scripts/puzzleShards.js.
/* global __dirname */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { Worker } = require('worker_threads');
const { isValid } = require('./puzzleValidator');
const { Decompress } = require('fzstd');
const S = require('./puzzleShards');

const args = process.argv.slice(2);
const option = (name) => {
  const i = args.indexOf(name);
  if (i < 0) return undefined;
  const value = args[i + 1];
  args.splice(i, 2);
  return value;
};
const root = path.join(__dirname, '..');
const outDir = path.resolve(option('--salida') ?? path.join(root, '..', 'datos-lichess', 'trozos'));
const sampleArg = option('--muestra');
const sample = sampleArg ? Number(sampleArg) : 0;
const input = args[0];
if (!input || !fs.existsSync(input) || (sampleArg && !(sample > 0))) {
  console.error('Uso: npm run build:puzzles -- <ruta a lichess_db_puzzle.csv.zst> [--salida <carpeta>] [--muestra N]');
  process.exit(1);
}
const themes = require(path.join(root, 'src', 'puzzles', 'themes.json'));
const nativeFile = path.join(root, 'src', 'puzzles', 'lichess-puzzles.json');
const VERSION = 'v1';
const BASE_URL = 'https://puzzles.graduschess.com/';

// ---------- Selección de 50.000 para la app nativa (criterios de siempre) ----------
const RATING_MIN = 500;
const RATING_MAX = 2500; // sin incluir
const BAND = 100; // 20 franjas de 100 puntos
const PER_BAND = 2500; // 20 × 2500 = 50.000 puzzles
const MIN_POPULARITY = 85; // votos positivos en Lichess (−100 a 100)
const MIN_PLAYS = 1000;
const MAX_DEVIATION = 80; // rating bien establecido
const MAX_PLIES = 8; // jugada del rival + hasta 4 jugadas del usuario y 3 respuestas
const KEEP_PER_THEME = 1000; // candidatos que se guardan por tema y franja
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
let passed = 0;

function selectForNative(p) {
  const { rating: r, moveCount, deviation: dev, popularity: pop, plays: n } = p;
  if (r < RATING_MIN || r >= RATING_MAX || moveCount > MAX_PLIES) return;
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
  const theme = mainTheme(p.themes);
  if (!target.has(band)) target.set(band, new Map());
  const byTheme = target.get(band);
  if (!byTheme.has(theme)) byTheme.set(theme, []);
  const arr = byTheme.get(theme);
  arr.push({ id: p.id, fen: p.fen, moves: p.moves, rating: r, popularity: pop, plays: n, themes: p.themes });
  // Se conservan solo los mejores de cada tema para no llenar la memoria.
  if (arr.length > KEEP_PER_THEME * 2) {
    arr.sort((a, b) => score(b) - score(a));
    arr.length = KEEP_PER_THEME;
  }
}

function buildNative() {
  const chosen = [];
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
        for (let k = 0; k < turns; k++) queues.push(arr);
      }
      let i = 0;
      while (taken.length < PER_BAND && queues.some((q) => q.length)) {
        const p = queues[i % queues.length].shift();
        if (p && isValid(p.fen, p.moves)) {
          taken.push(p);
          if (source === relaxedBands) relaxedUsed++;
        }
        i++;
      }
    }
    if (taken.length < PER_BAND) console.warn(`Franja ${RATING_MIN + b * BAND}: solo ${taken.length} puzzles`);
    chosen.push(...taken);
  }
  chosen.sort((a, b) => a.rating - b.rating);
  const known = new Set(themes.known);
  const puzzles = chosen.map((p) => [p.id, p.fen, p.moves, p.rating, p.themes.filter((t) => known.has(t)).join(' ')]);
  // Si la selección no cambió, el archivo queda como está (sin cambiar la fecha ni ensuciar git).
  const previous = JSON.parse(fs.readFileSync(nativeFile, 'utf8'));
  if (JSON.stringify(previous.puzzles) === JSON.stringify(puzzles)) {
    console.log(`lichess-puzzles.json: sin cambios (${puzzles.length} puzzles)`);
    return;
  }
  const out = {
    source: 'Lichess puzzle database (https://database.lichess.org/#puzzles), CC0',
    generated: new Date().toISOString().slice(0, 10),
    criteria: { RATING_MIN, RATING_MAX, PER_BAND, MIN_POPULARITY, MIN_PLAYS, MAX_DEVIATION, MAX_PLIES },
    puzzles,
  };
  fs.writeFileSync(nativeFile, JSON.stringify(out));
  console.log(`lichess-puzzles.json: REESCRITO, ${puzzles.length} puzzles (con filtros flexibles: ${relaxedUsed}). Cambia el puzzle del día: revisar las pruebas.`);
}

// ---------- Base completa por trozos ----------
const staging = `${outDir}.armando`;
const tmpDir = path.join(staging, '_tmp');
fs.rmSync(staging, { recursive: true, force: true });
fs.mkdirSync(tmpDir, { recursive: true });

const themeIndex = new Map(themes.known.map((t, i) => [t, i]));
const buffers = new Map(); // "nivel/grupo/capa" → filas pendientes de escribir
let buffered = 0;
const stats = { total: 0, candidates: 0, valid: 0, invalid: 0 };
const nativeIds = new Set(JSON.parse(fs.readFileSync(nativeFile, 'utf8')).puzzles.map((p) => p[0]));

function flush() {
  for (const [key, rows] of buffers) {
    if (rows.length) fs.appendFileSync(path.join(tmpDir, key.replace(/\//g, '__') + '.txt'), rows.join('\n') + '\n');
  }
  buffers.clear();
  buffered = 0;
}

function store(p) {
  stats.valid++;
  nativeIds.delete(p.id);
  const row = S.encodeRow(p.id, p.fen, p.moves, p.rating, p.themes, themeIndex);
  const level = S.levelOf(p.rating);
  for (const group of S.groupsOf(p.themes, themes.practice)) {
    const key = `${level}/${group}/${p.layer}`;
    if (!buffers.has(key)) buffers.set(key, []);
    buffers.get(key).push(row);
    buffered++;
  }
  if (buffered > 400000) flush();
}

// Lotes a los hilos; los resultados se aplican en orden para que dos armados den los mismos archivos.
const WORKERS = Math.max(1, Math.min(os.cpus().length - 2, 16));
const BATCH = 2000;
const workers = Array.from({ length: WORKERS }, () => new Worker(path.join(__dirname, 'puzzleValidator.js')));
let batch = [];
let nextSeq = 0;
let applySeq = 0;
const pending = new Map(); // seq → lote enviado
const results = new Map(); // seq → resultado recibido
let readingDone = false;
let file;

for (const w of workers) {
  w.on('message', ({ seq, ok }) => {
    results.set(seq, ok);
    while (results.has(applySeq)) {
      const items = pending.get(applySeq);
      const res = results.get(applySeq);
      for (let i = 0; i < items.length; i++) {
        if (res[i]) store(items[i]);
        else stats.invalid++;
      }
      pending.delete(applySeq);
      results.delete(applySeq);
      applySeq++;
    }
    if (file && file.isPaused() && pending.size < WORKERS * 3) file.resume();
    if (readingDone && pending.size === 0) finish();
  });
}

function dispatch() {
  if (!batch.length) return;
  const seq = nextSeq++;
  pending.set(seq, batch);
  workers[seq % WORKERS].postMessage({ seq, items: batch.map((p) => [p.fen, p.moves]) });
  batch = [];
  if (pending.size >= WORKERS * 6 && file && !file.destroyed) file.pause();
}

let header = null;
let stopped = false;
function handleLine(line) {
  if (!line || stopped) return;
  if (!header) {
    header = line;
    return;
  }
  stats.total++;
  const [id, fen, moves, rating, deviation, popularity, plays, themeStr] = line.split(',');
  const moveCount = moves.split(' ').length;
  if (moveCount < 2) return;
  const p = {
    id,
    fen,
    moves,
    moveCount,
    rating: Number(rating),
    deviation: Number(deviation),
    popularity: Number(popularity),
    plays: Number(plays),
    themes: themeStr ? themeStr.split(' ') : [],
  };
  p.layer = S.layerOf(p);
  if (!sample) selectForNative(p);
  stats.candidates++;
  batch.push(p);
  if (batch.length >= BATCH) dispatch();
  if (sample && stats.candidates >= sample) {
    stopped = true;
    file.destroy();
    endOfInput();
  }
}

function endOfInput() {
  if (readingDone) return;
  dispatch();
  readingDone = true;
  if (pending.size === 0) finish();
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
console.log(`Leyendo ${input} con ${WORKERS} hilos de validación${sample ? ` (muestra de ${sample})` : ''}…`);
file = fs.createReadStream(input, { highWaterMark: 1 << 20 });
file.on('data', (buf) => {
  if (!stopped) stream.push(new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength));
});
file.on('end', () => {
  if (stopped) return;
  stream.push(new Uint8Array(0), true);
  if (rest) handleLine(rest.trim());
  endOfInput();
});

// ---------- Armado de los trozos, el índice y el puzzle del día ----------
let finished = false;
function finish() {
  if (finished) return;
  finished = true;
  for (const w of workers) w.terminate();
  flush();
  if (!sample) buildNative();
  const secs = () => Math.round((Date.now() - t0) / 1000);
  console.log(`Leídos ${stats.total.toLocaleString('es')} en ${secs()} s; válidos ${stats.valid.toLocaleString('es')}, descartados por jugadas ilegales ${stats.invalid}`);

  const levels = {};
  let total = 0;
  let files = 0;
  for (const [level] of S.LEVELS) {
    levels[level] = {};
    for (const group of ['todos', ...themes.practice]) {
      const counts = [];
      let n = 0; // número del próximo trozo del grupo (las capas van seguidas: primero A, después B y C)
      for (let layer = 0; layer < 3; layer++) {
        const tmp = path.join(tmpDir, `${level}__${group}__${layer}.txt`);
        const rows = fs.existsSync(tmp) ? fs.readFileSync(tmp, 'utf8').split('\n').filter(Boolean) : [];
        counts.push(rows.length);
        S.shuffle(rows, S.seedFor(`${level}/${group}/${layer}`));
        const dir = path.join(staging, VERSION, level, group);
        for (const chunk of S.cutChunks(rows)) {
          fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(path.join(dir, `${n++}.json`), `[${chunk.join(',')}]`);
          files++;
        }
      }
      levels[level][group] = counts;
      if (group === 'todos') total += counts[0] + counts[1] + counts[2];
    }
  }
  fs.rmSync(tmpDir, { recursive: true, force: true });

  // Puzzle del día: la fórmula de dailyPuzzle sobre los 15.000 de nivel 1000–1599 de lichess-puzzles.json.
  const nativeRows = JSON.parse(fs.readFileSync(nativeFile, 'utf8')).puzzles;
  const pool = nativeRows
    .filter((r) => r[3] >= 1000 && r[3] < 1600)
    .map(([id, fen, moves, rating, t]) => S.encodeRow(id, fen, moves, rating, t ? t.split(' ') : [], themeIndex));
  fs.mkdirSync(path.join(staging, VERSION, 'dia'), { recursive: true });
  for (let year = S.DAILY_FROM; year <= S.DAILY_TO; year++) {
    fs.writeFileSync(path.join(staging, VERSION, 'dia', `${year}.json`), `{"year":${year},"puzzles":[${S.dailyYear(pool, year).join(',')}]}`);
    files++;
  }
  fs.copyFileSync(path.join(root, 'puzzles-public', '_headers'), path.join(staging, '_headers'));

  const manifest = {
    _comment: 'Índice de los puzzles por trozos de la web (lo genera scripts/build-puzzles.js; ver docs/puzzles.md). levels.<nivel>.<grupo> = puzzles de cada capa de calidad [A, B, C].',
    version: VERSION,
    base: BASE_URL,
    chunkSize: S.CHUNK_SIZE,
    generated: new Date().toISOString().slice(0, 10),
    total,
    invalid: stats.invalid,
    daily: { from: S.DAILY_FROM, to: S.DAILY_TO },
    themes: themes.known,
    levels,
  };
  if (S.countFiles(manifest) !== files) throw new Error(`El índice cuenta ${S.countFiles(manifest)} archivos y se escribieron ${files}`);
  if (files > S.MAX_FILES) throw new Error(`${files} archivos: pasa el tope de ${S.MAX_FILES} (Cloudflare admite 20.000). Subir CHUNK_SIZE.`);

  // Se cambia la carpeta entera al final: si algo falló antes, la salida anterior queda intacta.
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.renameSync(staging, outDir);
  const manifestFile = sample ? path.join(outDir, 'manifest.json') : path.join(root, 'src', 'puzzles', 'manifest.json');
  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 1) + '\n');

  if (!sample && nativeIds.size) console.warn(`AVISO: ${nativeIds.size} puzzles de lichess-puzzles.json no están en los trozos: ${[...nativeIds].slice(0, 10).join(', ')}`);
  console.log(`Trozos: ${files} archivos en ${outDir}; ${total.toLocaleString('es')} puzzles; índice en ${manifestFile}. Total ${secs()} s.`);
}
