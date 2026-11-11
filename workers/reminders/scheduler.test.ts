import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { PushSender, ReminderSubscription } from './handler';
import { sendDueReminders, type DueNotice, type ReminderSendStore } from './scheduler';

type MemoryDevice = { secretHash: string; subscription: ReminderSubscription; updatedAt: string };
type MemoryNotice = { id: number; deviceId: string; dueAt: string; title: string; body: string };

const SUB: ReminderSubscription = { endpoint: 'https://fcm.googleapis.com/fcm/send/abc', keys: { p256dh: 'p'.repeat(20), auth: 'a'.repeat(10) } };
const NOW = new Date('2026-11-12T12:00:00.000Z');

// Store en memoria con la misma semántica que el de D1, más los tres métodos del planificador y registros de llamadas.
function memoryStore() {
  const devices = new Map<string, MemoryDevice>();
  const notices = new Map<number, MemoryNotice>();
  const deleteCalls: number[][] = [];
  const pruneCalls: string[] = [];
  const removed: string[] = [];
  let nextId = 1;

  function addDevice(id: string, updatedAt: string, subscription = SUB) {
    devices.set(id, { secretHash: 'hash-' + id, subscription, updatedAt });
  }

  function addNotice(deviceId: string, dueAt: string, title: string, body: string) {
    const id = nextId++;
    notices.set(id, { id, deviceId, dueAt, title, body });
    return id;
  }

  function dropDevice(id: string) {
    devices.delete(id);
    for (const [noticeId, notice] of notices) if (notice.deviceId === id) notices.delete(noticeId);
  }

  const store: ReminderSendStore = {
    async createDevice({ id, secretHash, subscription, notices: inputs, now }) {
      devices.set(id, { secretHash, subscription, updatedAt: now });
      for (const notice of inputs) addNotice(id, notice.dueAt, notice.title, notice.body);
    },
    async findDevice(id) {
      const device = devices.get(id);
      return device ? { secretHash: device.secretHash } : null;
    },
    async replaceNotices(id, inputs, now) {
      for (const [noticeId, notice] of notices) if (notice.deviceId === id) notices.delete(noticeId);
      for (const notice of inputs) addNotice(id, notice.dueAt, notice.title, notice.body);
      const device = devices.get(id);
      if (device) devices.set(id, { ...device, updatedAt: now });
    },
    async removeDevice(id) {
      removed.push(id);
      dropDevice(id);
    },
    async dueNotices(now) {
      const due: DueNotice[] = [];
      for (const notice of notices.values()) {
        const device = devices.get(notice.deviceId);
        if (!device || notice.dueAt > now) continue;
        due.push({
          noticeId: notice.id,
          deviceId: notice.deviceId,
          endpoint: device.subscription.endpoint,
          p256dh: device.subscription.keys.p256dh,
          auth: device.subscription.keys.auth,
          dueAt: notice.dueAt,
          title: notice.title,
          body: notice.body,
        });
      }
      return due;
    },
    async deleteNotices(ids) {
      deleteCalls.push(ids);
      for (const id of ids) notices.delete(id);
    },
    async pruneDevices(before) {
      pruneCalls.push(before);
      for (const [id, device] of devices) if (device.updatedAt < before) dropDevice(id);
    },
  };

  return { store, devices, notices, deleteCalls, pruneCalls, removed, addDevice, addNotice };
}

// Sender falso: anota cada envío y responde con la lista indicada (o `ok` cuando se acaba).
function fakeSender(results: Array<'ok' | 'gone' | 'retry'> = []) {
  const calls: { subscription: ReminderSubscription; payload: string }[] = [];
  let index = 0;
  const sender: PushSender = {
    async send(subscription, payload) {
      calls.push({ subscription, payload });
      return results[index++] ?? 'ok';
    },
  };
  return { sender, calls };
}

test('envía solo el más reciente y borra los viejos', async () => {
  const memoria = memoryStore();
  memoria.addDevice('dispositivo-1', NOW.toISOString());
  const viejo1 = memoria.addNotice('dispositivo-1', '2026-11-12T09:00:00.000Z', 'Viejo 1', 'Texto 1');
  const viejo2 = memoria.addNotice('dispositivo-1', '2026-11-12T10:00:00.000Z', 'Viejo 2', 'Texto 2');
  const nuevo = memoria.addNotice('dispositivo-1', '2026-11-12T11:30:00.000Z', 'Nuevo', 'Texto nuevo');
  const { sender, calls } = fakeSender();

  const resultado = await sendDueReminders(memoria.store, sender, NOW);

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].subscription, SUB);
  assert.deepEqual(JSON.parse(calls[0].payload), { title: 'Nuevo', body: 'Texto nuevo', url: '/app/' });
  assert.equal(memoria.deleteCalls.length, 2);
  assert.deepEqual([...memoria.deleteCalls[0]].sort(), [viejo1, viejo2].sort());
  assert.deepEqual(memoria.deleteCalls[1], [nuevo]);
  assert.equal(memoria.notices.size, 0);
  assert.deepEqual(resultado, { sent: 1, gone: 0, dropped: 2 });
});

