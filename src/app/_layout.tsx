import React, { useEffect } from 'react';
import { ActivityIndicator, AppState, Platform, View } from 'react-native';
import { Stack } from 'expo-router';
import * as NavigationBar from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import { ProgressProvider, useProgress } from '../progress/ProgressContext';
import { PieceSetProvider, usePieceSet } from '../settings/PieceSetContext';
import { SettingsProvider, useSettings } from '../settings/SettingsContext';
import { colors } from '../theme';

// Navegación: pestañas en (tabs); la lección y el resultado se abren encima, a pantalla completa.
export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold });

  // Oculta la barra de navegación de Android (se muestra al deslizar desde abajo y vuelve a ocultarse).
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const hide = () => {
      NavigationBar.setVisibilityAsync('hidden').catch(() => {});
    };
    hide();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') hide();
    });
    return () => sub.remove();
  }, []);

  return (
    <ProgressProvider>
      <SettingsProvider>
        <PieceSetProvider>
          <StatusBar style="light" />
          {fontsLoaded ? <AppStack /> : <Loading />}
        </PieceSetProvider>
      </SettingsProvider>
    </ProgressProvider>
  );
}

function AppStack() {
  const { loaded } = useProgress();
  const { loaded: piecesLoaded } = usePieceSet();
  const { loaded: settingsLoaded } = useSettings();
  if (!loaded || !piecesLoaded || !settingsLoaded) return <Loading />;
  return (
    // Las pantallas entran deslizándose desde la derecha, con la de abajo corriéndose un poco (más suave
    // que la animación por defecto de Android). La bienvenida y el resultado aparecen con un fundido.
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'ios_from_right' }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="apertura/[id]" />
      <Stack.Screen name="bot/[id]" />
      <Stack.Screen name="piezas" />
      <Stack.Screen name="puzzle" />
      <Stack.Screen name="ajustes" />
      <Stack.Screen name="creditos" />
      <Stack.Screen name="bienvenida" options={{ gestureEnabled: false, animation: 'fade' }} />
      {/* Sin gesto de volver: abandonar la partida pasa por la confirmación */}
      <Stack.Screen name="partida" options={{ gestureEnabled: false }} />
      {/* Sin gesto de volver: la salida de la lección pasa por la confirmación */}
      <Stack.Screen name="leccion/[id]" options={{ gestureEnabled: false }} />
      <Stack.Screen name="resultado" options={{ gestureEnabled: false, animation: 'fade' }} />
    </Stack>
  );
}

function Loading() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}
