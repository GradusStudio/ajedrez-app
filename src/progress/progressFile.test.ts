import test from 'node:test';
import assert from 'node:assert/strict';
import { parseProgressFile, progressToFile } from './progressFile';
import { mergeProgress } from './merge';
import { coinBalance, emptyProgress, type Progress } from './progressStore';

function make(over: Partial<Progress> = {}): Progress {
  const p: Progress = { ...emptyProgress, deviceId: 'A', ...over };
  return { ...p, coins: coinBalance(p.coinLedger) };
}

const sample = make({
  coinLedger: { A: { earned: 40, spent: 10 } },
  lessons: { l1: { done: true, errors: 1, completedAt: '2026-11-01T00:00:00.000Z', completions: 2 } },
  streak: { current: 3, best: 5, lastActiveDate: '2026-11-06' },
  mistakes: [{ stepId: 's1', lessonId: 'l1', count: 2, lastSeen: '2026-11-02' }],
  pieceSets: ['madera'],
});

/** Archivo con el progreso dado, tal cual (sin pasar por progressToFile). */
const file = (progress: unknown, extra: Record<string, unknown> = {}) =>
  JSON.stringify({ app: 'gradus', kind: 'progress', exportedAt: '2026-11-07T10:00:00.000Z', progress, ...extra });

const rejects = (text: string) => {
  const r = parseProgressFile(text);
  assert.equal(r.ok, false);
  return r.ok ? '' : r.error;
};

test('ida y vuelta: el progreso exportado se lee igual', () => {
  const text = progressToFile(sample, new Date('2026-11-07T10:00:00.000Z'));
  const parsed = JSON.parse(text);
  assert.equal(parsed.app, 'gradus');
  assert.equal(parsed.kind, 'progress');
  assert.equal(parsed.exportedAt, '2026-11-07T10:00:00.000Z');
  const r = parseProgressFile(text);
  assert.equal(r.ok, true);
  if (r.ok) assert.deepEqual(r.progress, sample);
});

test('texto que no es JSON: notJson', () => {
  assert.equal(rejects('hola'), 'notJson');
  assert.equal(rejects(''), 'notJson');
});

test('JSON de otra app o de otra clase: notGradus', () => {
  assert.equal(rejects('{"app":"otra"}'), 'notGradus');
  assert.equal(rejects('[1,2]'), 'notGradus');
  assert.equal(rejects('null'), 'notGradus');
  assert.equal(rejects(file(sample, { kind: 'ajustes' })), 'notGradus');
  assert.equal(rejects(JSON.stringify({ app: 'gradus', kind: 'progress' })), 'notGradus');
});

test('versión mayor que 4: tooNew', () => {
  assert.equal(rejects(file({ ...sample, version: 5 })), 'tooNew');
});

test('versión ilegible o menor que 1: notGradus', () => {
  assert.equal(rejects(file({ ...sample, version: 'x' })), 'notGradus');
  assert.equal(rejects(file({ ...sample, version: 0 })), 'notGradus');
});

test('un archivo versión 3 se migra a la 4 con el id fijo legacy', () => {
  const { deviceId: _d, resetAt: _r, coinLedger: _l, stamps: _s, ...base } = emptyProgress;
  const v3 = { ...base, version: 3, coins: 25, streak: { current: 1, best: 2, lastActiveDate: '2026-11-01' } };
  const r = parseProgressFile(file(v3));
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.progress.version, 4);
  assert.equal(r.progress.deviceId, 'legacy');
  assert.deepEqual(r.progress.coinLedger, { legacy: { earned: 25, spent: 0 } });
  assert.equal(r.progress.coins, 25);
});

test('un archivo versión 1 se migra: las lecciones pasan a hechas', () => {
  const v1 = {
    version: 1,
    xp: 12,
    lessons: { a: { bestErrors: 2, completedAt: '2026-10-01T00:00:00.000Z', completions: 1 } },
    streak: { current: 1, best: 1, lastActiveDate: null },
  };
  const r = parseProgressFile(file(v1));
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.progress.lessons.a.done, true);
    assert.equal(r.progress.coins, 12);
  }
});

test('progress que no es un objeto: notGradus', () => {
  assert.equal(rejects(file('texto')), 'notGradus');
  assert.equal(rejects(file(null)), 'notGradus');
  assert.equal(rejects(file([sample])), 'notGradus');
});

test('lessons, puzzles o drafts que no son objetos: notGradus', () => {
  for (const k of ['lessons', 'puzzles', 'drafts']) {
    assert.equal(rejects(file({ ...sample, [k]: [] })), 'notGradus', k);
    assert.equal(rejects(file({ ...sample, [k]: 'x' })), 'notGradus', k);
    assert.equal(rejects(file({ ...sample, [k]: null })), 'notGradus', k);
  }
});

