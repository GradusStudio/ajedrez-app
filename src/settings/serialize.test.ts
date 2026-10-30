import test from 'node:test';
import assert from 'node:assert/strict';
import { createSerializer } from './serialize';

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

test('dos tareas en cola nunca se solapan', async () => {
  const run = createSerializer();
  const log: string[] = [];
  const a = run(async () => { log.push('a1'); await wait(20); log.push('a2'); });
  const b = run(async () => { log.push('b1'); await wait(1); log.push('b2'); });
  await Promise.all([a, b]);
  assert.deepEqual(log, ['a1', 'a2', 'b1', 'b2']);
});

test('una tarea que falla no frena a la siguiente y quien la pidió ve el error', async () => {
  const run = createSerializer();
  const a = run(async () => { throw new Error('falló'); });
  const b = run(async () => 42);
  await assert.rejects(a, /falló/);
  assert.equal(await b, 42);
});
