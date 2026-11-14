import test from 'node:test';
import assert from 'node:assert/strict';
import { planCoinReward } from './coinRewardPlan';

const totals: [number, number][] = [
  [1, 0],
  [2, 0],
  [12, 0],
  [22, 0],
  [0, 10],
  [12, 10],
  [1, 10],
];

for (const [amount, bonus] of totals) {
  test(`reparto de ${amount} con bono ${bonus}`, () => {
    const plan = planCoinReward(amount, bonus);
    assert.equal(plan.total, amount + bonus);
    assert.ok(plan.main.coins <= 8);
    if (amount > 0) {
      assert.ok(plan.main.coins > 0);
      assert.equal(plan.main.displays.length, plan.main.coins);
      assert.equal(plan.main.displays[plan.main.displays.length - 1], amount);
      assert.ok(Math.abs(plan.main.perCoin * plan.main.coins - amount) < 1e-9);
    }
    if (bonus > 0) {
      assert.ok(plan.bonusWave);
      assert.ok(plan.bonusWave.coins <= 5);
      assert.equal(plan.bonusWave.displays.length, plan.bonusWave.coins);
      assert.equal(plan.bonusWave.displays[plan.bonusWave.displays.length - 1], amount + bonus);
    } else {
      assert.equal(plan.bonusWave, null);
    }
    const displays = [...plan.main.displays, ...(plan.bonusWave?.displays ?? [])];
    for (let i = 1; i < displays.length; i++) assert.ok(displays[i] >= displays[i - 1]);
    assert.equal(displays[displays.length - 1] ?? 0, amount + bonus);
  });
}

test('el reparto no inventa monedas con valores negativos', () => {
  const plan = planCoinReward(-3, -2);
  assert.equal(plan.total, 0);
  assert.equal(plan.main.coins, 0);
  assert.equal(plan.bonusWave, null);
});
