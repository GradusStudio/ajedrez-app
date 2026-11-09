// Reparto de la base de puzzles de Lichess en grupos, capas y trozos (lógica pura de scripts/build-puzzles.js).
// Spec: docs/superpowers/specs/2026-11-08-puzzles-por-trozos-design.md. Probado en puzzleShards.test.ts.

/** Puzzles por trozo. Si la base crece y se acerca al límite de archivos de Cloudflare, se sube a 1.500. */
const CHUNK_SIZE = 1000;
/** Cloudflare permite 20.000 archivos por versión en el plan gratis: el armado falla antes de llegar. */
const MAX_FILES = 18000;
/** Años del puzzle del día que se generan. */
const DAILY_FROM = 2026;
const DAILY_TO = 2075;

/** Niveles de la práctica por rating de Lichess (los mismos límites que LEVELS en src/puzzles/puzzles.ts). */
const LEVELS = [
  ['facil', 0, 1200],
  ['medio', 1200, 1800],
  ['dificil', 1800, 2500],
  ['experto', 2500, Infinity],
];

function levelOf(rating) {
  const found = LEVELS.find(([, min, max]) => rating >= min && rating < max);
  return found ? found[0] : null;
}

/**
 * Capa de calidad: 0 = A (el filtro de la selección de 50.000), 1 = B (filtro mínimo), 2 = C (el resto).
 * Dentro de cada grupo se juegan primero los de la capa A.
 */
function layerOf({ popularity, plays, deviation }) {
  if (popularity >= 85 && plays >= 1000 && deviation <= 80) return 0;
  if (popularity >= 50 && plays >= 100 && deviation <= 110) return 1;
  return 2;
}

/** Grupos de un puzzle: `todos` y cada tema de Práctica que tenga. */
function groupsOf(themes, practice) {
  return ['todos', ...practice.filter((t) => themes.includes(t))];
}

/** Fila compacta: [id, fen, jugadas, rating, temas como posición en `known`]. Los temas desconocidos se omiten. */
function encodeRow(id, fen, moves, rating, themes, themeIndex) {
  const nums = [];
  for (const t of themes) {
    const i = themeIndex.get(t);
    if (i !== undefined) nums.push(i);
  }
  return JSON.stringify([id, fen, moves, rating, nums]);
}

/** Generador pseudoaleatorio con semilla (mulberry32): el mismo armado da los mismos archivos. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Semilla fija a partir de un texto (FNV-1a). */
function seedFor(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Mezcla la lista en su lugar (Fisher-Yates) con la semilla dada. */
function shuffle(list, seed) {
  const rand = mulberry32(seed);
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

/** Corta la lista en trozos de `size`. */
function cutChunks(list, size = CHUNK_SIZE) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

const chunkCount = (n, size = CHUNK_SIZE) => Math.ceil(n / size);

/** Archivos que se publican según el índice: los trozos de todos los grupos y los años del puzzle del día. */
function countFiles(manifest) {
  let n = 0;
  for (const groups of Object.values(manifest.levels)) {
    for (const layers of Object.values(groups)) for (const c of layers) n += chunkCount(c, manifest.chunkSize);
  }
  return n + (manifest.daily.to - manifest.daily.from + 1);
}

/** Día (desde 1970) del 1 de enero de `year`, en calendario: sin depender de la zona horaria. */
const firstDay = (year) => Date.UTC(year, 0, 1) / 86400000;

/**
 * Puzzle del día de cada fecha del año, con la misma fórmula que dailyPuzzle (src/puzzles/puzzles.ts):
 * `pool` son las filas de lichess-puzzles.json con rating de 1000 a 1599, en el orden del archivo.
 */
function dailyYear(pool, year) {
  const out = [];
  for (let day = firstDay(year); day < firstDay(year + 1); day++) out.push(pool[(day * 7919) % pool.length]);
  return out;
}

module.exports = {
  CHUNK_SIZE,
  MAX_FILES,
  DAILY_FROM,
  DAILY_TO,
  LEVELS,
  levelOf,
  layerOf,
  groupsOf,
  encodeRow,
  mulberry32,
  seedFor,
  shuffle,
  cutChunks,
  chunkCount,
  countFiles,
  dailyYear,
};
