import test from 'node:test';
import assert from 'node:assert/strict';
import {
  gameCountsForStreak,
  puzzleCountsForStreak,
  streakStatus,
  weekSteps,
  withStreakAction,
  type DayActions,
  type Streak,
} from './streak';

const s = (current: number, lastActiveDate: string | null, actions?: DayActions): Streak => ({
  current,
  best: current,
  lastActiveDate,
  actions,
});
const all = (date: string): DayActions => ({ date, lesson: true, puzzle: true, bot: true });

test('hueco 1 suma con una acción', () => {
  const r = withStreakAction(s(10, '2026-10-29'), 'puzzle', '2026-10-30');
  assert.equal(r.streak.current, 11);
  assert.equal(r.streak.lastActiveDate, '2026-10-30');
  assert.equal(r.recovered, false);
});
test('hoy ya activo no vuelve a sumar', () => {
  assert.equal(withStreakAction(s(10, '2026-10-30'), 'bot', '2026-10-30').streak.current, 10);
});
test('hueco 2 con racha de 10 pide recuperación', () => {
  const st = streakStatus(s(10, '2026-10-28'), '2026-10-30');
  assert.equal(st.kind, 'recovering');
  assert.equal(st.days, 10);
  assert.deepEqual(st.done, { lesson: false, puzzle: false, bot: false });
});
test('las tres acciones recuperan sin sumar, y el día siguiente suma', () => {
  let x = s(10, '2026-10-28');
  x = withStreakAction(x, 'puzzle', '2026-10-30').streak;
  x = withStreakAction(x, 'lesson', '2026-10-30').streak;
  assert.equal(x.lastActiveDate, '2026-10-28');
  const r = withStreakAction(x, 'bot', '2026-10-30');
  assert.equal(r.recovered, true);
  assert.equal(r.streak.current, 10);
  assert.equal(r.streak.lastActiveDate, '2026-10-30');
  assert.equal(withStreakAction(r.streak, 'puzzle', '2026-10-31').streak.current, 11);
});
test('tras completar la recuperación, otra acción el mismo día no cambia nada', () => {
  let x = s(10, '2026-10-28');
  for (const a of ['puzzle', 'lesson', 'bot'] as const) x = withStreakAction(x, a, '2026-10-30').streak;
  const r = withStreakAction(x, 'lesson', '2026-10-30');
  assert.equal(streakStatus(r.streak, '2026-10-30').kind, 'safe');
  assert.equal(r.recovered, false);
  assert.equal(r.streak.current, 10);
});
test('la misma acción repetida no completa la recuperación', () => {
  let x = s(10, '2026-10-28');
  for (let i = 0; i < 3; i++) x = withStreakAction(x, 'puzzle', '2026-10-30').streak;
  assert.equal(streakStatus(x, '2026-10-30').kind, 'recovering');
});
test('recuperación incompleta: al otro día es una racha nueva de 1', () => {
  const x = withStreakAction(s(10, '2026-10-28'), 'puzzle', '2026-10-30').streak;
  const st = streakStatus(x, '2026-10-31');
  assert.equal(st.kind, 'active');
  assert.equal(st.days, 1);
  assert.equal(withStreakAction(x, 'lesson', '2026-10-31').streak.current, 2);
});
test('recuperación incompleta y otro día sin practicar: se pierde', () => {
  const x = withStreakAction(s(10, '2026-10-28'), 'puzzle', '2026-10-30').streak;
  assert.equal(streakStatus(x, '2026-11-01').kind, 'none');
});
test('hueco 2 con racha de 1 se pierde', () => {
  assert.equal(streakStatus(s(1, '2026-10-28'), '2026-10-30').kind, 'none');
  assert.equal(withStreakAction(s(1, '2026-10-28'), 'bot', '2026-10-30').streak.current, 1);
});
test('hueco 3 se pierde y empieza en 1', () => {
  assert.equal(streakStatus(s(10, '2026-10-27'), '2026-10-30').days, 0);
  assert.equal(withStreakAction(s(10, '2026-10-27'), 'bot', '2026-10-30').streak.current, 1);
});
test('cambio de mes', () => {
  assert.equal(streakStatus(s(5, '2026-10-30'), '2026-11-01').kind, 'recovering');
});
test('reloj atrasado no reinicia la racha', () => {
  const st = streakStatus(s(10, '2026-10-30'), '2026-10-25');
  assert.equal(st.kind, 'safe');
  assert.equal(st.days, 10);
});
test('hoy con las tres acciones de ayer no marca nada', () => {
  assert.equal(streakStatus({ ...s(5, '2026-10-29'), actions: all('2026-10-29') }, '2026-10-30').done.lesson, false);
});
test('streakLit: la primera acción del día enciende la racha', () => {
  const r = withStreakAction(s(5, '2026-10-29'), 'lesson', '2026-10-30');
  assert.equal(r.lit, true);
});
test('streakLit: la segunda acción del día no la vuelve a encender', () => {
  const first = withStreakAction(s(5, '2026-10-29'), 'lesson', '2026-10-30');
  const second = withStreakAction(first.streak, 'puzzle', '2026-10-30');
  assert.equal(second.lit, false);
});
test('streakLit: la recuperación enciende la racha al completar la tercera acción', () => {
  const a = withStreakAction(s(10, '2026-10-28'), 'puzzle', '2026-10-30');
  const b = withStreakAction(a.streak, 'lesson', '2026-10-30');
  const c = withStreakAction(b.streak, 'bot', '2026-10-30');
  assert.equal(a.lit, false);
  assert.equal(b.lit, false);
  assert.equal(c.lit, true);
  assert.equal(c.recovered, true);
});
test('streakLit: una racha nueva desde cero también se enciende', () => {
  const r = withStreakAction(s(0, null), 'puzzle', '2026-10-30');
  assert.equal(r.lit, true);
  assert.equal(r.streak.current, 1);
});
test('streakLit: con la racha ya segura no se enciende otra vez', () => {
  const r = withStreakAction(s(5, '2026-10-30'), 'bot', '2026-10-30');
  assert.equal(r.lit, false);
});

test('weekSteps: una racha de 6 con hoy segura enciende la semana hasta hoy', () => {
  assert.deepEqual(weekSteps(6, 4, true), [true, true, true, true, true, false, false]);
});
test('weekSteps: racha de 5 sin practicar hoy deja hoy apagado', () => {
  assert.deepEqual(weekSteps(5, 4, false), [true, true, true, true, false, false, false]);
});
test('weekSteps: racha de 1 recién encendida solo marca hoy', () => {
  assert.deepEqual(weekSteps(1, 4, true), [false, false, false, false, true, false, false]);
});
test('weekSteps: una racha larga enciende toda la semana hasta hoy', () => {
  assert.deepEqual(weekSteps(10, 2, true), [true, true, true, false, false, false, false]);
});

test('puzzle con solución vista no cuenta', () => {
  assert.equal(puzzleCountsForStreak('failed'), false);
  assert.equal(puzzleCountsForStreak('solved'), true);
});
test('abandonar cuenta solo con 10 jugadas o más', () => {
  assert.equal(gameCountsForStreak(true, 9), false);
  assert.equal(gameCountsForStreak(true, 10), true);
  assert.equal(gameCountsForStreak(false, 2), true);
});
