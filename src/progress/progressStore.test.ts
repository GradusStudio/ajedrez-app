import test, { afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  coinBalance,
  emptyProgress,
  loadProgress,
  migrate,
  randomId,
  withBoardThemeBought,
  withLastUnit,
  withLessonFinished,
  withPieceSetBought,
  withProfile,
  withPuzzleFinished,
  withReset,
  type Progress,
} from './progressStore';

const KEY = 'ajedrez:progreso';

/** AsyncStorage simulado con un mapa en memoria. */
function fakeStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  const setItem = mock.method(AsyncStorage, 'setItem', async (k: string, v: string) => {
    map.set(k, v);
  });
  mock.method(AsyncStorage, 'getItem', async (k: string) => map.get(k) ?? null);
  return { map, setItem };
}

afterEach(() => mock.restoreAll());

const v3 = {
  version: 3,
  profile: { level: 'basico', onboarded: true },
  lessons: { 'u1-l01': { done: true, errors: 1, completedAt: '2026-10-27T10:00:00.000Z', completions: 2 } },
  drafts: {},
  streak: { current: 3, best: 5, lastActiveDate: '2026-10-27' },
  coins: 120,
  rewards: { goalDate: '2026-10-27', botWins: { lola: '2026-10-27' } },
  pieceSets: [],
  boardThemes: [],
  practice: { seconds: 420, date: '2026-10-27' },
  mistakes: [],
  games: [],
  puzzles: {},
  turningPoints: [],
  lastUnit: 2,
};

const v4 = (over: Partial<Progress> = {}): Progress => {
  const p: Progress = { ...emptyProgress, deviceId: 'dev1', ...over };
  return { ...p, coins: coinBalance(p.coinLedger) };
};

// ---------- Migración ----------

test('migrar la versión 3 con coins 120 da versión 4 con las monedas en el libro del dispositivo', () => {
  const p = migrate(v3 as never, 'dev1');
  assert.equal(p.version, 4);
  assert.equal(p.deviceId, 'dev1');
  assert.deepEqual(p.coinLedger, { dev1: { earned: 120, spent: 0 } });
  assert.equal(p.coins, 120);
  assert.equal(p.resetAt, null);
  assert.deepEqual(p.stamps, {});
  assert.deepEqual(p.lessons, v3.lessons);
  assert.equal(p.lastUnit, 2);
});

test('migrar las versiones 1 y 2 también llega a la 4', () => {
  const p1 = migrate(
    { version: 1, xp: 45, lessons: { a: { completedAt: '2026-10-01T00:00:00.000Z', bestErrors: 2, completions: 1 } } } as never,
    'x'
  );
  assert.equal(p1.version, 4);
  assert.deepEqual(p1.coinLedger, { x: { earned: 45, spent: 0 } });
  assert.equal(p1.lessons.a.errors, 2);
  const { coins: _c, rewards: _r, pieceSets: _p, boardThemes: _b, ...rest } = v3;
  const p2 = migrate({ ...rest, version: 2, xp: { total: 80, today: 0, date: null } } as never, 'y');
  assert.equal(p2.version, 4);
  assert.equal(p2.coins, 80);
  assert.deepEqual(p2.coinLedger, { y: { earned: 80, spent: 0 } });
});

test('migrar la versión 4 sin deviceId le pone uno nuevo y recalcula coins desde el libro', () => {
  const p = migrate({ ...v4({ coinLedger: { viejo: { earned: 50, spent: 5 } } }), deviceId: '', coins: 999 } as never, 'nuevo');
  assert.equal(p.deviceId, 'nuevo');
  assert.equal(p.coins, 45);
  const same = migrate(v4() as never, 'otro');
  assert.equal(same.deviceId, 'dev1');
});

test('migrar el mismo archivo viejo con el id fijo legacy es idempotente', () => {
  const a = migrate(v3 as never, 'legacy');
  const b = migrate(v3 as never, 'legacy');
  assert.deepEqual(a, b);
});

// ---------- Monedas ----------

test('comprar un tablero de 200 con 250 monedas deja spent 200 y coins 50', () => {
  const p = v4({ coinLedger: { dev1: { earned: 250, spent: 0 } } });
  const next = withBoardThemeBought(p, 'madera', 200);
  assert.ok(next);
  assert.deepEqual(next.coinLedger.dev1, { earned: 250, spent: 200 });
  assert.equal(next.coins, 50);
  assert.equal(withBoardThemeBought(next, 'hielo', 200), null, 'no alcanza');
});

test('comprar piezas suma a spent del dispositivo actual aunque lo ganado sea de otro', () => {
  const p = v4({ coinLedger: { otro: { earned: 300, spent: 0 } } });
  const next = withPieceSetBought(p, 'marmol', 200);
  assert.ok(next);
  assert.deepEqual(next.coinLedger, { otro: { earned: 300, spent: 0 }, dev1: { earned: 0, spent: 200 } });
  assert.equal(next.coins, 100);
});

