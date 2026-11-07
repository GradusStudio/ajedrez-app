import React, { useEffect } from 'react';
import { ActivityIndicator, AppState, Platform, View } from 'react-native';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as NavigationBar from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import { I18nProvider } from '../i18n/I18nContext';
import { ProgressProvider, useProgress } from '../progress/ProgressContext';
import { PieceSetProvider, usePieceSet } from '../settings/PieceSetContext';
import { SettingsProvider, useSettings } from '../settings/SettingsContext';
import { useReminderSync } from '../settings/useReminderSync';
import { colors } from '../theme';

// Tema de la navegación: su `background` es el fondo que se ve detrás de las pantallas mientras se deslizan
// (con el tema por defecto es claro y se veía un destello blanco al abrir y volver de un menú).
const navTheme = { ...DarkTheme, colors: { ...DarkTheme.colors, background: colors.bg, card: colors.surface, border: colors.surfaceRaised } };

// La pantalla de carga sigue visible hasta que AppStack termina de cargar fuentes y datos.
SplashScreen.preventAutoHideAsync().catch(() => {});
// Por si algo nunca termina de cargar (por ejemplo, una fuente), no dejar la pantalla de carga para siempre.
const SPLASH_MAX_MS = 8000;

// Navegación: pestañas en (tabs); la lección y el resultado se abren encima, a pantalla completa.
export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold });

  useEffect(() => {
    const t = setTimeout(() => SplashScreen.hideAsync().catch(() => {}), SPLASH_MAX_MS);
    return () => clearTimeout(t);
  }, []);

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
        <I18nProvider>
          <PieceSetProvider>
            <StatusBar style="light" />
            {/* Vista raíz oscura: si algo deja ver lo que hay detrás de las pantallas, que no sea blanco. */}
            <View style={{ flex: 1, backgroundColor: colors.bg }}>
              <ThemeProvider value={navTheme}>{fontsLoaded ? <AppStack /> : <Loading />}</ThemeProvider>
            </View>
          </PieceSetProvider>
        </I18nProvider>
      </SettingsProvider>
    </ProgressProvider>
  );
}

function AppStack() {
  const { loaded } = useProgress();
  const { loaded: piecesLoaded } = usePieceSet();
  const { loaded: settingsLoaded } = useSettings();
  const ready = loaded && piecesLoaded && settingsLoaded;
  useReminderSync(ready);

  // La pantalla de carga (el caballo) se va cuando el progreso y los ajustes ya están listos.
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return <Loading />;
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
      <Stack.Screen name="tableros" />
      <Stack.Screen name="puzzle" />
      <Stack.Screen name="ajustes" />
      <Stack.Screen name="analisis-libre" />
      <Stack.Screen name="importar-partida" />
      <Stack.Screen name="revision" />
      <Stack.Screen name="quiz-partida" />
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
