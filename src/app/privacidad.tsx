import React from 'react';
import { router } from 'expo-router';
import { PrivacyScreen } from '../screens/PrivacyScreen';

export default function PrivacyRoute() {
  // Si la página se abrió directo desde un enlace no hay historial: se vuelve al inicio.
  return <PrivacyScreen onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))} />;
}
