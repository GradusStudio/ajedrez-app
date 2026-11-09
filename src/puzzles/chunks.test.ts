import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { chunkPath, ChunkIO, createChunkSource, dailyIndex, decodeRow, layerChunks, Manifest, offlineOrder, Row } from './chunks';
import { PuzzlesUnavailable } from './source';

const THEMES = ['fork', 'pin', 'short'];

/** Índice chico: trozos de 2 puzzles. medio/todos: capa A con 2 trozos, B con 1. medio/fork: solo capa A, 1 trozo. */
const manifest: Manifest = {
  version: 'v1',
  base: 'https://x/',
  chunkSize: 2,
  total: 6,
  daily: { from: 2026, to: 2027 },
  themes: THEMES,
  levels: {
    facil: { todos: [0, 0, 0], fork: [0, 0, 0] },
    medio: { todos: [4, 2, 0], fork: [2, 0, 0], pin: [1, 0, 0] },
  },
};

const row = (id: string, themes: number[] = []): Row => [id, '8/8/8/8/8/8/8/K6k w - - 0 1', 'a1a2 h1h2', 1300, themes];

/** Archivos del servidor de mentira. */
const files: Record<string, unknown> = {
  'medio/todos/0.json': [row('a1', [0]), row('a2')],
  'medio/todos/1.json': [row('a3'), row('a4', [1])],
  'medio/todos/2.json': [row('b1'), row('b2', [0])],
  'medio/fork/0.json': [row('a1', [0]), row('b2', [0])],
  'dia/2026.json': { year: 2026, puzzles: Array.from({ length: 365 }, (_, i) => row(`d${i}`)) },
};

/** IO de prueba: `net` decide si hay red; `cache` son los archivos guardados. */
function fakeIO(opts: { net?: boolean; cache?: Record<string, unknown> } = {}) {
  const state = { net: opts.net ?? true, cache: { ...(opts.cache ?? {}) }, fetched: [] as string[] };
  const io: ChunkIO = {
    async fetchJson(path) {
      state.fetched.push(path);
      if (!state.net) throw new TypeError('Failed to fetch');
      if (!(path in files)) throw new Error('HTTP 404');
      state.cache[path] = files[path]; // como el service worker
      return files[path];
    },
    cachedPaths: async () => Object.keys(state.cache),
    cachedJson: async (path) => state.cache[path],
    online: () => state.net,
  };
  return { io, state };
}

/** Azar fijo: siempre el primero de cada lista. */
const first = () => 0;
const none = () => false;

test('decodeRow pasa los temas de números a nombres', () => {
  const p = decodeRow(['x', 'f', 'e2e4 e7e5', 900, [1, 2, 9]], THEMES);
  assert.deepEqual(p, { id: 'x', fen: 'f', moves: ['e2e4', 'e7e5'], rating: 900, themes: ['pin', 'short'] });
});

test('layerChunks numera las capas seguidas: primero A, después B y C', () => {
  assert.deepEqual(layerChunks(manifest, 'medio', 'todos'), [[0, 1], [2], []]);
  assert.deepEqual(layerChunks(manifest, 'medio', 'fork'), [[0], [], []]);
  assert.deepEqual(layerChunks(manifest, 'experto', 'todos'), []);
  assert.equal(chunkPath('medio', 'fork', 3), 'medio/fork/3.json');
});

test('dailyIndex: el 1 de enero es 0 y el 31 de diciembre de un año bisiesto es 365', () => {
  assert.deepEqual(dailyIndex(new Date(2026, 0, 1, 0, 1)), { year: 2026, index: 0 });
  assert.deepEqual(dailyIndex(new Date(2026, 11, 31, 23, 59)), { year: 2026, index: 364 });
  assert.deepEqual(dailyIndex(new Date(2028, 11, 31, 12)), { year: 2028, index: 365 });
});

test('offlineOrder: primero el mismo nivel y grupo, después todos del nivel filtrando por el tema', () => {
  const cached = ['medio/todos/1.json', 'medio/fork/0.json', 'facil/fork/0.json', 'dia/2026.json', 'medio/pin/0.json'];
  assert.deepEqual(offlineOrder(cached, 'medio', 'fork'), [
    { path: 'medio/fork/0.json', filter: null },
    { path: 'medio/todos/1.json', filter: 'fork' },
  ]);
  assert.deepEqual(offlineOrder(cached, 'medio', 'todos'), [{ path: 'medio/todos/1.json', filter: null }]);
  assert.deepEqual(offlineOrder(cached, 'dificil', 'fork'), []);
});

test('next: elige uno pendiente de la capa A y no repite los de la sesión', async () => {
  const { io, state } = fakeIO();
  const src = createChunkSource(manifest, io, first);
  const seen = new Set<string>();
  const p1 = await src.next('medio', null, none, seen);
  assert.equal(p1?.id, 'a1');
  assert.deepEqual(state.fetched.slice(0, 1), ['medio/todos/0.json']);
  seen.add(p1!.id);
  const p2 = await src.next('medio', null, none, seen);
  assert.equal(p2?.id, 'a2', 'sale del trozo que ya está en memoria');
  seen.add(p2!.id);
  const p3 = await src.next('medio', null, none, seen);
  assert.equal(p3?.id, 'a3', 'trozo agotado: pasa a otro de la capa A');
});

