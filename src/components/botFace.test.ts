import test from 'node:test';
import assert from 'node:assert/strict';
import { expressionSource } from './botFace';

const map = { pipo: { explica: 'e' } };

test('usa la expresión si existe', () => assert.equal(expressionSource(map, 'pipo', 'explica', 'a'), 'e'));
test('sin esa expresión usa el avatar', () => assert.equal(expressionSource(map, 'pipo', 'pista', 'a'), 'a'));
test('sin bot usa el avatar', () => assert.equal(expressionSource(map, 'ada', 'explica', 'a'), 'a'));
test('sin expresión usa el avatar', () => assert.equal(expressionSource(map, 'pipo', undefined, 'a'), 'a'));
