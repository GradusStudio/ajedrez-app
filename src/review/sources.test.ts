import assert from 'node:assert/strict';
import test from 'node:test';
import { MAX_RESPONSE_CHARS, declaredTooBig, tooBigResponse } from './sources';

test('el tope de una respuesta se aplica al texto ya leído', () => {
  assert.equal(tooBigResponse('x'.repeat(10)), false);
  assert.equal(tooBigResponse('x'.repeat(MAX_RESPONSE_CHARS)), false);
  assert.equal(tooBigResponse('x'.repeat(MAX_RESPONSE_CHARS + 1)), true);
});

test('Content-Length mayor que el tope se rechaza antes de leer el cuerpo', () => {
  assert.equal(declaredTooBig(String(MAX_RESPONSE_CHARS)), false);
  assert.equal(declaredTooBig(String(MAX_RESPONSE_CHARS + 1)), true);
  // Sin cabecera, o con un valor que no es un número, se deja leer y decide el tope del texto.
  assert.equal(declaredTooBig(null), false);
  assert.equal(declaredTooBig(''), false);
  assert.equal(declaredTooBig('muchos'), false);
  assert.equal(declaredTooBig('-1'), false);
});
