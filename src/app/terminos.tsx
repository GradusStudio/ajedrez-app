import React from 'react';
import { router } from 'expo-router';
import { TermsScreen } from '../screens/TermsScreen';

export default function TermsRoute() {
  // Si la página se abrió directo desde un enlace no hay historial: se vuelve al inicio.
  return <TermsScreen onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))} />;
}
