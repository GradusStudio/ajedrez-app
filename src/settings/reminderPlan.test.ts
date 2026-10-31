import test from 'node:test';
import assert from 'node:assert/strict';
import { planReminders } from './reminderPlan';
import type { Streak } from '../progress/streak';

const now = new Date(2026, 9, 30, 10, 0);
const streak = (current: number, lastActiveDate: string | null): Streak => ({
  current,
  best: current,
  lastActiveDate,
});

test('programa 7 días, uno por día, a la hora elegida', () => {
  const r = planReminders(streak(0, null), 19, now);
  assert.equal(r.length, 7);
  assert.equal(new Set(r.map((x) => x.date.getDate())).size, 7);
  assert.ok(r.every((x) => x.date.getHours() === 19));
});
test('si hoy ya practicó, el primer aviso es mañana', () => {
  assert.equal(planReminders(streak(5, '2026-10-30'), 19, now)[0].date.getDate(), 31);
});
test('racha en juego', () => {
  const r = planReminders(streak(5, '2026-10-29'), 19, now);
  assert.equal(r[0].title, 'Tu racha de 5 días sigue en juego');
  assert.equal(r[0].body, 'Una lección, un puzzle o una partida alcanza para mantenerla.');
});
test('día de recuperación, aun con una acción hecha', () => {
  const s: Streak = {
    ...streak(5, '2026-10-28'),
    actions: { date: '2026-10-30', lesson: true, puzzle: false, bot: false },
  };
  const r = planReminders(s, 19, now);
  assert.equal(r[0].date.getDate(), 30);
  assert.equal(r[0].title, 'Todavía puedes recuperar tu racha');
  assert.equal(r[0].body, 'Resuelve un puzzle, haz una lección y juega contra un bot hoy.');
});
test('sin racha', () => {
  const r = planReminders(streak(0, null), 19, now);
  assert.equal(r[0].title, 'Hora de practicar ajedrez');
  assert.equal(r[0].body, 'Una lección o un puzzle corto alcanza para empezar.');
});
test('racha de 1 no usa el texto de racha en juego', () => {
  assert.equal(planReminders(streak(1, '2026-10-29'), 19, now)[0].title, 'Hora de practicar ajedrez');
});
test('con la hora ya pasada, nada para el pasado', () => {
  const tarde = new Date(2026, 9, 30, 20, 0);
  assert.ok(planReminders(streak(0, null), 19, tarde).every((x) => x.date > tarde));
});
