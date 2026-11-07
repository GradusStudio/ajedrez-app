import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeImport, mergeProgress } from './merge';
import { coinBalance, emptyProgress, withBoardThemeBought, withReset, type GameRecord, type Progress } from './progressStore';

/** Progreso versión 4 de ejemplo; `coins` siempre sale del libro de monedas. */
function make(over: Partial<Progress> = {}): Progress {
  const p: Progress = { ...emptyProgress, deviceId: 'A', ...over };
  return { ...p, coins: coinBalance(p.coinLedger) };
}

const lesson = (errors: number, completedAt: string, completions: number) =>
  ({ done: true, errors, completedAt, completions }) as const;

const game = (botId: string, playedAt: string, result: GameRecord['result'] = 'win'): GameRecord => ({
  botId,
  userColor: 'w',
  result,
  reason: 'Jaque mate',
  moves: ['e2e4'],
  playedAt,
});

/** Todo salvo `deviceId`, para comparar resultados conmutados. */
const sinDevice = (p: Progress) => ({ ...p, deviceId: '' });

// ---------- Una prueba por fila de la tabla del diseño ----------

test('lessons: hecha si alguna lo está; errors el menor; completedAt el más antiguo; completions el mayor', () => {
  const a = make({ lessons: { x: lesson(3, '2026-11-02T10:00:00.000Z', 1), soloA: lesson(0, '2026-11-01T00:00:00.000Z', 1) } });
  const b = make({ deviceId: 'B', lessons: { x: lesson(1, '2026-11-05T10:00:00.000Z', 4), soloB: lesson(2, '2026-11-03T00:00:00.000Z', 2) } });
  const m = mergeProgress(a, b);
  assert.deepEqual(m.lessons.x, lesson(1, '2026-11-02T10:00:00.000Z', 4));
  assert.deepEqual(m.lessons.soloA, a.lessons.soloA);
  assert.deepEqual(m.lessons.soloB, b.lessons.soloB);
});

test('drafts: se descarta si la lección ya está hecha; si no, el de stepIndex mayor', () => {
  const a = make({
    lessons: { hecha: lesson(0, '2026-11-01T00:00:00.000Z', 1) },
    drafts: { medio: { stepIndex: 2, errors: 0, mistakes: [] }, soloA: { stepIndex: 1, errors: 0, mistakes: [] } },
  });
  const b = make({
    deviceId: 'B',
    drafts: { hecha: { stepIndex: 4, errors: 1, mistakes: ['s1'] }, medio: { stepIndex: 5, errors: 2, mistakes: ['s2'] } },
  });
  const m = mergeProgress(a, b);
  assert.equal(m.drafts.hecha, undefined);
  assert.deepEqual(m.drafts.medio, { stepIndex: 5, errors: 2, mistakes: ['s2'] });
  assert.deepEqual(m.drafts.soloA, { stepIndex: 1, errors: 0, mistakes: [] });
});

test('puzzles: por puzzle, el mejor resultado (clean > solved > failed)', () => {
  const a = make({
    puzzles: {
      p1: { result: 'clean', at: '2026-11-01T00:00:00.000Z' },
      p2: { result: 'failed', at: '2026-11-04T00:00:00.000Z' },
      p3: { result: 'failed', at: '2026-11-01T00:00:00.000Z' },
    },
  });
  const b = make({
    deviceId: 'B',
    puzzles: {
      p1: { result: 'solved', at: '2026-11-05T00:00:00.000Z' },
      p2: { result: 'solved', at: '2026-11-02T00:00:00.000Z' },
      p4: { result: 'clean', at: '2026-11-02T00:00:00.000Z' },
    },
  });
  const m = mergeProgress(a, b);
  assert.equal(m.puzzles.p1.result, 'clean');
  assert.equal(m.puzzles.p2.result, 'solved');
  assert.equal(m.puzzles.p3.result, 'failed');
  assert.equal(m.puzzles.p4.result, 'clean');
});

