import test from 'node:test';
import assert from 'node:assert/strict';
import rawFile from '../src/puzzles/lichess-puzzles.json';
import manifestJson from '../src/puzzles/manifest.json';
import themes from '../src/puzzles/themes.json';
import { dailyFromYear, Manifest, Row } from '../src/puzzles/chunks';
import { dailyPuzzle, LEVELS, parsePuzzles } from '../src/puzzles/puzzles';
import S from './puzzleShards';

const manifest = manifestJson as unknown as Manifest;
const themeIndex = new Map(themes.known.map((t, i) => [t, i] as [string, number]));

test('levelOf usa los mismos límites que LEVELS de la app', () => {
  assert.equal(S.levelOf(399), 'facil');
  assert.equal(S.levelOf(1199), 'facil');
  assert.equal(S.levelOf(1200), 'medio');
  assert.equal(S.levelOf(2499), 'dificil');
  assert.equal(S.levelOf(2500), 'experto');
  assert.equal(S.levelOf(3323), 'experto');
  for (const [name, min, max] of S.LEVELS) {
    const app = LEVELS[name as keyof typeof LEVELS];
    assert.equal(app.min, min);
    assert.equal(app.max, max === Infinity ? 4000 : max);
  }
});

test('layerOf: A con el filtro de hoy, B con el mínimo, C el resto', () => {
  assert.equal(S.layerOf({ popularity: 90, plays: 5000, deviation: 75 }), 0);
  assert.equal(S.layerOf({ popularity: 84, plays: 5000, deviation: 75 }), 1);
  assert.equal(S.layerOf({ popularity: 60, plays: 100, deviation: 110 }), 1);
  assert.equal(S.layerOf({ popularity: 49, plays: 100, deviation: 100 }), 2);
  assert.equal(S.layerOf({ popularity: 90, plays: 99, deviation: 70 }), 2);
  assert.equal(S.layerOf({ popularity: -5, plays: 10, deviation: 300 }), 2);
});

test('groupsOf: todos y cada tema de Práctica que tenga, sin repetir', () => {
  assert.deepEqual(S.groupsOf(['fork', 'short', 'pin', 'middlegame'], themes.practice), ['todos', 'fork', 'pin']);
  assert.deepEqual(S.groupsOf([], themes.practice), ['todos']);
});

test('encodeRow guarda los temas como números y omite los desconocidos', () => {
  const row = JSON.parse(S.encodeRow('abc', 'fen', 'e2e4 e7e5', 1300, ['fork', 'masterVsMaster', 'short'], themeIndex));
  assert.deepEqual(row, ['abc', 'fen', 'e2e4 e7e5', 1300, [themeIndex.get('fork'), themeIndex.get('short')]]);
});

test('shuffle con la misma semilla da el mismo orden y no pierde ni repite nada', () => {
  const base = Array.from({ length: 2500 }, (_, i) => i);
  const a = S.shuffle([...base], S.seedFor('medio/fork/0'));
  const b = S.shuffle([...base], S.seedFor('medio/fork/0'));
  const c = S.shuffle([...base], S.seedFor('medio/fork/1'));
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, c);
  assert.notDeepEqual(a, base);
  assert.deepEqual([...a].sort((x, y) => x - y), base);
});

test('cutChunks corta en trozos de 1.000 sin perder ninguno', () => {
  const chunks = S.cutChunks(Array.from({ length: 2345 }, (_, i) => i));
  assert.deepEqual(chunks.map((c: number[]) => c.length), [1000, 1000, 345]);
  assert.deepEqual(chunks.flat(), Array.from({ length: 2345 }, (_, i) => i));
  assert.deepEqual(S.cutChunks([]), []);
});

test('el índice de la app: todos los niveles y grupos, y debajo del tope de archivos', () => {
  assert.equal(manifest.version, 'v1');
  assert.equal(manifest.chunkSize, S.CHUNK_SIZE);
  assert.deepEqual(manifest.themes, themes.known, 'los temas de los trozos son los de themes.json (no cambiar su orden en v1)');
  let total = 0;
  for (const [level] of S.LEVELS) {
    for (const group of ['todos', ...themes.practice]) {
      const layers = manifest.levels[level][group];
      assert.equal(layers.length, 3, `${level}/${group}`);
    }
    const t = manifest.levels[level].todos;
    total += t[0] + t[1] + t[2];
    // Cada puzzle de un tema también está en `todos`: ningún tema puede tener más.
    for (const group of themes.practice) {
      const g = manifest.levels[level][group];
      assert.ok(g[0] + g[1] + g[2] <= t[0] + t[1] + t[2], `${level}/${group}`);
    }
  }
  assert.equal(total, manifest.total);
  assert.ok(S.countFiles(manifest) <= S.MAX_FILES, `${S.countFiles(manifest)} archivos`);
});

test('countFiles cuenta los trozos de cada capa y los años del puzzle del día', () => {
  const m = { chunkSize: 1000, daily: { from: 2026, to: 2027 }, levels: { facil: { todos: [1000, 1001, 0], fork: [1, 0, 0] } } };
  assert.equal(S.countFiles(m), 1 + 2 + 0 + 1 + 2);
});

// El puzzle del día de la web (archivos por año) tiene que ser el mismo que el de la app nativa.
test('el puzzle del día de los archivos por año coincide con dailyPuzzle en 2026 y 2027', () => {
  const rows = (rawFile as unknown as { puzzles: [string, string, string, number, string][] }).puzzles;
  const real = parsePuzzles({ puzzles: rows });
  const pool = rows
    .filter((r) => r[3] >= 1000 && r[3] < 1600)
    .map(([id, fen, moves, rating, t]) => S.encodeRow(id, fen, moves, rating, t ? t.split(' ') : [], themeIndex));
  for (const year of [2026, 2027]) {
    const file = { year, puzzles: S.dailyYear(pool, year).map((r: string) => JSON.parse(r) as Row) };
    assert.equal(file.puzzles.length, year === 2028 ? 366 : 365);
    for (let d = new Date(year, 0, 1, 12); d.getFullYear() === year; d.setDate(d.getDate() + 1)) {
      const web = dailyFromYear(file, themes.known, d);
      const native = dailyPuzzle(real, d);
      assert.equal(web?.id, native.id, d.toDateString());
      assert.deepEqual(web?.themes, native.themes);
    }
    // También a las 00:05 y a las 23:55 (el día cambia a medianoche, hora local).
    assert.equal(dailyFromYear(file, themes.known, new Date(year, 5, 1, 0, 5))?.id, dailyPuzzle(real, new Date(year, 5, 1, 0, 5)).id);
    assert.equal(dailyFromYear(file, themes.known, new Date(year, 5, 1, 23, 55))?.id, dailyPuzzle(real, new Date(year, 5, 1, 23, 55)).id);
  }
});
