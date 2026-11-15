import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Bot } from '../data/bots';
import type { Lesson, OpeningCourse, Unit } from '../data/lessonTypes';
import { achievementCount, achievements, newAchievements } from './achievements';
import { emptyProgress, type GameRecord, type Progress } from './progressStore';

const lesson = (id: string, errors = 0, completedAt = '2026-11-01T00:00:00.000Z'): Lesson =>
  ({ id, order: 1, title: id, summary: '', xp: 0, steps: [], errors, completedAt }) as unknown as Lesson;

const unit = (n: number, ids: string[]): Unit => ({ unit: n, title: `Unidad ${n}`, lessons: ids.map((id) => lesson(id)) });

const course = (id: string, ids: string[]): OpeningCourse =>
  ({ id, name: id, short: id, color: 'w', summary: '', botStyles: [], lessons: ids.map((l) => lesson(l)) }) as OpeningCourse;

const units = [unit(1, ['a1', 'a2']), unit(2, ['b1']), unit(3, ['c1'])];
const openings = [course('italian', ['i1', 'i2']), course('london', ['l1']), course('scotch', ['s1'])];
const content = { units, openings, bots: [] as Bot[] };

const make = (patch: Partial<Progress> = {}): Progress => ({ ...emptyProgress, ...patch });
const done = (id: string, errors = 0, completedAt = '2026-11-01T00:00:00.000Z') => ({ [id]: { done: true as const, errors, completedAt, completions: 1 } });
const game = (botId: string, result: GameRecord['result'], practiceCourseId?: string): GameRecord => ({
  botId,
  userColor: 'w',
  result,
  reason: '',
  moves: [],
  playedAt: '2026-11-01T00:00:00.000Z',
  ...(practiceCourseId ? { practiceCourseId } : {}),
});

test('una cuenta vacía no tiene ningún logro', () => {
  const list = achievements(make(), content);
  assert.equal(list.length, 18);
  assert.equal(list.every((a) => !a.earned), true);
  assert.deepEqual(achievementCount(list), { earned: 0, total: 18 });
});

test('primer paso y unidades completas', () => {
  const list = achievements(make({ lessons: { ...done('a1'), ...done('a2'), ...done('b1') } }), content);
  const byId = Object.fromEntries(list.map((a) => [a.id, a]));
  assert.equal(byId.firstLesson.earned, true);
  assert.equal(byId.unit1.earned, true);
  assert.equal(byId.unit2.earned, true);
  assert.equal(byId.unit3.earned, false);
  assert.deepEqual(byId.unit3.progress, { value: 0, goal: 1 });
});

test('cinco lecciones seguidas sin errores', () => {
  const five = ['l1', 'l2', 'l3', 'l4', 'l5'];
  const lessons = Object.fromEntries(
    five.map((id, i) => [id, { done: true as const, errors: 0, completedAt: new Date(Date.UTC(2026, 0, 1, i)).toISOString(), completions: 1 }])
  );
  assert.equal(achievements(make({ lessons }), content).find((a) => a.id === 'fiveClean')?.earned, true);
  const broken = { ...lessons, l3: { ...lessons.l3, errors: 2 } };
  assert.equal(achievements(make({ lessons: broken }), content).find((a) => a.id === 'fiveClean')?.earned, false);
});

test('rachas de 3, 7 y 30 días', () => {
  const at = (best: number) => achievements(make({ streak: { current: 1, best, lastActiveDate: null } }), content).filter((a) => a.id.startsWith('streak'));
  assert.deepEqual(at(7).map((a) => a.earned), [true, true, false]);
  assert.deepEqual(at(30).map((a) => a.earned), [true, true, true]);
});

test('10 y 100 puzzles resueltos', () => {
  const solved = (n: number) =>
    Object.fromEntries(Array.from({ length: n }, (_, i) => [`p${i}`, { result: 'clean' as const, at: '2026-11-01T00:00:00.000Z' }]));
  const ten = achievements(make({ puzzles: solved(10) }), content);
  assert.equal(ten.find((a) => a.id === 'puzzles10')?.earned, true);
  assert.equal(ten.find((a) => a.id === 'puzzles100')?.earned, false);
  assert.equal(achievements(make({ puzzles: solved(100) }), content).find((a) => a.id === 'puzzles100')?.earned, true);
});

test('nivel 1500 con el actual o con el mejor del historial', () => {
  const base = { rating: 1200, rated: 10, at: null, pending: [] };
  const withHistory = make({ puzzleRating: { ...base, history: [{ at: '2026-11-01T00:00:00.000Z', rating: 1550 }] } });
  assert.equal(achievements(withHistory, content).find((a) => a.id === 'rating1500')?.earned, true);
  assert.equal(achievements(make({ puzzleRating: { ...base, rating: 1500 } }), content).find((a) => a.id === 'rating1500')?.earned, true);
});

test('bots vencidos: uno, cinco y Ada; la práctica no cuenta', () => {
  const one = achievements(make({ games: [game('pipo', 'win'), game('lola', 'loss')] }), content);
  assert.equal(one.find((a) => a.id === 'botFirst')?.earned, true);
  assert.equal(one.find((a) => a.id === 'botFive')?.earned, false);
  const five = achievements(make({ games: ['pipo', 'lola', 'tomas', 'valentina', 'ramiro'].map((b) => game(b, 'win')) }), content);
  assert.equal(five.find((a) => a.id === 'botFive')?.earned, true);
  const practice = achievements(make({ games: [game('pipo', 'win', 'italian')] }), content);
  assert.equal(practice.find((a) => a.id === 'botFirst')?.earned, false);
  assert.equal(achievements(make({ games: [game('ada', 'win')] }), content).find((a) => a.id === 'beatAda')?.earned, true);
});

test('uno y tres cursos de apertura completos', () => {
  const one = achievements(make({ lessons: { ...done('i1'), ...done('i2') } }), content);
  assert.equal(one.find((a) => a.id === 'course1')?.earned, true);
  assert.equal(one.find((a) => a.id === 'course3')?.earned, false);
  const three = achievements(make({ lessons: { ...done('i1'), ...done('i2'), ...done('l1'), ...done('s1') } }), content);
  assert.equal(three.find((a) => a.id === 'course3')?.earned, true);
});

test('punto de giro y compras', () => {
  const tp = achievements(make({ turningPoints: ['k1'] }), content);
  assert.equal(tp.find((a) => a.id === 'turningPoint')?.earned, true);
  assert.equal(achievements(make({ boardThemes: ['madera'] }), content).find((a) => a.id === 'collector')?.earned, true);
  assert.equal(achievements(make({ pieceSets: ['hielo'] }), content).find((a) => a.id === 'collector')?.earned, true);
});

test('newAchievements devuelve los conseguidos que no se vieron', () => {
  const list = achievements(make({ lessons: done('a1') }), content);
  assert.deepEqual(newAchievements(list, []), ['firstLesson']);
  assert.deepEqual(newAchievements(list, ['firstLesson']), []);
});