test('turningPoints, pieceSets y boardThemes: unión', () => {
  const a = make({ turningPoints: ['t1', 't2'], pieceSets: ['madera'], boardThemes: ['hielo'] });
  const b = make({ deviceId: 'B', turningPoints: ['t2', 't3'], pieceSets: ['marmol', 'madera'], boardThemes: [] });
  const m = mergeProgress(a, b);
  assert.deepEqual([...m.turningPoints].sort(), ['t1', 't2', 't3']);
  assert.deepEqual([...m.pieceSets].sort(), ['madera', 'marmol']);
  assert.deepEqual(m.boardThemes, ['hielo']);
});

test('mistakes: unión por stepId; count el mayor; lastSeen el más reciente', () => {
  const a = make({
    mistakes: [
      { stepId: 's1', lessonId: 'l1', count: 3, lastSeen: '2026-11-01T00:00:00.000Z' },
      { stepId: 's2', lessonId: 'l1', count: 1, lastSeen: '2026-11-01T00:00:00.000Z' },
    ],
  });
  const b = make({
    deviceId: 'B',
    mistakes: [
      { stepId: 's1', lessonId: 'l1', count: 2, lastSeen: '2026-11-04T00:00:00.000Z' },
      { stepId: 's3', lessonId: 'l2', count: 1, lastSeen: '2026-11-02T00:00:00.000Z' },
    ],
  });
  const m = mergeProgress(a, b);
  const byId = Object.fromEntries(m.mistakes.map((x) => [x.stepId, x]));
  assert.equal(m.mistakes.length, 3);
  assert.deepEqual(byId.s1, { stepId: 's1', lessonId: 'l1', count: 3, lastSeen: '2026-11-04T00:00:00.000Z' });
  assert.deepEqual(byId.s2, a.mistakes[1]);
  assert.deepEqual(byId.s3, b.mistakes[1]);
});

test('games: unión por (playedAt, botId), más reciente primero; la misma partida aparece una sola vez', () => {
  const g1 = game('lola', '2026-11-01T10:00:00.000Z');
  const g2 = game('pipo', '2026-11-03T10:00:00.000Z');
  const g3 = game('ada', '2026-11-02T10:00:00.000Z', 'loss');
  const a = make({ games: [g2, g1] });
  const b = make({ deviceId: 'B', games: [g3, g1] });
  const m = mergeProgress(a, b);
  assert.deepEqual(m.games, [g2, g3, g1]);
});

test('games: tope de 50', () => {
  const at = (i: number) => new Date(Date.UTC(2026, 9, 1) + i * 3600000).toISOString();
  const a = make({ games: Array.from({ length: 40 }, (_, i) => game('lola', at(2 * i))).reverse() });
  const b = make({ deviceId: 'B', games: Array.from({ length: 40 }, (_, i) => game('lola', at(2 * i + 1))).reverse() });
  const m = mergeProgress(a, b);
  assert.equal(m.games.length, 50);
  assert.equal(m.games[0].playedAt, at(79));
  assert.equal(m.games[49].playedAt, at(30));
});

test('rewards: goalDate y cada botWins[bot], la fecha más reciente', () => {
  const a = make({ rewards: { goalDate: '2026-11-05', botWins: { lola: '2026-11-01', pipo: '2026-11-04' } } });
  const b = make({ deviceId: 'B', rewards: { goalDate: '2026-11-03', botWins: { lola: '2026-11-02', ada: '2026-10-30' } } });
  const m = mergeProgress(a, b);
  assert.deepEqual(m.rewards, { goalDate: '2026-11-05', botWins: { lola: '2026-11-02', pipo: '2026-11-04', ada: '2026-10-30' } });
  assert.equal(mergeProgress(make(), b).rewards.goalDate, '2026-11-03', 'null es la más vieja');
});

