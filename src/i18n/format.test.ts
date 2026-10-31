import assert from 'node:assert/strict';
import { test } from 'node:test';
import { format } from './format';

test('format', () => assert.equal(format('{n} de {m}', { n: 1, m: 2 }), '1 de 2'));
test('format sin valores', () => assert.equal(format('hola {n}'), 'hola {n}'));
test('format repetido', () => assert.equal(format('{n}-{n}', { n: 3 }), '3-3'));
