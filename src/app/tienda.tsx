import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { WideListColumn } from '../components/WideListColumn';
import { ShopScreen, type ShopTab } from '../screens/ShopScreen';

/** Tienda única: /tienda?tab=tableros|piezas. Las rutas viejas /piezas y /tableros redirigen acá. */
export default function ShopRoute() {
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const current: ShopTab = tab === 'piezas' ? 'pieces' : 'boards';
  return (
    <WideListColumn width={1120}>
      <ShopScreen
        tab={current}
        onTab={(next) => router.setParams({ tab: next === 'pieces' ? 'piezas' : 'tableros' })}
        onBack={() => router.back()}
      />
    </WideListColumn>
  );
}
