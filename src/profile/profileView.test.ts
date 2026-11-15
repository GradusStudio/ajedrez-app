import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Bot } from '../data/bots';
import type { Lesson, OpeningCourse, Unit } from '../data/lessonTypes';
import { emptyProgress, type GameRecord, type Progress } from '../progress/progressStore';
import { botRecords, profileSummary, unitCards } from './profileView';

const lesson = (id: string): Lesson => ({ id, order: 1, title: id, summary: '', xp: 0, steps: [] }) as unknown as Lesson;
const unit = (n: number, ids: string[]): Unit => ({ unit: n, title: `Unidad ${n}`, lessons: ids.map(lesson) });
const course = (id: string, ids: string[]): OpeningCourse =>
  ({ id, name: id, short: id, color: 'w', summary: '', botStyles: [], lessons: ids.map(lesson) }) as OpeningCourse;
const bot = (id: string, elo: number): Bot => ({ id, name: id, elo }) as unknown as Bot;
const make = (patch: Partial<Progress> = {}): Progress => ({ ...emptyProgress, ...patch });
const done = (id: string) => ({ [id]: { done: true as const, errors: 0, completedAt: '2026-11-01T00:00:00.000Z', completions: 1 } });
const game = (botId: string, result: GameRecord['result'], practiceCourseId?: string): GameRecord => ({
  botId,
  userColor: 'w',
  result,
  reason: '',
  moves: [],
  playedAt: '2026-11-01T00:00:00.000Z',
  ...(practiceCourseId ? { practiceCourseId } : {}),
});

const units = [unit(1, ['a1', 'a2']), unit(2, ['b1'])];

test('unidades: la primera abierta sin terminar es la actual y las demás cerradas', () => {
  const cards = unitCards(units, make(), 'nuevo', false);
  assert.deepEqual(cards.map((c) => [c.done, c.total, c.state]), [
    [0, 2, 'current'],
    [0, 1, 'locked'],
  ]);
});

test('unidades: al completar la anterior se abre la siguiente y pasa a ser la actual', () => {
  const cards = unitCards(units, make({ lessons: done('a1') }), 'nuevo', false);
  assert.equal(cards[1].state, 'locked');
  const completed = unitCards(units, make({ lessons: { ...done('a1'), ...done('a2') } }), 'nuevo', false);
  assert.deepEqual(completed.map((c) => c.state), ['complete', 'current']);
});

test('unidades: `lastUnit` manda si la unidad está abierta y sin terminar', () => {
  const cards = unitCards(units, make({ lessons: { ...done('a1'), ...done('a2'), ...done('b1') }, lastUnit: 2 }), 'casual', false);
  assert.deepEqual(cards.map((c) => c.state), ['complete', 'complete']);
  const half = unitCards(units, make({ lessons: done('a1'), lastUnit: 1 }), 'casual', false);
  assert.deepEqual(half.map((c) => c.state), ['current', null]);
});

test('unidades: los niveles con todas abiertas no tienen candados', () => {
  assert.equal(unitCards(units, make(), 'basico', false).some((c) => c.state === 'locked'), false);
  assert.equal(unitCards(units, make(), 'nuevo', true).some((c) => c.state === 'locked'), false);
});

test('bots: récord por nivel, sin práctica, y próximo rival el menor sin vencer', () => {
  const bots = [bot('ada', 2000), bot('pipo', 500)];
  const games = [game('pipo', 'win'), game('pipo', 'loss'), game('pipo', 'draw'), game('ada', 'win', 'italian')];
  const { records, nextRival } = botRecords(bots, games);
  assert.deepEqual(records.map((r) => r.bot.id), ['pipo', 'ada']);
  assert.deepEqual(
    records.map((r) => [r.wins, r.losses, r.draws, r.played, r.beaten]),
    [
      [1, 1, 1, 3, true],
      [0, 0, 0, 0, false],
    ]
  );
  assert.equal(nextRival?.bot.id, 'ada');
});

test('resumen: lecciones, cursos completos y puzzles resueltos', () => {
  const openings = [course('italian', ['i1', 'i2']), course('london', ['l1'])];
  const progress = make({
    lessons: { ...done('a1'), ...done('i1'), ...done('i2') },
    puzzles: { p1: { result: 'clean', at: '2026-11-01T00:00:00.000Z' }, p2: { result: 'failed', at: '2026-11-01T00:00:00.000Z' } },
  });
  assert.deepEqual(profileSummary(progress, units, openings), {
    lessonsDone: 1,
    lessonsTotal: 3,
    coursesDone: 1,
    coursesTotal: 2,
    puzzlesSolved: 1,
  });
});
