import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Puzzle } from './puzzles';
import { dailyWeek, puzzleFinalFen, quantity, themeCount, themeSolvedCount, weekDays, weekRatingDelta } from './puzzleView';
import { emptyProgress, type Progress } from '../progress/progressStore';

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const make = (patch: Partial<Progress> = {}): Progress => ({ ...emptyProgress, ...patch });
const puzzle = (patch: Partial<Puzzle> = {}): Puzzle => ({ id: 'p', fen: START, moves: [], rating: 1200, themes: [], ...patch });

test('puzzleFinalFen aplica las jugadas del puzzle', () => {
  assert.equal(
    puzzleFinalFen(puzzle({ moves: ['e2e4', 'e7e5'] })),
    'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2'
  );
  assert.equal(puzzleFinalFen(puzzle({ moves: ['jugadaIlegal'] })), START);
});

test('weekDays devuelve de lunes a domingo de la semana de hoy', () => {
  const days = weekDays(new Date(2026, 10, 11)); // miércoles 11-11-2026
  assert.deepEqual(days.map((d) => d.key), [
    '2026-11-09',
    '2026-11-10',
    '2026-11-11',
    '2026-11-12',
    '2026-11-13',
    '2026-11-14',
    '2026-11-15',
  ]);
});

test('dailyWeek marca resuelto, solución vista y sin jugar', async () => {
  const source = {
    daily: async (date: Date) => {
      const day = date.getDate();
      return puzzle({ id: day === 9 ? 'a' : day === 10 ? 'b' : `x${day}` });
    },
  };
  const progress = make({
    puzzles: {
      a: { result: 'clean', at: '2026-11-09T10:00:00.000Z' },
      b: { result: 'failed', at: '2026-11-10T10:00:00.000Z' },
    },
  });
  const week = await dailyWeek(progress, source, new Date(2026, 10, 11));
  assert.deepEqual(week.map((d) => d.state), ['solved', 'seen', 'none', 'none', 'none', 'none', 'none']);
});

test('themeSolvedCount cuenta solo los resueltos y filtra por tema', () => {
  const progress = make({
    puzzles: {
      p1: { result: 'clean', at: '2026-11-01T00:00:00.000Z', themes: ['fork', 'pin'] },
      p2: { result: 'failed', at: '2026-11-01T00:00:00.000Z', themes: ['fork'] },
      p3: { result: 'solved', at: '2026-11-01T00:00:00.000Z' },
    },
  });
  assert.equal(themeSolvedCount(progress, 'fork'), 1);
  assert.equal(themeSolvedCount(progress, null), 2);
});

test('themeCount suma los niveles; para todos usa el total', () => {
  let calls = 0;
  const source = {
    total: 100,
    count: (_level: string, _theme: string | null) => {
      calls += 1;
      return 4;
    },
  };
  assert.equal(themeCount(source, ['facil', 'medio'], 'fork'), 8);
  assert.equal(calls, 2);
  assert.equal(themeCount(source, ['facil', 'medio'], null), 100);
});

test('quantity redondea a miles y millones', () => {
  assert.deepEqual(quantity(6_200_000), { value: 6.2, unit: 'millions' });
  assert.deepEqual(quantity(6_160_000), { value: 6.2, unit: 'millions' });
  assert.deepEqual(quantity(820_000), { value: 820, unit: 'thousands' });
  assert.deepEqual(quantity(999), { value: 999, unit: 'full' });
});

test('weekRatingDelta toma el primer punto de los últimos siete días', () => {
  const history = [
    { at: '2026-11-01T10:00:00.000Z', rating: 1200 },
    { at: '2026-11-10T10:00:00.000Z', rating: 1300 },
  ];
  assert.equal(weekRatingDelta(history, 1349, new Date(2026, 10, 11)), 49);
  assert.equal(weekRatingDelta([{ at: '2026-10-01T10:00:00.000Z', rating: 1200 }], 1349, new Date(2026, 10, 11)), 0);
});