test('listas que no son arreglos: notGradus', () => {
  for (const k of ['mistakes', 'games', 'pieceSets', 'boardThemes', 'turningPoints']) {
    assert.equal(rejects(file({ ...sample, [k]: {} })), 'notGradus', k);
    assert.equal(rejects(file({ ...sample, [k]: 'x' })), 'notGradus', k);
  }
});

test('coinLedger con contadores que no son números finitos y no negativos: notGradus', () => {
  const bad = [
    { A: { earned: 'mucho', spent: 0 } },
    { A: { earned: 5, spent: -1 } },
    { A: { earned: null, spent: 0 } },
    { A: { earned: 5 } },
    { A: 7 },
    [],
  ];
  for (const ledger of bad) assert.equal(rejects(file({ ...sample, coinLedger: ledger })), 'notGradus', JSON.stringify(ledger));
  // Infinity no existe en JSON; 1e999 se lee como Infinity.
  const text = file(sample).replace('"earned":40', '"earned":1e999');
  assert.equal(rejects(text), 'notGradus');
});

test('streak sin campos numéricos: notGradus', () => {
  assert.equal(rejects(file({ ...sample, streak: undefined })), 'notGradus');
  assert.equal(rejects(file({ ...sample, streak: { best: 1 } })), 'notGradus');
  assert.equal(rejects(file({ ...sample, streak: { current: 'x', best: 1, lastActiveDate: null } })), 'notGradus');
  assert.equal(rejects(file({ ...sample, streak: [] })), 'notGradus');
});

// ---------- Forma de cada elemento y topes ----------

test('lessons con un valor que no es una lección: notGradus', () => {
  assert.equal(rejects(file({ ...sample, lessons: { a: null } })), 'notGradus');
  assert.equal(rejects(file({ ...sample, lessons: { a: { done: false, errors: 0, completedAt: 'x', completions: 1 } } })), 'notGradus');
  assert.equal(rejects(file({ ...sample, lessons: { a: { done: true, errors: -1, completedAt: 'x', completions: 1 } } })), 'notGradus');
  assert.equal(rejects(file({ ...sample, lessons: { a: { done: true, errors: 0, completedAt: 5, completions: 1 } } })), 'notGradus');
});

test('puzzles y drafts con valores mal formados: notGradus', () => {
  assert.equal(rejects(file({ ...sample, puzzles: { a: { result: 'ganado', at: 'x' } } })), 'notGradus');
  assert.equal(rejects(file({ ...sample, puzzles: { a: null } })), 'notGradus');
  assert.equal(rejects(file({ ...sample, drafts: { a: { stepIndex: 'uno', errors: 0, mistakes: [] } } })), 'notGradus');
  assert.equal(rejects(file({ ...sample, drafts: { a: { stepIndex: 1, errors: 0, mistakes: [3] } } })), 'notGradus');
});

test('mistakes y games con elementos mal formados: notGradus', () => {
  assert.equal(rejects(file({ ...sample, mistakes: [null] })), 'notGradus');
  assert.equal(rejects(file({ ...sample, mistakes: [{ stepId: 's', lessonId: 'l', count: 'x', lastSeen: 'd' }] })), 'notGradus');
  const g = { botId: 'b', userColor: 'w', result: 'win', reason: 'r', moves: ['e2e4'], playedAt: 'd' };
  assert.equal(rejects(file({ ...sample, games: [null] })), 'notGradus');
  assert.equal(rejects(file({ ...sample, games: [{ ...g, userColor: 'x' }] })), 'notGradus');
  assert.equal(rejects(file({ ...sample, games: [{ ...g, result: 'gana' }] })), 'notGradus');
  assert.equal(rejects(file({ ...sample, games: [{ ...g, moves: 'e2e4' }] })), 'notGradus');
  assert.equal(parseProgressFile(file({ ...sample, games: [g] })).ok, true);
});

test('pieceSets, boardThemes y turningPoints con elementos que no son texto: notGradus', () => {
  for (const k of ['pieceSets', 'boardThemes', 'turningPoints']) assert.equal(rejects(file({ ...sample, [k]: [1] })), 'notGradus', k);
});

test('deviceId, resetAt, stamps y lastActiveDate con el tipo equivocado: notGradus', () => {
  assert.equal(rejects(file({ ...sample, deviceId: 5 })), 'notGradus');
  assert.equal(rejects(file({ ...sample, resetAt: 5 })), 'notGradus');
  assert.equal(rejects(file({ ...sample, stamps: { level: 5 } })), 'notGradus');
  assert.equal(rejects(file({ ...sample, streak: { current: 1, best: 1, lastActiveDate: 20261107 } })), 'notGradus');
});

