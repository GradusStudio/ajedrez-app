import assert from 'node:assert/strict';
import { test } from 'node:test';
import { reminderOfferApplies, installOfferApplies } from './offers';

const base = { remindersSupported: true, review: false, reminderOffered: false, reminderEnabled: false };

test('recordatorio: se ofrece si se puede y nunca se ofreció', () => assert.equal(reminderOfferApplies(base), true));
test('recordatorio: no en la web', () => assert.equal(reminderOfferApplies({ ...base, remindersSupported: false }), false));
test('recordatorio: no en repaso, ni ofrecido, ni activado', () => {
  assert.equal(reminderOfferApplies({ ...base, review: true }), false);
  assert.equal(reminderOfferApplies({ ...base, reminderOffered: true }), false);
  assert.equal(reminderOfferApplies({ ...base, reminderEnabled: true }), false);
});

const inst = { platform: 'ios' as const, review: false, installOffered: false, reminderApplies: false };
test('instalar: se ofrece una vez fuera de la app instalada', () => {
  for (const platform of ['ios', 'android', 'desktop'] as const) assert.equal(installOfferApplies({ ...inst, platform }), true);
});
test('instalar: no en el celular (plataforma null), instalada, repaso ni ya ofrecida', () => {
  assert.equal(installOfferApplies({ ...inst, platform: null }), false);
  assert.equal(installOfferApplies({ ...inst, platform: 'installed' }), false);
  assert.equal(installOfferApplies({ ...inst, review: true }), false);
  assert.equal(installOfferApplies({ ...inst, installOffered: true }), false);
});
test('instalar: nunca junto con el recordatorio', () => assert.equal(installOfferApplies({ ...inst, reminderApplies: true }), false));
