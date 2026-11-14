import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Lesson, Step, Unit } from '../data/lessonTypes';
import type { Progress } from './progressStore';
import { unitOpen, unitTestSteps } from './path';

const step = (id: string, type: Step['type']): Step =>
  ({
    id,
    type,
    fen: '8/8/8/8/8/8/8/K6k w - - 0 1',
    text: 'texto',
    prompt: 'pregunta',
    options: ['a'],
    answer: 0,
    explanation: '',
    solutions: [],
    hint: '',
    success: '',
    moves: [],
    side: 'w',
    mode: 'drill',
  }) as unknown as Step;

const lesson = (id: string, types: Step['type'][]): Lesson => ({
  id,
  order: 1,
  title: id,
  summary: '',
  xp: 0,
  steps: types.map((type, i) => step(`${id}-s${i}`, type)),
});
const unit = (n: number, lessons: Lesson[]): Unit => ({ unit: n, title: `Unidad ${n}`, lessons });

const progress = (patch: Partial<Progress> = {}): Progress =>
  ({
    version: 4,
    deviceId: 'test',
    resetAt: null,
    coinLedger: {},
    stamps: {},
    profile: {},
    lessons: {},
    drafts: {},
    streak: { current: 0, best: 0, lastActiveDate: null },
    coins: 0,
    rewards: { goalDate: null, botWins: {} },
    pieceSets: [],
    boardThemes: [],
    practice: { seconds: 0, date: null },
    mistakes: [],
    games: [],
    puzzles: {},
    turningPoints: [],
    unitTests: [],
    ...patch,
  }) as Progress;

const done = (ids: string[]) =>
  Object.fromEntries(ids.map((id) => [id, { done: true as const, errors: 0, completedAt: '2026-11-14T00:00:00.000Z', completions: 1 }]));

const units = [
  unit(1, [lesson('u1-l01', ['explain', 'move']), lesson('u1-l02', ['quiz'])]),
  unit(2, [lesson('u2-l01', ['move']), lesson('u2-l02', ['line'])]),
  unit(3, [lesson('u3-l01', ['quiz'])]),
];

test('nuevo sin progreso: solo la Unidad 1', () => {
  assert.deepEqual(unitOpen(units, progress({ profile: { level: 'nuevo' } })), [1]);
});

test('nuevo con la Unidad 1 completa: se abre la 2', () => {
  const p = progress({ profile: { level: 'nuevo' }, lessons: done(['u1-l01', 'u1-l02']) });
  assert.deepEqual(unitOpen(units, p), [1, 2]);
});

test('nuevo con la prueba aprobada: se abre esa unidad aunque falte la anterior', () => {
  const p = progress({ profile: { level: 'nuevo' }, unitTests: [3] });
  assert.deepEqual(unitOpen(units, p), [1, 3]);
});

test('una unidad con una lección hecha cuenta como abierta', () => {
  const p = progress({ profile: { level: 'nuevo' }, lessons: done(['u2-l01']) });
  assert.deepEqual(unitOpen(units, p), [1, 2]);
});

test('básico y casual tienen todo abierto', () => {
  assert.deepEqual(unitOpen(units, progress({ profile: { level: 'basico' } })), [1, 2, 3]);
  assert.deepEqual(unitOpen(units, progress({ profile: { level: 'casual' } })), [1, 2, 3]);
  assert.deepEqual(unitOpen(units, progress()), [1, 2, 3]);
});

test('«Abrir todas las unidades» abre todo aunque el nivel sea nuevo', () => {
  assert.deepEqual(unitOpen(units, progress({ profile: { level: 'nuevo' } }), 'nuevo', true), [1, 2, 3]);
});

test('la prueba toma el último move/line/quiz de cada lección, desde las últimas', () => {
  const testUnit = unit(2, [
    lesson('a', ['explain', 'move', 'explain']),
    lesson('b', ['quiz', 'explain', 'line']),
    lesson('c', ['explain']),
  ]);
  const steps = unitTestSteps(testUnit, 6);
  assert.deepEqual(
    steps.map((s) => s.id),
    ['b-s2', 'a-s1']
  );
  assert.ok(steps.every((s) => ['move', 'line', 'quiz'].includes(s.type)));
});
