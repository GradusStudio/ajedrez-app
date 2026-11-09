import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import rawFile from './lichess-puzzles.json';
import { autoTarget, countPuzzles, createPuzzleLoader, dailyPuzzle, findPuzzle, levelOf, nextPuzzle, parsePuzzles, pickNear, type Puzzle } from './puzzles';
import { listSource } from './source';

const real = parsePuzzles(rawFile as unknown as { puzzles: [string, string, string, number, string][] });

test('parsePuzzles arma moves y themes', () => {
  const [p] = parsePuzzles({ puzzles: [['abc', '8/8/8/8/8/8/8/K6k w - - 0 1', 'a1a2 h1h2', 1234, 'mate short'], ['d', 'f', 'e2e4', 900, '']] });
  assert.deepEqual(p.moves, ['a1a2', 'h1h2']);
  assert.deepEqual(p.themes, ['mate', 'short']);
  assert.equal(p.rating, 1234);
});

test('parsePuzzles: un puzzle sin temas tiene lista vacía', () => {
  const list = parsePuzzles({ puzzles: [['d', 'f', 'e2e4', 900, '']] });
  assert.deepEqual(list[0].themes, []);
});

test('el paquete real tiene 50.000 puzzles', () => assert.equal(real.length, 50000));

// Fijados con la implementación anterior (puzzles importados a mano), antes de la refactorización.
test('dailyPuzzle da el mismo puzzle que antes para la misma fecha', () => {
  assert.equal(dailyPuzzle(real, new Date('2026-01-01T12:00:00')).id, 'kA1KM');
  assert.equal(dailyPuzzle(real, new Date('2026-11-07T12:00:00')).id, 'OzL0g');
  assert.equal(dailyPuzzle(real, new Date('2027-03-15T12:00:00')).id, 'cblxy');
});

test('findPuzzle, countPuzzles y nextPuzzle usan la lista recibida', () => {
  const id = real[10].id;
  assert.equal(findPuzzle(real, id)?.id, id);
  assert.equal(findPuzzle(real, 'no-existe'), undefined);
  const n = countPuzzles(real, 'facil', null);
  assert.ok(n > 0 && n < real.length);
  assert.equal(countPuzzles(real.slice(0, 0), 'facil', null), 0);
  const p = nextPuzzle(real, 'medio', 'fork', () => false);
  assert.ok(p && p.themes.includes('fork') && p.rating >= 1200 && p.rating < 1800);
  assert.equal(nextPuzzle([], 'facil', null, () => false), undefined);
});

test('el cargador comparte la promesa y, si falla, la siguiente llamada reintenta', async () => {
  let calls = 0;
  const load = createPuzzleLoader(async () => {
    calls++;
    if (calls === 1) throw new Error('sin red');
    return { default: { puzzles: [['a', 'f', 'e2e4 e7e5', 800, 'mate']] } };
  });
  const first = load();
  assert.equal(load(), first, 'dos llamadas comparten la misma promesa');
  await assert.rejects(first, /sin red/);
  const second = await load();
  assert.equal(calls, 2);
  assert.equal(second[0].id, 'a');
  assert.equal(load(), load(), 'una vez cargada, sigue memorizada');
  await load();
  assert.equal(calls, 2);
});

// ---------- Elección cerca del nivel ----------

const at = (id: string, rating: number, themes: string[] = []): Puzzle => ({ id, fen: 'f', moves: ['e2e4', 'e7e5'], rating, themes });

test('autoTarget queda entre nivel−100 y nivel+100', () => {
  assert.equal(autoTarget(1000, () => 0), 900);
  assert.equal(autoTarget(1000, () => 0.5), 1000);
  assert.equal(autoTarget(1000, () => 0.999999), 1100);
});

test('levelOf usa los límites de LEVELS', () => {
  assert.equal(levelOf(399), 'facil');
  assert.equal(levelOf(1200), 'medio');
  assert.equal(levelOf(2600), 'experto');
});

test('pickNear agranda la ventana de a poco y respeta resueltos y vistos', () => {
  const list = [at('a', 1000), at('b', 1150), at('c', 1390)];
  const none = () => false;
  assert.equal(pickNear(list, 1000, none, new Set())?.id, 'a');
  assert.equal(pickNear(list, 1000, (id) => id === 'a', new Set())?.id, 'b');
  assert.equal(pickNear(list, 1000, (id) => id !== 'c', new Set())?.id, 'c');
  assert.equal(pickNear(list, 1000, () => true, new Set()), undefined);
  assert.equal(pickNear(list, 1000, none, new Set(['a', 'b']))?.id, 'c');
});

test('listSource.nextNear: con nivel por encima de la lista igual da uno, y respeta el tema', async () => {
  const src = listSource([at('a', 2400, ['fork']), at('b', 2450), at('c', 1300, ['fork'])]);
  assert.ok(await src.nextNear(2700, null, () => false, new Set()));
  const p = await src.nextNear(1300, 'fork', () => false, new Set());
  assert.ok(p?.themes.includes('fork'));
});
