import React from 'react';
import { router } from 'expo-router';
import { ShopScreen } from '../screens/ShopScreen';

export default function ShopRoute() {
  return <ShopScreen onBack={() => router.back()} />;
}
