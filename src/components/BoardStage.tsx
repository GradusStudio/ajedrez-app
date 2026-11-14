import React from 'react';
import { View } from 'react-native';
import { useBoardSide } from './BoardSizeContext';
import { CoinReward } from './CoinReward';

export type BoardReward = {
  key: string;
  square?: string | null;
  amount: number;
  bonus?: number;
};

/**
 * Tablero con la capa del premio encima. Va dentro del `board` de `BoardLayout`, así usa el
 * mismo tamaño que el Board (el de la pantalla ancha o el del celular). El premio no recibe toques.
 */
export function BoardStage({
  orientation,
  reward,
  bonusLabel,
  children,
}: {
  orientation: 'w' | 'b';
  reward?: BoardReward | null;
  /** Rótulo del bono del día, ya traducido. */
  bonusLabel?: string;
  children: React.ReactNode;
}) {
  const size = useBoardSide();
  const total = reward ? reward.amount + (reward.bonus ?? 0) : 0;
  return (
    <View style={{ width: size, height: size }}>
      {children}
      {reward && total > 0 && (
        <CoinReward
          key={reward.key}
          boardSize={size}
          orientation={orientation}
          square={reward.square}
          amount={reward.amount}
          bonus={reward.bonus}
          bonusLabel={bonusLabel}
        />
      )}
    </View>
  );
}
