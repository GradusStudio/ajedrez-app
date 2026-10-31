import test from 'node:test';
import assert from 'node:assert/strict';
import { planReminders, reminderBot } from './reminderPlan';
import { bots } from '../data/bots';
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
test('escribe un bot distinto cada día y todos aparecen', () => {
  const ids = Array.from({ length: 10 }, (_, i) => reminderBot(new Date(2026, 9, 30 + i)).id);
  assert.equal(new Set(ids).size, 10);
});
test('la rotación funciona en otro año', () => {
  assert.ok(bots.includes(reminderBot(new Date(2031, 0, 1))));
});
test('racha en juego: título con el bot y días en el cuerpo', () => {
  const [r] = planReminders(streak(5, '2026-10-29'), 19, now);
  assert.equal(r.title, reminderBot(r.date).name);
  assert.ok(r.body.includes('5'));
  assert.ok(!r.body.includes('{n}'));
});
test('recuperación nombra las tres acciones, aun con una acción hecha', () => {
  const s: Streak = {
    ...streak(5, '2026-10-28'),
    actions: { date: '2026-10-30', lesson: true, puzzle: false, bot: false },
  };
  const [r] = planReminders(s, 19, now);
  assert.equal(r.date.getDate(), 30);
  assert.equal(r.title, reminderBot(r.date).name);
  assert.match(r.body, /puzzle/i);
  assert.match(r.body, /lección/i);
  assert.match(r.body, /bot/i);
});
test('sin racha usa la frase general del bot', () => {
  const [r] = planReminders(streak(0, null), 19, now);
  assert.equal(r.body, reminderBot(r.date).teaching.reminder.general);
});
test('racha de 1 usa la frase general', () => {
  const [r] = planReminders(streak(1, '2026-10-29'), 19, now);
  assert.equal(r.body, reminderBot(r.date).teaching.reminder.general);
});
test('cada día tiene su propio autor', () => {
  const r = planReminders(streak(0, null), 19, now);
  assert.ok(r.every((x) => x.title === reminderBot(x.date).name));
  assert.ok(new Set(r.map((x) => x.title)).size > 1);
});
test('con la hora ya pasada, nada para el pasado', () => {
  const tarde = new Date(2026, 9, 30, 20, 0);
  assert.ok(planReminders(streak(0, null), 19, tarde).every((x) => x.date > tarde));
});
