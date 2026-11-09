import test, { afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { repairStructure } from './structure';
import {
  coinBalance,
  emptyProgress,
  loadProgress,
  migrate,
  randomId,
  withBoardThemeBought,
  withLastUnit,
  withOngoingGame,
  withPuzzleOpened,
  type OngoingGame,
  withLessonFinished,
  withPieceSetBought,
  withProfile,
  withPuzzleFailedNow,
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
  const r2 = withPuzzleFinished(r.progress, 'p', 'clean', 10, 1000, now);
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

// ---------- endurecimiento (auditoría de seguridad) ----------

test('comprar con un precio negativo, NaN, infinito o fraccionario no se acepta', () => {
  const p: Progress = { ...emptyProgress, deviceId: 'A', coinLedger: { A: { earned: 100, spent: 0 } }, coins: 100 };
  for (const price of [-50, NaN, Infinity, 2.5]) {
    assert.equal(withPieceSetBought(p, 'madera', price), null, `set ${price}`);
    assert.equal(withBoardThemeBought(p, 'madera', price), null, `tablero ${price}`);
  }
  assert.ok(withPieceSetBought(p, 'madera', 100));
});

test('loadProgress: rewards sin botWins se completa y no copia claves desconocidas', async () => {
  const stored = JSON.stringify({ ...emptyProgress, deviceId: 'x', rewards: { goalDate: null }, evil: 1 });
  fakeStorage({ [KEY]: stored });
  const r = await loadProgress('dev1');
  assert.deepEqual(r.progress.rewards.botWins, {});
  assert.equal('evil' in r.progress, false);
});

test('loadProgress: un progreso sano guardado por la app se lee igual', async () => {
  const sano: Progress = {
    ...emptyProgress,
    deviceId: 'x',
    coinLedger: { x: { earned: 30, spent: 10 } },
    coins: 20,
    lessons: { l1: { done: true, errors: 0, completedAt: '2026-11-01T00:00:00.000Z', completions: 1 } },
    puzzles: { p1: { result: 'clean', at: '2026-11-02T00:00:00.000Z' } },
    rewards: { goalDate: '2026-11-03', botWins: { pipo: '2026-11-03' } },
    practice: { seconds: 60, date: '2026-11-03' },
    profile: { level: 'basico', onboarded: true },
    stamps: { level: '2026-11-01T00:00:00.000Z' },
    lastUnit: 2,
  };
  fakeStorage({ [KEY]: JSON.stringify(sano) });
  const r = await loadProgress('dev1');
  assert.deepEqual(r.progress, sano);
});

// ---------- progreso guardado de cada versión: nada se pierde por un campo viejo o raro ----------

const BACKUP = 'ajedrez:progreso:respaldo';
const lessonA = { done: true, errors: 0, completedAt: '2026-11-01T00:00:00.000Z', completions: 1 };

test('loadProgress lee un progreso guardado de la versión 1 sin perder lecciones ni monedas', async () => {
  const stored = JSON.stringify({ version: 1, xp: 45, lessons: { a: { completedAt: '2026-10-01T00:00:00.000Z', bestErrors: 2, completions: 1 } } });
  const { map } = fakeStorage({ [KEY]: stored });
  const r = await loadProgress('dev1');
  assert.equal(r.progress.version, 4);
  assert.equal(r.progress.coins, 45);
  assert.equal(r.progress.lessons.a.errors, 2);
  assert.equal(map.has(BACKUP), false);
});

test('loadProgress lee la versión 2 (xp como objeto, sin rewards ni sets)', async () => {
  const stored = JSON.stringify({
    version: 2,
    profile: { level: 'casual', onboarded: true },
    lessons: { a: lessonA },
    drafts: {},
    streak: { current: 2, best: 4, lastActiveDate: '2026-10-20' },
    xp: { total: 80, today: 0, date: null },
    practice: { seconds: 30, date: '2026-10-20' },
    mistakes: [],
    games: [],
    puzzles: {},
  });
  const { map } = fakeStorage({ [KEY]: stored });
  const r = await loadProgress('dev1');
  assert.equal(r.progress.coins, 80);
  assert.deepEqual(r.progress.lessons.a, lessonA);
  assert.equal(r.progress.streak.best, 4);
  assert.equal(map.has(BACKUP), false);
});

test('loadProgress lee la versión 3 con rewards viejo (sin botWins) y la completa', async () => {
  const stored = JSON.stringify({ ...v3, rewards: { goalDate: '2026-10-27' } });
  const { map } = fakeStorage({ [KEY]: stored });
  const r = await loadProgress('dev1');
  assert.equal(r.progress.coins, 120);
  assert.deepEqual(r.progress.rewards, { goalDate: '2026-10-27', botWins: {} });
  assert.equal(map.has(BACKUP), false);
});

test('loadProgress: una sola lección dañada se quita y las demás se conservan, con copia de respaldo', async () => {
  const stored = JSON.stringify({ ...emptyProgress, deviceId: 'x', coinLedger: { x: { earned: 50, spent: 0 } }, coins: 50, lessons: { buena: lessonA, rota: { done: 'si' } } });
  const { map } = fakeStorage({ [KEY]: stored });
  const r = await loadProgress('dev1');
  assert.deepEqual(Object.keys(r.progress.lessons), ['buena']);
  assert.equal(r.progress.coins, 50);
  assert.equal(r.progress.deviceId, 'x');
  assert.equal(map.get(BACKUP), stored);
});

test('loadProgress: un campo con valor desconocido (nivel de perfil) se quita y el resto se conserva', async () => {
  const stored = JSON.stringify({ ...emptyProgress, deviceId: 'x', lessons: { a: lessonA }, profile: { level: 'experto', onboarded: true } });
  const { map } = fakeStorage({ [KEY]: stored });
  const r = await loadProgress('dev1');
  assert.deepEqual(r.progress.profile, {});
  assert.deepEqual(Object.keys(r.progress.lessons), ['a']);
  assert.equal(map.get(BACKUP), stored);
});

test('loadProgress: lessons: null deja el valor por defecto y conserva monedas y racha', async () => {
  const stored = JSON.stringify({ ...emptyProgress, deviceId: 'x', lessons: null, coinLedger: { x: { earned: 30, spent: 0 } }, coins: 30, streak: { current: 3, best: 3, lastActiveDate: '2026-11-01' } });
  const { map } = fakeStorage({ [KEY]: stored });
  const r = await loadProgress('dev1');
  assert.deepEqual(r.progress.lessons, {});
  assert.equal(r.progress.coins, 30);
  assert.equal(r.progress.streak.current, 3);
  assert.equal(map.get(BACKUP), stored);
});

test('loadProgress: si no se puede guardar la copia de respaldo, no se pisa lo guardado', async () => {
  const stored = JSON.stringify({ ...emptyProgress, deviceId: 'x', lessons: null });
  const map = new Map([[KEY, stored]]);
  const setItem = mock.method(AsyncStorage, 'setItem', async (k: string) => {
    if (k === BACKUP) throw new Error('disco lleno');
    map.set(k, 'PISADO');
  });
  mock.method(AsyncStorage, 'getItem', async (k: string) => map.get(k) ?? null);
  const r = await loadProgress('dev1');
  assert.equal(r.canSave, false);
  assert.equal(map.get(KEY), stored);
  assert.equal(setItem.mock.calls.every((c) => c.arguments[0] === BACKUP), true);
});

// ---------- Nivel de puzzles ----------

const at = new Date('2026-11-09T12:00:00.000Z');

test('el fallo se cobra en el momento y una sola vez', () => {
  const p = v4({ profile: { level: 'casual' } });
  const r = withPuzzleFailedNow(p, 'x', 1400, at);
  assert.equal(r.delta, -20);
  assert.equal(r.progress.puzzleRating?.rating, 1380);
  assert.deepEqual(r.progress.puzzleRating?.pending, ['x']);
  const again = withPuzzleFailedNow(r.progress, 'x', 1400, at);
  assert.equal(again.delta, null);
  assert.equal(again.progress, r.progress);
});

test('abandonar tras un error y volver: resolverlo no suma, sale de pending y da las monedas de siempre', () => {
  const failed = withPuzzleFailedNow(v4({ profile: { level: 'casual' } }), 'x', 1400, at).progress;
  const r = withPuzzleFinished(failed, 'x', 'clean', 10, 1400, at);
  assert.equal(r.ratingChange, null);
  assert.equal(r.progress.puzzleRating?.rating, 1380);
  assert.deepEqual(r.progress.puzzleRating?.pending, []);
  assert.equal(r.progress.puzzles.x.result, 'clean');
  assert.equal(r.coinsEarned, 2);
});

test('un acierto limpio nuevo sube; el mismo puzzle otra vez no mueve el nivel', () => {
  const r = withPuzzleFinished(v4(), 'y', 'clean', 10, 1000, at);
  assert.deepEqual(r.ratingChange, { rating: 1020, delta: 20 });
  const again = withPuzzleFinished(r.progress, 'y', 'clean', 10, 1000, at);
  assert.equal(again.ratingChange, null);
  assert.equal(again.progress.puzzleRating?.rating, 1020);
});

test('resuelto con errores sin fallo cobrado antes: baja', () => {
  const r = withPuzzleFinished(v4(), 'z', 'solved', 10, 1000, at);
  assert.deepEqual(r.ratingChange, { rating: 980, delta: -20 });
});

test('un puzzle ya terminado antes no se cobra como fallo', () => {
  const done = withPuzzleFinished(v4(), 'y', 'clean', 10, 1000, at).progress;
  assert.equal(withPuzzleFailedNow(done, 'y', 1000, at).delta, null);
});

test('pending tiene tope de 500 y descarta el más viejo', () => {
  const pending = Array.from({ length: 500 }, (_, i) => `p${i}`);
  const p = v4({ puzzleRating: { rating: 1200, rated: 600, at: null, pending } });
  const r = withPuzzleFailedNow(p, 'nuevo', 1200, at);
  assert.equal(r.progress.puzzleRating?.pending.length, 500);
  assert.equal(r.progress.puzzleRating?.pending[0], 'p1');
  assert.equal(r.progress.puzzleRating?.pending[499], 'nuevo');
});

test('borrar el progreso borra el nivel', () => {
  const p = v4({ puzzleRating: { rating: 1500, rated: 40, at: null, pending: [] } });
  assert.equal(withReset(p).puzzleRating, undefined);
});

test('una copia sin nivel no lo inventa; un nivel roto se descarta al reparar', () => {
  assert.equal(migrate(v4() as never, 'dev1').puzzleRating, undefined);
  const kept = migrate(v4({ puzzleRating: { rating: 1500, rated: 4, at: null, pending: ['a'] } }) as never, 'dev1');
  assert.equal(kept.puzzleRating?.rating, 1500);
  for (const bad of [{ rating: 'abc', rated: 1, at: null, pending: [] }, { rating: 1200, rated: 1, at: null, pending: 5 }]) {
    const { data, repaired } = repairStructure({ ...v4(), puzzleRating: bad });
    assert.equal(data.puzzleRating, undefined);
    assert.ok(repaired.includes('puzzleRating'));
  }
});

// ---------- Partida en curso ----------

const enCurso: OngoingGame = { botId: 'pipo', userColor: 'w', moves: ['e2e4', 'e7e5'], startedAt: '2026-11-09T10:00:00.000Z' };

test('withOngoingGame guarda la partida y pone stamp', () => {
  const now = new Date('2026-11-09T10:05:00.000Z');
  const p = withOngoingGame(v4(), enCurso, now);
  assert.deepEqual(p.ongoingGame, enCurso);
  assert.equal(p.stamps.ongoingGame, now.toISOString());
});

test('withOngoingGame(null) la quita y pone stamp', () => {
  const p = withOngoingGame(v4(), enCurso, new Date('2026-11-09T10:05:00.000Z'));
  const now = new Date('2026-11-09T10:09:00.000Z');
  const q = withOngoingGame(p, null, now);
  assert.equal(q.ongoingGame, undefined);
  assert.equal('ongoingGame' in q, false);
  assert.equal(q.stamps.ongoingGame, now.toISOString());
});

test('borrar el progreso borra la partida en curso', () => {
  assert.equal(withReset(withOngoingGame(v4(), enCurso)).ongoingGame, undefined);
});

test('structure: ongoingGame con moves que no es lista (u otro campo roto) se descarta al reparar; una buena se conserva', () => {
  const ok = repairStructure({ ...v4(), ongoingGame: enCurso });
  assert.deepEqual(ok.data.ongoingGame, enCurso);
  const malas = [
    { ...enCurso, moves: 'e2e4' },
    { ...enCurso, moves: [1, 2] },
    { ...enCurso, botId: 5 },
    { ...enCurso, userColor: 'x' },
    { ...enCurso, startedAt: 7 },
    { ...enCurso, practiceCourseId: 3 },
    'hola',
  ];
  for (const bad of malas) {
    const { data, repaired } = repairStructure({ ...v4(), ongoingGame: bad });
    assert.equal(data.ongoingGame, undefined);
    assert.ok(repaired.includes('ongoingGame'));
  }
});

test('migrate conserva la partida en curso', () => {
  assert.deepEqual(migrate(v4({ ongoingGame: enCurso }) as never, 'dev1').ongoingGame, enCurso);
});

// ---------- Puzzles abiertos sin terminar ----------

test('una lista de puzzles abiertos rota se descarta al reparar, sin romper', () => {
  for (const bad of ['hola', 5, [1, 'a'], { a: 1 }]) {
    const { data, repaired } = repairStructure({ ...v4(), puzzlesOpened: bad });
    assert.equal(data.puzzlesOpened, undefined);
    assert.ok(repaired.includes('puzzlesOpened'));
  }
  assert.deepEqual(migrate(v4({ puzzlesOpened: ['a', 'b'] }) as never, 'dev1').puzzlesOpened, ['a', 'b']);
});

test('withPuzzleOpened ignora un puzzle que ya está en puzzles', () => {
  const p = v4({ puzzles: { r: { result: 'failed', at: '2026-11-09T10:00:00.000Z' } } });
  assert.equal(withPuzzleOpened(p, 'r').puzzlesOpened, undefined);
});

test('withPuzzleOpened lo pone primero sin repetir', () => {
  let p = withPuzzleOpened(v4(), 'a');
  p = withPuzzleOpened(p, 'b');
  p = withPuzzleOpened(p, 'a');
  assert.deepEqual(p.puzzlesOpened, ['a', 'b']);
});

test('withPuzzleOpened guarda como mucho 200, los más recientes', () => {
  let p = v4();
  for (let i = 0; i < 205; i++) p = withPuzzleOpened(p, `p${i}`);
  assert.equal(p.puzzlesOpened?.length, 200);
  assert.equal(p.puzzlesOpened?.[0], 'p204');
  assert.equal(p.puzzlesOpened?.[199], 'p5');
});
