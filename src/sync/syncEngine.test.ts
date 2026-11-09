import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeProgress, sameProgress } from '../progress/merge';
import { coinBalance, emptyProgress, type Progress } from '../progress/progressStore';
import { progressToFile } from '../progress/progressFile';
import { createSyncEngine, SyncConflict, SyncError, type SyncClient, type SyncStatus } from './syncEngine';

function make(over: Partial<Progress> = {}): Progress {
  const p: Progress = { ...emptyProgress, deviceId: 'A', ...over };
  return { ...p, coins: coinBalance(p.coinLedger) };
}
const lesson = (completedAt: string) => ({ done: true, errors: 0, completedAt, completions: 1 }) as const;
const file = (p: Progress) => progressToFile(p, new Date('2026-11-08T00:00:00.000Z'));

/** Servidor de mentira: un solo texto con versión en memoria. */
function fakeServer(initial: string | null = null) {
  const state = {
    text: initial,
    version: initial === null ? 0 : 1,
    reads: 0,
    writes: 0,
    expected: [] as number[],
    failWith: null as Error | null,
    /** Textos que "otro dispositivo" guarda justo antes de las próximas escrituras (uno por conflicto). */
    interleave: [] as string[],
  };
  const client: SyncClient = {
    async read() {
      state.reads++;
      if (state.failWith) throw state.failWith;
      return state.text === null ? null : { version: state.version, text: state.text };
    },
    async write(text, expected) {
      state.writes++;
      state.expected.push(expected);
      if (state.failWith) throw state.failWith;
      const other = state.interleave.shift();
      if (other !== undefined) {
        state.text = other;
        state.version++;
      }
      if (expected !== state.version) throw new SyncConflict({ version: state.version, text: state.text ?? '' });
      state.text = text;
      state.version++;
      return state.version;
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

function setup(local: Progress, drive = fakeServer()) {
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

test('sin datos en el servidor escribe con version 0', async () => {
  const local = make({ lessons: { a: lesson('2026-11-01T00:00:00.000Z') } });
  const { engine, drive } = setup(local);
  const r = await engine.syncNow();
  assert.equal(r.status, 'ok');
  assert.deepEqual(drive.state.expected, [0]);
  assert.match(drive.state.text ?? '', /"app":"gradus"/);
});

test('con datos, fusiona y escribe con la versión leída solo si cambió algo', async () => {
  const remote = make({ deviceId: 'B', lessons: { b: lesson('2026-11-02T00:00:00.000Z') } });
  const local = make({ lessons: { a: lesson('2026-11-01T00:00:00.000Z') } });
  const { engine, drive, box } = setup(local, fakeServer(file(remote)));
  await engine.syncNow();
  assert.deepEqual(drive.state.expected, [1]);
  assert.deepEqual(Object.keys(box.local.lessons).sort(), ['a', 'b']);
  const uploaded = JSON.parse(drive.state.text ?? '').progress as Progress;
  assert.deepEqual(Object.keys(uploaded.lessons).sort(), ['a', 'b']);

  const same = setup(remote, fakeServer(file(remote)));
  assert.equal((await same.engine.syncNow()).status, 'ok');
  assert.equal(same.drive.state.writes, 0);
});

test('dos sincronizaciones seguidas convergen: la segunda no cambia nada', async () => {
  const remote = make({ deviceId: 'B', coinLedger: { B: { earned: 40, spent: 0 } } });
  const local = make({ coinLedger: { A: { earned: 15, spent: 0 } } });
  const { engine, drive, box } = setup(local, fakeServer(file(remote)));
  await engine.syncNow();
  const writesAfterFirst = drive.state.writes;
  const afterFirst = box.local;
  await engine.syncNow();
  assert.equal(drive.state.writes, writesAfterFirst);
  assert.ok(sameProgress(box.local, afterFirst));
  assert.equal(box.local.coins, 55);
});

test('con 409, fusiona lo que trae el conflicto y reintenta con su versión; al tercer conflicto seguido informa error', async () => {
  const mine = make({ lessons: { a: lesson('2026-11-01T00:00:00.000Z') } });
  const other = (k: string) => file(make({ deviceId: 'B', lessons: { [k]: lesson('2026-11-02T00:00:00.000Z') } }));

  const ok = setup(mine, fakeServer(file(make({ deviceId: 'B' }))));
  ok.drive.state.interleave = [other('x')];
  assert.equal((await ok.engine.syncNow()).status, 'ok');
  assert.equal(ok.drive.state.reads, 1, 'el reintento no vuelve a leer');
  assert.deepEqual(ok.drive.state.expected, [1, 2]);
  assert.deepEqual(Object.keys(ok.box.local.lessons).sort(), ['a', 'x']);

  const bad = setup(mine, fakeServer(file(make({ deviceId: 'B' }))));
  bad.drive.state.interleave = [other('x'), other('y'), other('z')];
  assert.equal((await bad.engine.syncNow()).status, 'error');
  assert.equal(bad.drive.state.writes, 3);
});

test('un archivo dañado en el servidor no se pisa', async () => {
  const drive = fakeServer('esto no es json');
  const { engine } = setup(make(), drive);
  const r = await engine.syncNow();
  assert.equal(r.status, 'corrupt');
  assert.equal(drive.state.writes, 0);
  assert.equal(drive.state.text, 'esto no es json');
});

test('un archivo de una versión más nueva no se pisa', async () => {
  const text = JSON.stringify({ app: 'gradus', kind: 'progress', exportedAt: 'x', progress: { version: 99 } });
  const drive = fakeServer(text);
  const { engine } = setup(make(), drive);
  const r = await engine.syncNow();
  assert.equal(r.status, 'tooNew');
  assert.equal(drive.state.writes, 0);
});

test('offline informa offline', async () => {
  const drive = fakeServer();
  drive.state.failWith = new SyncError('offline');
  const { engine } = setup(make(), drive);
  assert.equal((await engine.syncNow()).status, 'offline');
});

test('un error que no es de sincronización también queda como error', async () => {
  const drive = fakeServer();
  drive.client.read = async () => {
    throw new TypeError('boom');
  };
  const { engine } = setup(make(), drive);
  assert.equal((await engine.syncNow()).status, 'error');
});

test('con revoked informa revoked, se pausa y requestSync no hace nada hasta resume', async () => {
  const drive = fakeServer();
  drive.state.failWith = new SyncError('revoked');
  const { engine, timer } = setup(make(), drive);
  assert.equal((await engine.syncNow()).status, 'revoked');
  assert.equal(engine.isPaused(), true);
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

test('con tooLarge informa error y no reintenta solo', async () => {
  const drive = fakeServer();
  drive.state.failWith = new SyncError('tooLarge');
  const { engine, timer } = setup(make(), drive);
  assert.equal((await engine.syncNow()).status, 'error');
  assert.equal(timer.hasPending(), false);
  assert.equal(engine.isPaused(), false);
});

test('flush sincroniza sin esperar el debounce', async () => {
  const { engine, timer, drive } = setup(make());
  engine.requestSync();
  assert.equal(timer.hasPending(), true);
  const r = await engine.flush();
  assert.equal(r.status, 'ok');
  assert.equal(timer.hasPending(), false);
  assert.equal(drive.state.reads, 1);
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
  const drive = fakeServer();
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

test('un borrado reciente (resetAt) llega al servidor y reemplaza lo viejo', async () => {
  const remote = make({ deviceId: 'B', lessons: { viejo: lesson('2026-11-01T00:00:00.000Z') } });
  const local = make({ resetAt: '2026-11-05T00:00:00.000Z' });
  const { engine, box } = setup(local, fakeServer(file(remote)));
  await engine.syncNow();
  assert.deepEqual(box.local.lessons, {});
});

test('flush con la llave revocada no llama al servidor hasta resume', async () => {
  const drive = fakeServer();
  drive.state.failWith = new SyncError('revoked');
  const { engine, timer, statuses } = setup(make(), drive);
  await engine.syncNow();
  const reads = drive.state.reads;
  const seen = statuses.length;
  assert.deepEqual(await engine.flush(), { status: 'revoked' });
  assert.equal(drive.state.reads, reads);
  assert.equal(statuses.length, seen, 'no informa de nuevo');
  assert.equal(timer.hasPending(), false);
  drive.state.failWith = null;
  engine.resume();
  assert.equal((await engine.flush()).status, 'ok');
  assert.ok(drive.state.reads > reads);
});

test('conflicto en la primera escritura (servidor vacío): fusiona y reintenta', async () => {
  const mine = make({ lessons: { a: lesson('2026-11-01T00:00:00.000Z') } });
  const theirs = file(make({ deviceId: 'B', lessons: { x: lesson('2026-11-02T00:00:00.000Z') } }));
  const { engine, drive, box } = setup(mine, fakeServer());
  drive.state.interleave = [theirs];
  assert.equal((await engine.syncNow()).status, 'ok');
  assert.deepEqual(drive.state.expected, [0, 1]);
  assert.deepEqual(Object.keys(box.local.lessons).sort(), ['a', 'x']);
});

test('un conflicto con texto dañado o de versión más nueva no se pisa', async () => {
  const tooNew = JSON.stringify({ app: 'gradus', kind: 'progress', exportedAt: 'x', progress: { version: 99 } });
  for (const [text, status] of [
    ['basura', 'corrupt'],
    [tooNew, 'tooNew'],
  ] as const) {
    const local = make({ lessons: { a: lesson('2026-11-01T00:00:00.000Z') } });
    const { engine, drive } = setup(local, fakeServer(file(make({ deviceId: 'B' }))));
    drive.state.interleave = [text];
    // El local tiene algo que subir, así que la primera escritura choca.
    assert.equal((await engine.syncNow()).status, status);
    assert.equal(drive.state.text, text);
    assert.equal(drive.state.writes, 1);
  }
});
