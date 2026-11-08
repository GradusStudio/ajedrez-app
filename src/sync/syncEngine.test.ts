import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeProgress, sameProgress } from '../progress/merge';
import { coinBalance, emptyProgress, type Progress } from '../progress/progressStore';
import { progressToFile } from '../progress/progressFile';
import { createSyncEngine, DriveError, type DriveClient, type SyncStatus } from './syncEngine';

function make(over: Partial<Progress> = {}): Progress {
  const p: Progress = { ...emptyProgress, deviceId: 'A', ...over };
  return { ...p, coins: coinBalance(p.coinLedger) };
}
const lesson = (completedAt: string) => ({ done: true, errors: 0, completedAt, completions: 1 }) as const;
const file = (p: Progress) => progressToFile(p, new Date('2026-11-08T00:00:00.000Z'));

/** Drive de mentira: un solo archivo en memoria. */
function fakeDrive(initial: string | null = null) {
  const state = { text: initial, reads: 0, writes: 0, failWith: null as DriveError | null };
  const client: DriveClient = {
    async read() {
      state.reads++;
      if (state.failWith) throw state.failWith;
      return state.text;
    },
    async write(text) {
      state.writes++;
      if (state.failWith) throw state.failWith;
      state.text = text;
    },
  };
  return { state, client };
}

/** Temporizador a mano: `fire()` dispara lo pendiente. */
function fakeTimer() {
  let pending: (() => void) | null = null;
  return {
    schedule: (fn: () => void) => {
      pending = fn;
      return () => {
        if (pending === fn) pending = null;
      };
    },
    hasPending: () => pending !== null,
    fire: () => {
      const fn = pending;
      pending = null;
      fn?.();
    },
  };
}

function setup(local: Progress, drive = fakeDrive()) {
  const box = { local };
  const statuses: SyncStatus[] = [];
  const timer = fakeTimer();
  const engine = createSyncEngine({
    client: drive.client,
    getLocal: () => box.local,
    mergeIntoLocal: (remote) => {
      box.local = mergeProgress(box.local, remote);
      return box.local;
    },
    onStatus: (s) => statuses.push(s),
    schedule: timer.schedule,
    debounceMs: 3000,
  });
  return { box, statuses, timer, engine, drive };
}

test('sin archivo en Drive: sube el progreso local', async () => {
  const local = make({ lessons: { a: lesson('2026-11-01T00:00:00.000Z') } });
  const { engine, drive } = setup(local);
  const r = await engine.syncNow();
  assert.equal(r.status, 'ok');
  assert.equal(drive.state.writes, 1);
  assert.match(drive.state.text ?? '', /"app":"gradus"/);
});

test('con archivo en Drive: baja, combina con lo local y sube el resultado', async () => {
  const remote = make({ deviceId: 'B', lessons: { b: lesson('2026-11-02T00:00:00.000Z') } });
  const local = make({ lessons: { a: lesson('2026-11-01T00:00:00.000Z') } });
  const { engine, drive, box } = setup(local, fakeDrive(file(remote)));
  await engine.syncNow();
  assert.deepEqual(Object.keys(box.local.lessons).sort(), ['a', 'b']);
  const uploaded = JSON.parse(drive.state.text ?? '').progress as Progress;
  assert.deepEqual(Object.keys(uploaded.lessons).sort(), ['a', 'b']);
});

test('si Drive ya tiene todo, no vuelve a subir', async () => {
  const p = make({ lessons: { a: lesson('2026-11-01T00:00:00.000Z') } });
  const { engine, drive } = setup(p, fakeDrive(file(p)));
  const r = await engine.syncNow();
  assert.equal(r.status, 'ok');
  assert.equal(drive.state.writes, 0);
});

test('dos sincronizaciones seguidas convergen: la segunda no cambia nada', async () => {
  const remote = make({ deviceId: 'B', coinLedger: { B: { earned: 40, spent: 0 } } });
  const local = make({ coinLedger: { A: { earned: 15, spent: 0 } } });
  const { engine, drive, box } = setup(local, fakeDrive(file(remote)));
  await engine.syncNow();
  const writesAfterFirst = drive.state.writes;
  const afterFirst = box.local;
  await engine.syncNow();
  assert.equal(drive.state.writes, writesAfterFirst);
  assert.ok(sameProgress(box.local, afterFirst));
  assert.equal(box.local.coins, 55);
});

