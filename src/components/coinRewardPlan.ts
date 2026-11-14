/** Reparto puro del premio de monedas: tandas de como máximo 8 monedas y el número final exacto. */

export type CoinWave = {
  amount: number;
  coins: number;
  /** Lo que suma cada moneda (puede ser fraccionario). */
  perCoin: number;
  /** Número que muestra la pastilla después de cada moneda. */
  displays: number[];
};

export type CoinPlan = {
  amount: number;
  bonus: number;
  total: number;
  main: CoinWave;
  bonusWave: CoinWave | null;
};

const EMPTY = (amount: number): CoinWave => ({ amount, coins: 0, perCoin: 0, displays: [] });

function wave(amount: number, cap: number, offset: number): CoinWave {
  const coins = Math.min(amount, cap);
  if (coins <= 0) return EMPTY(0);
  const displays = Array.from({ length: coins }, (_, i) =>
    i === coins - 1 ? offset + amount : Math.round(offset + (amount * (i + 1)) / coins),
  );
  return { amount, coins, perCoin: amount / coins, displays };
}

/**
 * Plan del premio: `amount` monedas ganadas y `bonus` del día. La tanda principal muestra
 * hasta 8 monedas; el bono, hasta 5, y su número sigue desde el total anterior.
 */
export function planCoinReward(amount: number, bonus = 0): CoinPlan {
  const mainAmount = Math.max(0, Math.round(amount));
  const bonusAmount = Math.max(0, Math.round(bonus));
  const main = wave(mainAmount, 8, 0);
  const bonusWave = bonusAmount > 0 ? wave(bonusAmount, 5, mainAmount) : null;
  return {
    amount: mainAmount,
    bonus: bonusAmount,
    total: mainAmount + bonusAmount,
    main,
    bonusWave,
  };
}