test('streak: la del lastActiveDate más reciente; best el mayor de los dos', () => {
  const a = make({ streak: { current: 2, best: 9, lastActiveDate: '2026-11-06' } });
  const b = make({ deviceId: 'B', streak: { current: 7, best: 7, lastActiveDate: '2026-11-04' } });
  assert.deepEqual(mergeProgress(a, b).streak, { current: 2, best: 9, lastActiveDate: '2026-11-06' });
  const c = make({ deviceId: 'B', streak: { current: 12, best: 12, lastActiveDate: '2026-11-05' } });
  assert.deepEqual(mergeProgress(a, c).streak, { current: 2, best: 12, lastActiveDate: '2026-11-06' });
});

test('streak: el mismo día gana la de current mayor', () => {
  const a = make({ streak: { current: 3, best: 3, lastActiveDate: '2026-11-06' } });
  const b = make({ deviceId: 'B', streak: { current: 5, best: 5, lastActiveDate: '2026-11-06' } });
  assert.deepEqual(mergeProgress(a, b).streak, { current: 5, best: 5, lastActiveDate: '2026-11-06' });
});

test('practice: mismo día el mayor; distinto, el del día más reciente', () => {
  const a = make({ practice: { seconds: 300, date: '2026-11-06' } });
  const b = make({ deviceId: 'B', practice: { seconds: 900, date: '2026-11-06' } });
  assert.deepEqual(mergeProgress(a, b).practice, { seconds: 900, date: '2026-11-06' });
  const c = make({ deviceId: 'B', practice: { seconds: 2000, date: '2026-11-05' } });
  assert.deepEqual(mergeProgress(a, c).practice, { seconds: 300, date: '2026-11-06' });
});

test('profile: onboarded si alguno; level el del dispositivo que lo cambió último', () => {
  const a = make({ profile: { onboarded: true, level: 'nuevo' }, stamps: { level: '2026-11-01T00:00:00.000Z' } });
  const b = make({ deviceId: 'B', profile: { level: 'casual' }, stamps: { level: '2026-11-03T00:00:00.000Z' } });
  const m = mergeProgress(a, b);
  assert.deepEqual(m.profile, { onboarded: true, level: 'casual' });
  assert.equal(m.stamps.level, '2026-11-03T00:00:00.000Z');
  // Sin fecha cuenta como la más vieja.
  const c = make({ deviceId: 'C', profile: { level: 'basico' } });
  assert.equal(mergeProgress(a, c).profile.level, 'nuevo');
});

test('lastUnit: el del dispositivo que lo cambió último', () => {
  const a = make({ lastUnit: 2, stamps: { lastUnit: '2026-11-05T00:00:00.000Z' } });
  const b = make({ deviceId: 'B', lastUnit: 4, stamps: { lastUnit: '2026-11-02T00:00:00.000Z' } });
  const m = mergeProgress(a, b);
  assert.equal(m.lastUnit, 2);
  assert.equal(m.stamps.lastUnit, '2026-11-05T00:00:00.000Z');
  const c = make({ deviceId: 'C' });
  assert.equal(mergeProgress(c, b).lastUnit, 4);
});

// ---------- Monedas ----------

test('monedas: por dispositivo, el mayor de cada contador; saldo = ganado - gastado', () => {
  const a = make({ coinLedger: { A: { earned: 30, spent: 0 } } });
  const b = make({ deviceId: 'B', coinLedger: { B: { earned: 15, spent: 10 } } });
  const m = mergeProgress(a, b);
  assert.equal(m.coins, 35);
  assert.deepEqual(m.coinLedger, { A: { earned: 30, spent: 0 }, B: { earned: 15, spent: 10 } });
  const twice = mergeProgress(m, b);
  assert.equal(twice.coins, 35);
  assert.equal(mergeProgress(twice, a).coins, 35);
});

test('monedas: una copia vieja del mismo dispositivo no suma de nuevo', () => {
  const old = make({ coinLedger: { A: { earned: 40, spent: 0 } } });
  const now = make({ coinLedger: { A: { earned: 70, spent: 200 }, legacy: { earned: 300, spent: 0 } } });
  const m = mergeProgress(now, old);
  assert.deepEqual(m.coinLedger, now.coinLedger);
  assert.equal(m.coins, 170);
});