test('next: salta los resueltos; la capa B se usa cuando la A no tiene pendientes', async () => {
  const { io } = fakeIO();
  const src = createChunkSource(manifest, io, first);
  const solved = new Set(['a1', 'a2', 'a3', 'a4']);
  const p = await src.next('medio', null, (id) => solved.has(id), new Set());
  assert.equal(p?.id, 'b1');
});

test('next: si en 3 trozos no hay pendientes, acepta uno repetido', async () => {
  const { io } = fakeIO();
  const src = createChunkSource(manifest, io, first);
  const p = await src.next('medio', null, () => true, new Set());
  assert.ok(p, 'aunque estén todos resueltos, da uno');
  const q = await src.next('medio', null, () => true, new Set([p!.id]));
  assert.ok(q && q.id !== p!.id, 'el repetido evita el que acaba de salir si puede');
});

test('next: por tema pide el grupo del tema; un grupo vacío no da nada', async () => {
  const { io, state } = fakeIO();
  const src = createChunkSource(manifest, io, first);
  const p = await src.next('medio', 'fork', none, new Set());
  assert.ok(p?.themes.includes('fork'));
  assert.ok(state.fetched.includes('medio/fork/0.json'));
  assert.equal(await src.next('facil', 'fork', none, new Set()), undefined);
  assert.equal(src.count('medio', null), 6);
  assert.equal(src.count('medio', 'fork'), 2);
  assert.equal(src.count('experto', null), 0);
  assert.equal(src.total, 6);
});

test('sin red: usa un trozo guardado del mismo grupo', async () => {
  const { io } = fakeIO({ net: false, cache: { 'medio/todos/2.json': files['medio/todos/2.json'] } });
  const src = createChunkSource(manifest, io, first);
  const p = await src.next('medio', null, none, new Set());
  assert.equal(p?.id, 'b1');
});

test('sin red: si no hay del tema, filtra un trozo guardado de todos', async () => {
  const { io } = fakeIO({ net: false, cache: { 'medio/todos/1.json': files['medio/todos/1.json'] } });
  const src = createChunkSource(manifest, io, first);
  const p = await src.next('medio', 'pin', none, new Set());
  assert.equal(p?.id, 'a4');
});

test('sin red y sin nada guardado: error de «sin conexión»', async () => {
  const { io } = fakeIO({ net: false });
  const src = createChunkSource(manifest, io, first);
  await assert.rejects(src.next('medio', null, none, new Set()), (e: unknown) => e instanceof PuzzlesUnavailable && e.offline);
  await assert.rejects(src.daily(new Date(2026, 3, 1, 12)), (e: unknown) => e instanceof PuzzlesUnavailable && e.offline);
});

test('daily y byId usan el archivo del año', async () => {
  const { io, state } = fakeIO();
  const src = createChunkSource(manifest, io, first);
  assert.equal((await src.daily(new Date(2026, 0, 3, 12))).id, 'd2');
  assert.equal(state.fetched.filter((p) => p === 'dia/2026.json').length, 1);
  await src.daily(new Date(2026, 0, 4, 12));
  assert.equal(state.fetched.filter((p) => p === 'dia/2026.json').length, 1, 'el archivo del año queda en memoria');
  // byId busca en el año actual (el reloj real); en 2026 lo encuentra, si no, busca en el año anterior y el siguiente.
  if (new Date().getFullYear() >= 2025 && new Date().getFullYear() <= 2027) assert.equal((await src.byId('d10'))?.id, 'd10');
  await src.next('medio', null, none, new Set());
  assert.equal((await src.byId('a2'))?.id, 'a2', 'también en los trozos que están en memoria');
  assert.equal(await src.byId('no-existe'), undefined);
});

test('prepareOffline baja el año y un trozo de todos por nivel que no tenga uno guardado, una sola vez', async () => {
  const { io, state } = fakeIO();
  const src = createChunkSource(manifest, io, first);
  src.prepareOffline();
  src.prepareOffline();
  await new Promise((r) => setTimeout(r, 10));
  assert.ok(state.fetched.includes(`dia/${new Date().getFullYear()}.json`));
  assert.deepEqual(
    state.fetched.filter((p) => p.includes('/todos/')),
    ['medio/todos/0.json'],
    'facil no tiene trozos; medio, uno de la capa A'
  );
});

test('prepareOffline no hace nada sin red', async () => {
  const { io, state } = fakeIO({ net: false });
  createChunkSource(manifest, io, first).prepareOffline();
  await new Promise((r) => setTimeout(r, 10));
  assert.deepEqual(state.fetched, []);
});
