import test from 'node:test';
import assert from 'node:assert/strict';
import { teacherExpression } from './teacherExpression';

test('explain explica', () => assert.equal(teacherExpression('explain', 'idle', false), 'explica'));
test('esperando piensa', () => assert.equal(teacherExpression('move', 'idle', false), 'piensa'));
test('línea guiada explica', () => assert.equal(teacherExpression('line', 'idle', true), 'explica'));
test('línea de memoria piensa', () => assert.equal(teacherExpression('line', 'idle', false), 'piensa'));
test('acierto gana', () => assert.equal(teacherExpression('quiz', 'correct', false), 'acierto'));
test('error da pista', () => assert.equal(teacherExpression('practice', 'wrong', false), 'pista'));
test('línea guiada: el acierto y el error ganan a la explicación', () => {
  assert.equal(teacherExpression('line', 'correct', true), 'acierto');
  assert.equal(teacherExpression('line', 'wrong', true), 'pista');
});
