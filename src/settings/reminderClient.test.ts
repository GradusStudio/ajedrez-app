import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectReminderSupport,
  parseReminderCredentials,
  planToNotices,
  serializeReminderCredentials,
  urlBase64ToUint8Array,
} from './reminderClient';

const date = new Date(2026, 10, 11, 19, 30);

test('planToNotices convierte las fechas a ISO UTC', () => {
  const notices = planToNotices([
    { date, title: 'Bot', body: 'Hola' },
    { date: new Date(2026, 10, 12, 19, 30), title: 'Otro', body: 'Texto' },
  ]);
  assert.deepEqual(notices, [
    { dueAt: date.toISOString(), title: 'Bot', body: 'Hola' },
    { dueAt: new Date(2026, 10, 12, 19, 30).toISOString(), title: 'Otro', body: 'Texto' },
  ]);
  assert.ok(notices.every((n) => n.dueAt.endsWith('Z')));
});

const credentials = { deviceId: 'abcdefghijklmnopqrstuv', secret: 'A'.repeat(43) };

test('parseReminderCredentials acepta solo deviceId de 22 y secreto de 43 base64url', () => {
  assert.deepEqual(parseReminderCredentials(serializeReminderCredentials(credentials)), credentials);
});

test('parseReminderCredentials rechaza null, JSON roto y longitudes malas', () => {
  for (const raw of [null, '', 'no es json', 'null', '{}', '[]', '"texto"']) {
    assert.equal(parseReminderCredentials(raw), null);
  }
  const malas = [
    { ...credentials, deviceId: credentials.deviceId.slice(0, 21) },
    { ...credentials, deviceId: credentials.deviceId + 'x' },
    { ...credentials, deviceId: 'abcdefghijklmnopqrstu+' },
    { ...credentials, secret: credentials.secret.slice(0, 42) },
    { ...credentials, secret: credentials.secret + 'A' },
    { ...credentials, secret: 'A'.repeat(42) + '=' },
  ];
  for (const raw of malas) assert.equal(parseReminderCredentials(JSON.stringify(raw)), null);
});

test('urlBase64ToUint8Array decodifica con y sin relleno', () => {
  const hola = new Uint8Array([104, 101, 108, 108, 111]);
  assert.deepEqual(urlBase64ToUint8Array('aGVsbG8'), hola);
  assert.deepEqual(urlBase64ToUint8Array('aGVsbG8='), hola);
  const urlSafe = new Uint8Array([251, 255]);
  assert.deepEqual(urlBase64ToUint8Array('-_8'), urlSafe);
  assert.deepEqual(urlBase64ToUint8Array('-_8='), urlSafe);
});

const capabilities = { hasServiceWorker: true, hasPushManager: true, hasNotification: true };

test('detectReminderSupport: todo soportado + desktop → supported', () => {
  assert.equal(detectReminderSupport({ ...capabilities, platform: 'desktop' }), 'supported');
});

test('detectReminderSupport: todo soportado + ios → ios-needs-install', () => {
  assert.equal(detectReminderSupport({ ...capabilities, platform: 'ios' }), 'ios-needs-install');
});

test('detectReminderSupport: todo soportado + installed → supported', () => {
  assert.equal(detectReminderSupport({ ...capabilities, platform: 'installed' }), 'supported');
});

test('detectReminderSupport: falta PushManager → unsupported', () => {
  assert.equal(detectReminderSupport({ ...capabilities, hasPushManager: false, platform: 'desktop' }), 'unsupported');
});
