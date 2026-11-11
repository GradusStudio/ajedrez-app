import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { ReminderSubscription } from './handler';
import { createPushSender, type BuildPushPayload, type PushEnv } from './push';

// Claves de mentira: las pruebas nunca cifran ni conocen la clave privada real, que solo vive en el entorno del Worker.
const ENV: PushEnv = {
  VAPID_SUBJECT: 'mailto:pruebas@example.com',
  VAPID_PUBLIC_KEY: 'publica-de-prueba',
  VAPID_PRIVATE_KEY: 'privada-de-prueba',
};

const SUB: ReminderSubscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
  keys: { p256dh: 'p'.repeat(20), auth: 'a'.repeat(10) },
};

const PAYLOAD = '{"title":"Pipo","body":"Es tu turno"}';

type Built = { message: unknown; subscription: unknown; vapid: unknown };

// `build` de mentira: no cifra nada, anota los argumentos y devuelve un RequestInit cualquiera.
function fakeBuild() {
  const calls: Built[] = [];
  const build: BuildPushPayload = async (message, subscription, vapid) => {
    calls.push({ message, subscription, vapid });
    return { method: 'POST', headers: { ttl: '3600' }, body: new Uint8Array([1, 2, 3]) };
  };
  return { build, calls };
}

// `fetch` de mentira: anota la llamada y responde lo indicado, o lanza si se le pasa un Error.
function fakeFetch(response: Response | Error) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const f = (async (input: unknown, init?: RequestInit) => {
    calls.push({ url: String(input), init });
    if (response instanceof Error) throw response;
    return response;
  }) as typeof fetch;
  return { f, calls };
}

function sender(response: Response | Error) {
  const { build, calls: built } = fakeBuild();
  const { f, calls: fetched } = fakeFetch(response);
  return { send: createPushSender(f, ENV, build), built, fetched };
}

test('201 devuelve ok', async () => {
  const { send, fetched } = sender(new Response(null, { status: 201 }));
  assert.equal(await send.send(SUB, PAYLOAD), 'ok');
  assert.equal(fetched.length, 1);
  assert.equal(fetched[0].url, SUB.endpoint);
});

test('404 y 410 devuelven gone', async () => {
  for (const status of [404, 410]) {
    const { send } = sender(new Response(null, { status }));
    assert.equal(await send.send(SUB, PAYLOAD), 'gone', String(status));
  }
});

test('500 devuelve retry', async () => {
  const { send } = sender(new Response(null, { status: 500 }));
  assert.equal(await send.send(SUB, PAYLOAD), 'retry');
});

test('un fetch que lanza devuelve retry', async () => {
  const { send } = sender(new Error('sin red'));
  assert.equal(await send.send(SUB, PAYLOAD), 'retry');
});

test('arma el mensaje con data y ttl 3600', async () => {
  const { send, built } = sender(new Response(null, { status: 201 }));
  assert.equal(await send.send(SUB, PAYLOAD), 'ok');
  assert.equal(built.length, 1);
  assert.deepEqual(built[0].message, { data: PAYLOAD, options: { ttl: 3600 } });
  assert.deepEqual(built[0].subscription, { endpoint: SUB.endpoint, expirationTime: null, keys: SUB.keys });
});

test('usa VAPID_SUBJECT, VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY del entorno', async () => {
  const { send, built } = sender(new Response(null, { status: 201 }));
  assert.equal(await send.send(SUB, PAYLOAD), 'ok');
  assert.deepEqual(built[0].vapid, {
    subject: ENV.VAPID_SUBJECT,
    publicKey: ENV.VAPID_PUBLIC_KEY,
    privateKey: ENV.VAPID_PRIVATE_KEY,
  });
});