test('descarta un aviso de hace más de una hora sin enviarlo', async () => {
  const memoria = memoryStore();
  memoria.addDevice('dispositivo-1', NOW.toISOString());
  const viejo = memoria.addNotice('dispositivo-1', '2026-11-12T10:59:00.000Z', 'Tarde', 'Texto');
  const { sender, calls } = fakeSender();

  const resultado = await sendDueReminders(memoria.store, sender, NOW);

  assert.equal(calls.length, 0);
  assert.deepEqual(memoria.deleteCalls, [[viejo]]);
  assert.equal(memoria.notices.size, 0);
  assert.deepEqual(resultado, { sent: 0, gone: 0, dropped: 1 });
});

test('un 404 o 410 borra el dispositivo', async () => {
  const memoria = memoryStore();
  memoria.addDevice('dispositivo-1', NOW.toISOString());
  memoria.addNotice('dispositivo-1', '2026-11-12T11:55:00.000Z', 'Título', 'Texto');
  const { sender, calls } = fakeSender(['gone']);

  const resultado = await sendDueReminders(memoria.store, sender, NOW);

  assert.equal(calls.length, 1);
  assert.deepEqual(memoria.removed, ['dispositivo-1']);
  assert.equal(memoria.devices.size, 0);
  assert.equal(memoria.notices.size, 0);
  assert.deepEqual(resultado, { sent: 0, gone: 1, dropped: 0 });
});

test('un fallo reintentable conserva el aviso para el próximo ciclo', async () => {
  const memoria = memoryStore();
  memoria.addDevice('dispositivo-1', NOW.toISOString());
  const aviso = memoria.addNotice('dispositivo-1', '2026-11-12T11:55:00.000Z', 'Título', 'Texto');
  const primero = fakeSender(['retry']);

  const resultado = await sendDueReminders(memoria.store, primero.sender, NOW);

  assert.deepEqual(resultado, { sent: 0, gone: 0, dropped: 0 });
  assert.equal(memoria.devices.size, 1);
  assert.equal(memoria.notices.get(aviso)?.title, 'Título');
  assert.equal(memoria.deleteCalls.length, 0);

  const segundo = fakeSender(['ok']);
  const siguiente = await sendDueReminders(memoria.store, segundo.sender, new Date(NOW.getTime() + 5 * 60 * 1000));

  assert.deepEqual(siguiente, { sent: 1, gone: 0, dropped: 0 });
  assert.equal(memoria.notices.size, 0);
  assert.equal(segundo.calls.length, 1);
});

test('dos dispositivos reciben cada uno su aviso', async () => {
  const memoria = memoryStore();
  memoria.addDevice('dispositivo-1', NOW.toISOString());
  memoria.addDevice('dispositivo-2', NOW.toISOString());
  memoria.addNotice('dispositivo-1', '2026-11-12T11:55:00.000Z', 'Uno', 'Texto uno');
  memoria.addNotice('dispositivo-2', '2026-11-12T11:56:00.000Z', 'Dos', 'Texto dos');
  const { sender, calls } = fakeSender();

  const resultado = await sendDueReminders(memoria.store, sender, NOW);

  assert.equal(calls.length, 2);
  const titulos = calls.map((call) => (JSON.parse(call.payload) as { title: string }).title).sort();
  assert.deepEqual(titulos, ['Dos', 'Uno']);
  assert.deepEqual(resultado, { sent: 2, gone: 0, dropped: 0 });
  assert.equal(memoria.notices.size, 0);
});

test('borra los dispositivos con más de 30 días sin actividad', async () => {
  const memoria = memoryStore();
  const hace31 = new Date(NOW.getTime() - 31 * 24 * 60 * 60 * 1000).toISOString();
  const hace29 = new Date(NOW.getTime() - 29 * 24 * 60 * 60 * 1000).toISOString();
  memoria.addDevice('viejo', hace31);
  memoria.addDevice('reciente', hace29);
  memoria.addNotice('viejo', '2026-11-12T11:55:00.000Z', 'No debe salir', 'Texto');
  const { sender, calls } = fakeSender();

  await sendDueReminders(memoria.store, sender, NOW);

  assert.deepEqual(memoria.pruneCalls, [new Date(NOW.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()]);
  assert.equal(memoria.devices.has('viejo'), false);
  assert.equal(memoria.devices.has('reciente'), true);
  assert.equal(memoria.notices.size, 0);
  assert.equal(calls.length, 0);
});

test('no envía nada si no hay avisos', async () => {
  const memoria = memoryStore();
  memoria.addDevice('dispositivo-1', NOW.toISOString());
  const { sender, calls } = fakeSender();

  const resultado = await sendDueReminders(memoria.store, sender, NOW);

  assert.equal(calls.length, 0);
  assert.equal(memoria.deleteCalls.length, 0);
  assert.deepEqual(resultado, { sent: 0, gone: 0, dropped: 0 });
});
