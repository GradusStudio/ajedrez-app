import test from 'node:test';
import assert from 'node:assert/strict';
import { parseProgressFile, progressToFile } from './progressFile';
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
