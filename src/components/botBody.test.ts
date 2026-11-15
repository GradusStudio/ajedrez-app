import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bodySource, type BotPose } from './botBody';

const map: Partial<Record<string, Partial<Record<BotPose, string>>>> = {
  pipo: { explica: 'pipo-explica.webp', festejo: 'pipo-festejo.webp' },
};

test('la pose pedida se usa cuando existe', () => {
  assert.equal(bodySource(map, 'pipo', 'explica', 'neutro'), 'pipo-explica.webp');
  assert.equal(bodySource(map, 'pipo', 'festejo', 'neutro'), 'pipo-festejo.webp');
});

test('sin pose, con una pose que falta o con un bot desconocido, vuelve al neutro', () => {
  assert.equal(bodySource(map, 'pipo', undefined, 'neutro'), 'neutro');
  assert.equal(bodySource(map, 'pipo', 'lamento', 'neutro'), 'neutro');
  assert.equal(bodySource(map, 'lola', 'explica', 'neutro'), 'neutro');
  assert.equal(bodySource({}, 'pipo', 'explica', 'neutro'), 'neutro');
});