test('un archivo dañado en Drive no se pisa', async () => {
  const drive = fakeDrive('esto no es json');
  const { engine } = setup(make(), drive);
  const r = await engine.syncNow();
  assert.equal(r.status, 'corrupt');
  assert.equal(drive.state.writes, 0);
  assert.equal(drive.state.text, 'esto no es json');
});

test('un archivo de una versión más nueva no se pisa', async () => {
  const text = JSON.stringify({ app: 'gradus', kind: 'progress', exportedAt: 'x', progress: { version: 99 } });
  const drive = fakeDrive(text);
  const { engine } = setup(make(), drive);
  const r = await engine.syncNow();
  assert.equal(r.status, 'tooNew');
  assert.equal(drive.state.writes, 0);
});

test('errores de Drive se traducen a un estado y no tiran la app', async () => {
  const cases: [DriveError['kind'], SyncStatus][] = [
    ['offline', 'offline'],
    ['auth', 'needsAuth'],
    ['quota', 'quota'],
    ['forbidden', 'blocked'],
    ['other', 'error'],
  ];
  for (const [kind, status] of cases) {
    const drive = fakeDrive();
    drive.state.failWith = new DriveError(kind);
    const { engine } = setup(make(), drive);
    const r = await engine.syncNow();
    assert.equal(r.status, status, kind);
  }
});

test('un error que no es de Drive también queda como error', async () => {
  const drive = fakeDrive();
  drive.client.read = async () => {
    throw new TypeError('boom');
  };
  const { engine } = setup(make(), drive);
  assert.equal((await engine.syncNow()).status, 'error');
});

test('sin permiso vigente se pausa: no insiste hasta que se reanude', async () => {
  const drive = fakeDrive();
  drive.state.failWith = new DriveError('auth');
  const { engine, timer } = setup(make(), drive);
  await engine.syncNow();
  const reads = drive.state.reads;
  engine.requestSync();
  assert.equal(timer.hasPending(), false);
  assert.equal(drive.state.reads, reads);
  drive.state.failWith = null;
  engine.resume();
  assert.equal(timer.hasPending(), true);
  timer.fire();
  await engine.idle();
  assert.equal(drive.state.writes, 1);
});

test('requestSync agrupa varios pedidos en una sola sincronización', async () => {
  const { engine, timer, drive } = setup(make());
  engine.requestSync();
  engine.requestSync();
  engine.requestSync();
  assert.equal(drive.state.reads, 0);
  timer.fire();
  await engine.idle();
  assert.equal(drive.state.reads, 1);
});

test('un pedido que llega durante una sincronización dispara otra después', async () => {
  const drive = fakeDrive();
  let release: () => void = () => {};
  const gate = new Promise<void>((r) => (release = r));
  const realRead = drive.client.read;
  let first = true;
  drive.client.read = async () => {
    if (first) {
      first = false;
      await gate;
    }
    return realRead();
  };
  const { engine, timer } = setup(make(), drive);
  const running = engine.syncNow();
  engine.requestSync();
  release();
  await running;
  assert.equal(timer.hasPending(), true);
  timer.fire();
  await engine.idle();
  assert.equal(drive.state.reads, 2);
});

test('dos syncNow a la vez no se pisan: corren una tras otra', async () => {
  const { engine, drive } = setup(make());
  const [a, b] = await Promise.all([engine.syncNow(), engine.syncNow()]);
  assert.equal(a.status, 'ok');
  assert.equal(b.status, 'ok');
  assert.equal(drive.state.writes, 1);
});

test('informa el estado: syncing y luego ok', async () => {
  const { engine, statuses } = setup(make());
  await engine.syncNow();
  assert.deepEqual(statuses, ['syncing', 'ok']);
});

test('un borrado reciente (resetAt) llega a Drive y reemplaza lo viejo', async () => {
  const remote = make({ deviceId: 'B', lessons: { viejo: lesson('2026-11-01T00:00:00.000Z') } });
  const local = make({ resetAt: '2026-11-05T00:00:00.000Z' });
  const { engine, box } = setup(local, fakeDrive(file(remote)));
  await engine.syncNow();
  assert.deepEqual(box.local.lessons, {});
});