// ---------- Borrar progreso (resetAt) ----------

test('resetAt: si el de incoming es más reciente, gana entero y se conserva el deviceId local', () => {
  const a = make({
    resetAt: '2026-11-01T00:00:00.000Z',
    lessons: { viejo: lesson(0, '2026-10-20T00:00:00.000Z', 1) },
    coinLedger: { A: { earned: 500, spent: 0 } },
  });
  const b = make({ deviceId: 'B', resetAt: '2026-11-04T00:00:00.000Z', lessons: { nuevo: lesson(1, '2026-11-05T00:00:00.000Z', 1) } });
  const m = mergeProgress(a, b);
  assert.deepEqual(Object.keys(m.lessons), ['nuevo']);
  assert.equal(m.coins, 0);
  assert.equal(m.resetAt, '2026-11-04T00:00:00.000Z');
  assert.equal(m.deviceId, 'A');
});

test('resetAt: null es el más viejo', () => {
  const a = make({ lessons: { viejo: lesson(0, '2026-10-20T00:00:00.000Z', 1) } });
  const b = make({ deviceId: 'B', resetAt: '2026-11-04T00:00:00.000Z', lessons: { nuevo: lesson(1, '2026-11-05T00:00:00.000Z', 1) } });
  assert.deepEqual(Object.keys(mergeProgress(a, b).lessons), ['nuevo']);
  assert.deepEqual(Object.keys(mergeProgress(b, a).lessons), ['nuevo']);
  assert.equal(mergeProgress(b, a).deviceId, 'B');
});

test('resetAt: iguales, se combinan los campos', () => {
  const at = '2026-11-01T00:00:00.000Z';
  const a = make({ resetAt: at, lessons: { x: lesson(0, at, 1) } });
  const b = make({ deviceId: 'B', resetAt: at, lessons: { y: lesson(0, at, 1) } });
  assert.deepEqual(Object.keys(mergeProgress(a, b).lessons).sort(), ['x', 'y']);
});

// ---------- Propiedades ----------

function variedPair(): [Progress, Progress] {
  const a = make({
    profile: { onboarded: true, level: 'basico' },
    stamps: { level: '2026-11-02T00:00:00.000Z', lastUnit: '2026-11-06T00:00:00.000Z' },
    lastUnit: 3,
    lessons: { 'u1-l01': lesson(2, '2026-11-01T00:00:00.000Z', 1), 'u1-l02': lesson(0, '2026-11-02T00:00:00.000Z', 3) },
    drafts: { 'u1-l03': { stepIndex: 2, errors: 1, mistakes: ['a'] }, 'u2-l01': { stepIndex: 1, errors: 0, mistakes: [] } },
    streak: { current: 4, best: 4, lastActiveDate: '2026-11-06', actions: { date: '2026-11-06', lesson: true, puzzle: false, bot: false } },
    coinLedger: { A: { earned: 120, spent: 0 }, legacy: { earned: 50, spent: 0 } },
    rewards: { goalDate: '2026-11-06', botWins: { lola: '2026-11-05' } },
    pieceSets: ['madera', 'hielo'],
    boardThemes: ['magma'],
    practice: { seconds: 400, date: '2026-11-06' },
    mistakes: [
      { stepId: 'z', lessonId: 'u1-l02', count: 2, lastSeen: '2026-11-02T00:00:00.000Z' },
      { stepId: 'b', lessonId: 'u1-l01', count: 1, lastSeen: '2026-11-01T00:00:00.000Z' },
    ],
    games: [game('lola', '2026-11-05T00:00:00.000Z'), game('pipo', '2026-11-01T00:00:00.000Z', 'draw')],
    puzzles: { p1: { result: 'solved', at: '2026-11-03T00:00:00.000Z' } },
    turningPoints: ['tp2', 'tp1'],
  });
  const b = make({
    deviceId: 'B',
    profile: { level: 'casual' },
    stamps: { level: '2026-11-04T00:00:00.000Z' },
    lastUnit: 5,
    lessons: { 'u1-l01': lesson(0, '2026-11-03T00:00:00.000Z', 2), 'u1-l03': lesson(1, '2026-11-04T00:00:00.000Z', 1) },
    drafts: { 'u2-l01': { stepIndex: 1, errors: 3, mistakes: ['q'] }, 'u3-l01': { stepIndex: 6, errors: 0, mistakes: [] } },
    streak: { current: 9, best: 11, lastActiveDate: '2026-11-06', actions: { date: '2026-11-06', lesson: false, puzzle: true, bot: false } },
    coinLedger: { B: { earned: 80, spent: 20 }, legacy: { earned: 50, spent: 0 } },
    rewards: { goalDate: '2026-11-04', botWins: { lola: '2026-11-06', ada: '2026-11-01' } },
    pieceSets: ['marmol'],
    boardThemes: ['magma', 'madera'],
    practice: { seconds: 1200, date: '2026-11-05' },
    mistakes: [{ stepId: 'b', lessonId: 'u1-l01', count: 4, lastSeen: '2026-10-30T00:00:00.000Z' }],
    games: [game('ada', '2026-11-06T00:00:00.000Z', 'loss'), game('lola', '2026-11-05T00:00:00.000Z')],
    puzzles: { p1: { result: 'solved', at: '2026-11-04T00:00:00.000Z' }, p2: { result: 'failed', at: '2026-11-01T00:00:00.000Z' } },
    turningPoints: ['tp3', 'tp1'],
  });
  return [a, b];
}

