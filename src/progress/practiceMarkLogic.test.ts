import test from 'node:test';
import assert from 'node:assert/strict';
import { practicedToday } from './practiceMarkLogic';
import { emptyProgress, withLessonFinished } from './progressStore';
import type { Streak } from './streak';

const s = (actions?: Streak['actions']): Streak => ({
  current: 1,
  best: 1,
  lastActiveDate: '2026-10-30',
  actions,
});

test('practicedToday: una acción hecha hoy cuenta', () => {
  assert.equal(practicedToday(s({ date: '2026-10-30', lesson: true, puzzle: false, bot: false }), '2026-10-30'), true);
});

test('acciones de ayer no cuentan', () => {
  assert.equal(practicedToday(s({ date: '2026-10-29', lesson: true, puzzle: true, bot: true }), '2026-10-30'), false);
});

test('sin acciones no cuenta', () => {
  assert.equal(practicedToday(s(), '2026-10-30'), false);
  assert.equal(practicedToday(s({ date: '2026-10-30', lesson: false, puzzle: false, bot: false }), '2026-10-30'), false);
});

test('cualquier acción (lección, puzzle, bot) cuenta', () => {
  for (const action of ['lesson', 'puzzle', 'bot'] as const) {
    const actions = { date: '2026-10-30', lesson: false, puzzle: false, bot: false, [action]: true };
    assert.equal(practicedToday(s(actions), '2026-10-30'), true);
  }
});

test('una lección de apertura cuenta como lección', () => {
  const r = withLessonFinished(
    emptyProgress,
    { lessonId: 'london-l01', lessonCoins: 15, errors: 0, mistakes: [], seconds: 60 },
    new Date(2026, 9, 30, 10, 0)
  );
  assert.equal(r.progress.streak.actions?.lesson, true);
});