test('racha negativa o contadores sobre el tope: notGradus', () => {
  assert.equal(rejects(file({ ...sample, streak: { current: -1, best: 1, lastActiveDate: null } })), 'notGradus');
  assert.equal(rejects(file({ ...sample, coinLedger: { A: { earned: 1e300, spent: 0 } } })), 'notGradus');
  assert.equal(rejects(file({ ...sample, coinLedger: { A: { earned: 1_000_000_001, spent: 0 } } })), 'notGradus');
  assert.equal(rejects(file({ ...sample, streak: { current: 1e300, best: 1, lastActiveDate: null } })), 'notGradus');
  assert.equal(parseProgressFile(file({ ...sample, coinLedger: { A: { earned: 1_000_000_000, spent: 0 } } })).ok, true);
});

test('claves __proto__, constructor o prototype en registros: notGradus', () => {
  const at = '2026-11-01T00:00:00.000Z';
  const cases: Record<string, (k: string) => Record<string, unknown>> = {
    lessons: (k) => ({ lessons: { [k]: { done: true, errors: 0, completedAt: at, completions: 1 } } }),
    puzzles: (k) => ({ puzzles: { [k]: { result: 'clean', at } } }),
    drafts: (k) => ({ drafts: { [k]: { stepIndex: 1, errors: 0, mistakes: [] } } }),
    coinLedger: (k) => ({ coinLedger: { [k]: { earned: 5, spent: 0 } } }),
    botWins: (k) => ({ rewards: { goalDate: null, botWins: { [k]: at } } }),
    stamps: (k) => ({ stamps: { [k]: at } }),
  };
  for (const [name, make] of Object.entries(cases)) {
    // El marcador se reemplaza en el texto: un objeto de JS no puede tener una clave __proto__ propia escrita así.
    assert.equal(parseProgressFile(file({ ...sample, ...make('CLAVE') })).ok, true, name);
    for (const bad of ['__proto__', 'constructor', 'prototype']) {
      const text = file({ ...sample, ...make('CLAVE') }).replace('"CLAVE"', JSON.stringify(bad));
      assert.equal(rejects(text), 'notGradus', `${name} ${bad}`);
    }
  }
});

// ---------- endurecimiento (auditoría de seguridad) ----------

test('rewards sin botWins se importa y queda con botWins vacío (no rompe la mezcla ni la sincronización)', () => {
  const r = parseProgressFile(file({ ...sample, rewards: { goalDate: null } }));
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.deepEqual(r.progress.rewards.botWins, {});
  assert.doesNotThrow(() => mergeProgress(sample, r.progress));
});
test('rewards: goalDate que no es texto ni nulo, o botWins con valores que no son texto, se rechazan', () => {
  assert.equal(rejects(file({ ...sample, rewards: { goalDate: 5, botWins: {} } })), 'notGradus');
  assert.equal(rejects(file({ ...sample, rewards: { goalDate: null, botWins: { b1: 7 } } })), 'notGradus');
});
test('practice con seconds que no es contador o date que no es texto se rechaza', () => {
  assert.equal(rejects(file({ ...sample, practice: { date: null } })), 'notGradus');
  assert.equal(rejects(file({ ...sample, practice: { seconds: 'x', date: null } })), 'notGradus');
  assert.equal(rejects(file({ ...sample, practice: { seconds: 5, date: 3 } })), 'notGradus');
});
test('profile: nivel desconocido u onboarded que no es booleano se rechazan; lastUnit tiene que ser entero', () => {
  assert.equal(rejects(file({ ...sample, profile: { level: 'dios' } })), 'notGradus');
  assert.equal(rejects(file({ ...sample, profile: { onboarded: 'si' } })), 'notGradus');
  assert.equal(rejects(file({ ...sample, lastUnit: 1.5 })), 'notGradus');
  assert.equal(rejects(file({ ...sample, lastUnit: 'x' })), 'notGradus');
});
test('profile y lastUnit válidos se conservan', () => {
  const r = parseProgressFile(file({ ...sample, profile: { level: 'casual', onboarded: true }, lastUnit: 3 }));
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.deepEqual(r.progress.profile, { level: 'casual', onboarded: true });
    assert.equal(r.progress.lastUnit, 3);
  }
});
test('un borrador con stepIndex fraccionario se rechaza', () => {
  assert.equal(rejects(file({ ...sample, drafts: { l1: { stepIndex: 1.5, errors: 0, mistakes: [] } } })), 'notGradus');
});
test('claves desconocidas del nivel superior no pasan al progreso', () => {
  const r = parseProgressFile(file({ ...sample, evil: { x: 1 }, otra: 'cosa' }));
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal('evil' in r.progress, false);
    assert.equal('otra' in r.progress, false);
  }
});
test('un archivo enorme se rechaza sin intentar leerlo', () => {
  const big = file({ ...sample }, { relleno: 'x'.repeat(6_000_000) });
  assert.equal(rejects(big), 'notGradus');
});