test('conmutativa: mergeProgress(a, b) y mergeProgress(b, a) dan lo mismo salvo deviceId', () => {
  const [a, b] = variedPair();
  const ab = mergeProgress(a, b);
  const ba = mergeProgress(b, a);
  assert.equal(ab.deviceId, 'A');
  assert.equal(ba.deviceId, 'B');
  assert.deepEqual(sinDevice(ab), sinDevice(ba));
});

test('conmutativa con resetAt distintos', () => {
  const [a, b] = variedPair();
  const a2 = { ...a, resetAt: '2026-11-03T00:00:00.000Z' };
  assert.deepEqual(sinDevice(mergeProgress(a2, b)), sinDevice(mergeProgress(b, a2)));
});

test('idempotente: mergeProgress(a, a) es igual a a', () => {
  const [a, b] = variedPair();
  const canon = mergeProgress(a, b);
  assert.deepEqual(mergeProgress(canon, canon), canon);
  const simple = make({
    lessons: { x: lesson(1, '2026-11-01T00:00:00.000Z', 2) },
    coinLedger: { A: { earned: 30, spent: 10 } },
    pieceSets: ['madera'],
    profile: { onboarded: true, level: 'nuevo' },
  });
  assert.deepEqual(mergeProgress(simple, simple), simple);
});

test('idempotente con lo ya combinado: volver a combinar con una de las partes no cambia nada', () => {
  const [a, b] = variedPair();
  const ab = mergeProgress(a, b);
  assert.deepEqual(mergeProgress(ab, b), ab);
  assert.deepEqual(sinDevice(mergeProgress(ab, a)), sinDevice(ab));
});

test('el resultado tiene version 4 y coins igual al saldo del libro', () => {
  const [a, b] = variedPair();
  const m = mergeProgress(a, b);
  assert.equal(m.version, 4);
  assert.equal(m.coins, coinBalance(m.coinLedger));
  assert.equal(m.coins, 120 + 50 + 80 - 20);
});

// ---------- mergeImport: restaurar a mano un archivo ----------

const backup = make({
  coinLedger: { A: { earned: 120, spent: 20 } },
  lessons: { x: lesson(1, '2026-11-02T10:00:00.000Z', 1), y: lesson(0, '2026-11-03T10:00:00.000Z', 1) },
});

