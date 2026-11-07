import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { showDialog } from './dialog.web';

type Fake = { alert: string[]; confirm: string[] };

function fakeWindow(confirmResult: boolean): Fake {
  const calls: Fake = { alert: [], confirm: [] };
  (globalThis as { window?: unknown }).window = {
    alert: (m: string) => void calls.alert.push(m),
    confirm: (m: string) => {
      calls.confirm.push(m);
      return confirmResult;
    },
  };
  return calls;
}

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

test('confirm true: llama al botón de acción y no al cancel', () => {
  const calls = fakeWindow(true);
  const hits: string[] = [];
  showDialog('Título', 'Mensaje', [
    { text: 'No', style: 'cancel', onPress: () => hits.push('cancel') },
    { text: 'Sí', style: 'destructive', onPress: () => hits.push('accion') },
  ]);
  assert.deepEqual(hits, ['accion']);
  assert.deepEqual(calls.confirm, ['Título\n\nMensaje']);
});

test('confirm false: llama al cancel y no a la acción', () => {
  fakeWindow(false);
  const hits: string[] = [];
  showDialog('T', 'M', [
    { text: 'No', style: 'cancel', onPress: () => hits.push('cancel') },
    { text: 'Sí', onPress: () => hits.push('accion') },
  ]);
  assert.deepEqual(hits, ['cancel']);
});

test('confirm false sin onPress en el cancel no falla', () => {
  fakeWindow(false);
  showDialog('T', 'M', [{ text: 'No', style: 'cancel' }, { text: 'Sí', onPress: () => assert.fail() }]);
});

test('sin botones: un alert con título y mensaje', () => {
  const calls = fakeWindow(true);
  showDialog('T', 'M');
  assert.deepEqual(calls.alert, ['T\n\nM']);
  assert.equal(calls.confirm.length, 0);
});

test('un botón: alert y después su onPress', () => {
  const calls = fakeWindow(true);
  const hits: string[] = [];
  showDialog('T', 'M', [{ text: 'Ok', onPress: () => hits.push('ok') }]);
  assert.equal(calls.alert.length, 1);
  assert.deepEqual(hits, ['ok']);
});

test('tres botones lanza', () => {
  fakeWindow(true);
  assert.throws(() => showDialog('T', 'M', [{ text: 'a' }, { text: 'b' }, { text: 'c' }]));
});
