import test from 'node:test';
import assert from 'node:assert/strict';
import { absorbOtherTab } from './crossTab';
import { coinBalance, emptyProgress, withReset, type Progress } from './progressStore';

function make(over: Partial<Progress> = {}): Progress {
  const p: Progress = { ...emptyProgress, deviceId: 'A', ...over };
  return { ...p, coins: coinBalance(p.coinLedger) };
}

const lesson = (completedAt: string) => ({ done: true, errors: 0, completedAt, completions: 1 }) as const;
const raw = (p: unknown) => JSON.stringify(p);

test('nada que hacer: borrado de la clave, JSON roto o versión desconocida', () => {
  const p = make();
  assert.equal(absorbOtherTab(p, null), null);
  assert.equal(absorbOtherTab(p, '{roto'), null);
  assert.equal(absorbOtherTab(p, raw({ ...p, version: 99 })), null);
  assert.equal(absorbOtherTab(p, raw({ ...p, version: 0 })), null);
  assert.equal(absorbOtherTab(p, raw('texto')), null);
  assert.equal(absorbOtherTab(p, 'null'), null);
});

test('lo mismo que ya hay: null (no vuelve a guardar, así no hay eco entre pestañas)', () => {
  const p = make({ lessons: { x: lesson('2026-11-01T00:00:00.000Z') }, coinLedger: { A: { earned: 15, spent: 0 } } });
  assert.equal(absorbOtherTab(p, raw(p)), null);
});

test('la otra pestaña terminó una lección y ganó monedas: se suman a lo de esta', () => {
  const mine = make({ lessons: { x: lesson('2026-11-01T00:00:00.000Z') }, coinLedger: { A: { earned: 15, spent: 0 } } });
  const other = make({
    lessons: { x: lesson('2026-11-01T00:00:00.000Z'), y: lesson('2026-11-02T00:00:00.000Z') },
    coinLedger: { A: { earned: 30, spent: 0 } },
  });
  const next = absorbOtherTab(mine, raw(other));
  assert.ok(next);
  assert.deepEqual(Object.keys(next.lessons).sort(), ['x', 'y']);
  assert.equal(next.coins, 30);
  assert.equal(next.deviceId, 'A');
});

test('un borrado en la otra pestaña gana entero y se adopta su deviceId nuevo', () => {
  const mine = make({ lessons: { x: lesson('2026-11-01T00:00:00.000Z') }, coinLedger: { A: { earned: 15, spent: 0 } } });
  const other = withReset(mine, new Date('2026-11-07T10:00:00.000Z'));
  const next = absorbOtherTab(mine, raw(other));
  assert.ok(next);
  assert.deepEqual(next.lessons, {});
  assert.equal(next.coins, 0);
  assert.equal(next.resetAt, other.resetAt);
  assert.equal(next.deviceId, other.deviceId);
});

test('si el borrado más reciente es el de esta pestaña, se queda con su deviceId', () => {
  const old = make({ lessons: { x: lesson('2026-11-01T00:00:00.000Z') } });
  const mine = withReset(old, new Date('2026-11-07T10:00:00.000Z'));
  const next = absorbOtherTab(mine, raw(old));
  // Lo de la otra pestaña es anterior al borrado: no cambia nada.
  assert.equal(next, null);
});

test('dos pestañas que se avisan una a la otra terminan iguales y en pocos pasos', () => {
  let a = make({ lessons: { x: lesson('2026-11-01T00:00:00.000Z') }, coinLedger: { A: { earned: 15, spent: 0 } }, pieceSets: ['madera'] });
  let b = make({ puzzles: { p1: { result: 'clean', at: '2026-11-02T00:00:00.000Z' } }, coinLedger: { A: { earned: 2, spent: 0 } }, boardThemes: ['hielo'] });
  // Cada guardado dispara el evento en la otra pestaña; se cuenta cuántos guardados hacen falta para que pare.
  let saved: 'a' | 'b' | null = 'a';
  let rounds = 0;
  while (saved && rounds < 10) {
    rounds++;
    if (saved === 'a') {
      const next = absorbOtherTab(b, raw(a));
      saved = next ? 'b' : null;
      if (next) b = next;
    } else {
      const next = absorbOtherTab(a, raw(b));
      saved = next ? 'a' : null;
      if (next) a = next;
    }
  }
  assert.ok(rounds <= 3, `hicieron falta ${rounds} pasos`);
  assert.deepEqual(a, b);
  assert.deepEqual(Object.keys(a.lessons), ['x']);
  assert.deepEqual(Object.keys(a.puzzles), ['p1']);
});

test('otra pestaña con la forma rota (lessons: null) se ignora', () => {
  const p = make();
  assert.equal(absorbOtherTab(p, raw({ ...p, deviceId: 'B', lessons: null })), null);
  assert.equal(absorbOtherTab(p, raw({ ...p, deviceId: 'B', rewards: { goalDate: 5, botWins: {} } })), null);
});