test('mergeImport: tras borrar el progreso en este dispositivo, la copia vuelve con sus lecciones y monedas', () => {
  const local = make({ resetAt: '2026-11-07T12:00:00.000Z' });
  const m = mergeImport(local, backup);
  assert.deepEqual(m.lessons, backup.lessons);
  assert.equal(m.coins, 100);
  assert.equal(m.resetAt, local.resetAt);
});

test('mergeImport: lo hecho después del borrado se conserva junto con la copia', () => {
  const local = make({
    resetAt: '2026-11-07T12:00:00.000Z',
    coinLedger: { A: { earned: 150, spent: 0 } },
    lessons: { z: lesson(2, '2026-11-07T13:00:00.000Z', 1) },
  });
  const m = mergeImport(local, backup);
  assert.deepEqual(Object.keys(m.lessons).sort(), ['x', 'y', 'z']);
  // Mismo dispositivo: de cada contador, el mayor. Ganado 150, gastado 20.
  assert.deepEqual(m.coinLedger, { A: { earned: 150, spent: 20 } });
  assert.equal(m.coins, 130);
});

test('mergeImport: un resetAt más nuevo en la copia no borra lo local', () => {
  const local = make({ lessons: { z: lesson(2, '2026-11-07T13:00:00.000Z', 1) }, coinLedger: { A: { earned: 10, spent: 0 } } });
  const m = mergeImport(local, { ...backup, resetAt: '2026-11-09T00:00:00.000Z' });
  assert.ok(m.lessons.z);
  assert.ok(m.lessons.x);
  assert.equal(m.resetAt, null);
});

test('mergeImport: el resetAt del resultado es el local', () => {
  const local = make({ resetAt: '2026-11-05T00:00:00.000Z' });
  assert.equal(mergeImport(local, { ...backup, resetAt: '2026-11-06T00:00:00.000Z' }).resetAt, local.resetAt);
  assert.equal(mergeImport(make(), { ...backup, resetAt: '2026-11-06T00:00:00.000Z' }).resetAt, null);
});

test('mergeImport: es idempotente', () => {
  const local = make({ resetAt: '2026-11-07T12:00:00.000Z', lessons: { z: lesson(2, '2026-11-07T13:00:00.000Z', 1) } });
  const r = mergeImport(local, backup);
  assert.deepEqual(mergeImport(r, backup), r);
});

// ---------- Restaurar una copia después de «Borrar progreso» ----------

/** Este dispositivo (`A`) ganó 500 monedas y guardó una copia; después borró el progreso. */
const before = make({ coinLedger: { A: { earned: 500, spent: 0 } } });
const savedCopy = before;
const at = new Date('2026-11-07T12:00:00.000Z');

/** Suma lo ganado y gastado después del borrado, en el contador del dispositivo actual. */
const afterReset = (earned: number, spent: number) => {
  const r = withReset(before, at);
  const coinLedger = { [r.deviceId]: { earned, spent } };
  return { ...r, coinLedger, coins: coinBalance(coinLedger) };
};

test('restaurar tras borrar: lo ganado después del borrado se suma a la copia (500 + 300)', () => {
  assert.equal(mergeImport(afterReset(300, 0), savedCopy).coins, 800);
});

test('restaurar tras borrar: ganar 300 y gastar 200 después del borrado, con una copia de 500, deja 600', () => {
  assert.equal(mergeImport(afterReset(300, 200), savedCopy).coins, 600);
});

test('restaurar tras borrar con compras reales: comprar después del borrado no se pierde al restaurar', () => {
  let p = withReset(before, at);
  p = { ...p, coinLedger: { [p.deviceId]: { earned: 300, spent: 0 } }, coins: 300 };
  const bought = withBoardThemeBought(p, 'madera', 200);
  assert.ok(bought);
  const m = mergeImport(bought, savedCopy);
  assert.equal(m.coins, 600);
  assert.deepEqual(m.boardThemes, ['madera']);
});