test('ganar monedas suma a earned del dispositivo y coins sigue al libro', () => {
  const now = new Date(2026, 10, 7, 12);
  const r = withLessonFinished(v4(), { lessonId: 'x', lessonCoins: 15, errors: 0, mistakes: [], seconds: 30 }, now);
  assert.deepEqual(r.progress.coinLedger, { dev1: { earned: 25, spent: 0 } });
  assert.equal(r.progress.coins, 25);
  const r2 = withPuzzleFinished(r.progress, 'p', 'clean', 10, now);
  assert.equal(r2.progress.coins, 27);
  assert.equal(r2.progress.coins, coinBalance(r2.progress.coinLedger));
});

// ---------- Fechas por campo ----------

test('withProfile marca stamps.level solo si cambia el nivel', () => {
  const at = new Date('2026-11-07T10:00:00.000Z');
  const p = withProfile(v4(), { onboarded: true }, at);
  assert.deepEqual(p.stamps, {});
  const q = withProfile(p, { level: 'casual' }, at);
  assert.equal(q.profile.level, 'casual');
  assert.equal(q.stamps.level, at.toISOString());
});

test('withLastUnit marca stamps.lastUnit', () => {
  const at = new Date('2026-11-07T10:00:00.000Z');
  const p = withLastUnit(v4(), 3, at);
  assert.equal(p.lastUnit, 3);
  assert.equal(p.stamps.lastUnit, at.toISOString());
});

// ---------- Borrar ----------

test('withReset conserva el perfil y el sello del nivel, da un deviceId nuevo, pone resetAt y deja lo demás en blanco', () => {
  const at = new Date('2026-11-07T10:00:00.000Z');
  const p = v4({
    profile: { onboarded: true, level: 'casual' },
    stamps: { level: '2026-11-01T00:00:00.000Z', lastUnit: '2026-11-02T00:00:00.000Z' },
    lastUnit: 4,
    lessons: { x: { done: true, errors: 0, completedAt: '2026-11-01T00:00:00.000Z', completions: 1 } },
    coinLedger: { dev1: { earned: 90, spent: 0 } },
  });
  const r = withReset(p, at);
  // Id nuevo: los contadores viejos quedan bajo el id viejo y una copia restaurada se suma, no se pisa.
  assert.notEqual(r.deviceId, 'dev1');
  assert.ok(r.deviceId.length >= 8);
  assert.deepEqual(r.stamps, { level: '2026-11-01T00:00:00.000Z' });
  assert.deepEqual(r.profile, p.profile);
  assert.equal(r.resetAt, at.toISOString());
  assert.deepEqual(r.lessons, {});
  assert.deepEqual(r.coinLedger, {});
  assert.equal(r.coins, 0);
  assert.equal(r.lastUnit, undefined);
});

// ---------- Lectura ----------

test('randomId da ids distintos', () => {
  const a = randomId();
  assert.equal(typeof a, 'string');
  assert.ok(a.length >= 8);
  assert.notEqual(a, randomId());
});

test('si getItem lanza, loadProgress devuelve canSave false y no llama a setItem', async () => {
  const setItem = mock.method(AsyncStorage, 'setItem', async () => {});
  mock.method(AsyncStorage, 'getItem', async () => {
    throw new Error('disco');
  });
  const r = await loadProgress('dev1');
  assert.equal(r.canSave, false);
  assert.equal(setItem.mock.callCount(), 0);
  assert.equal(r.progress.version, 4);
});

test('sin nada guardado, loadProgress da un progreso vacío con el deviceId nuevo', async () => {
  const { setItem } = fakeStorage();
  const r = await loadProgress('dev1');
  assert.equal(r.canSave, true);
  assert.equal(r.progress.deviceId, 'dev1');
  assert.equal(r.progress.coins, 0);
  assert.equal(setItem.mock.callCount(), 0);
});

test('loadProgress migra la versión 3, la guarda como 4 y la siguiente lectura no duplica monedas', async () => {
  const { map } = fakeStorage({ [KEY]: JSON.stringify(v3) });
  const first = await loadProgress('dev1');
  assert.equal(first.canSave, true);
  assert.equal(first.progress.coins, 120);
  assert.deepEqual(first.progress.lessons, v3.lessons);
  const stored = JSON.parse(map.get(KEY)!);
  assert.equal(stored.version, 4);
  assert.equal(stored.deviceId, 'dev1');
  const second = await loadProgress('dev2');
  assert.equal(second.progress.deviceId, 'dev1');
  assert.equal(second.progress.coins, 120);
  assert.deepEqual(second.progress.coinLedger, { dev1: { earned: 120, spent: 0 } });
});

test('loadProgress lee la versión 4 sin volver a escribirla', async () => {
  const saved = v4({ coinLedger: { dev1: { earned: 10, spent: 0 } } });
  const { setItem } = fakeStorage({ [KEY]: JSON.stringify(saved) });
  const r = await loadProgress('otro');
  assert.deepEqual(r.progress, saved);
  assert.equal(setItem.mock.callCount(), 0);
});

test('datos dañados: copia de respaldo y progreso vacío', async () => {
  const { map } = fakeStorage({ [KEY]: '{roto' });
  const r = await loadProgress('dev1');
  assert.equal(r.canSave, true);
  assert.equal(r.progress.deviceId, 'dev1');
  assert.equal(map.get('ajedrez:progreso:respaldo'), '{roto');
  assert.equal(map.get(KEY), '{roto');
});
