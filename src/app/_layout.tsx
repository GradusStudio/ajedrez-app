import '../pwa/captureInstallPrompt';
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
import { showDialog } from '../components/dialog';
import { I18nProvider, useI18n } from '../i18n/I18nContext';
import { ProgressProvider, useProgress } from '../progress/ProgressContext';
import { PieceSetProvider, usePieceSet } from '../settings/PieceSetContext';
import { SettingsProvider, useSettings } from '../settings/SettingsContext';
import { useReminderSync } from '../settings/useReminderSync';
import { registerServiceWorker, requestPersistentStorage } from '../pwa/register';
import { WebColumn } from '../components/WebColumn';
import { useWideLayout } from '../components/useWideLayout';
import { ColumnContext } from '../components/ColumnScrollView';
import { COLUMN_MAX } from '../components/boardSize';
import { useRouteMeta } from '../seo/useRouteMeta';
import { DriveSyncProvider } from '../sync/DriveSyncContext';
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

  useEffect(() => {
    registerServiceWorker();
    requestPersistentStorage();
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
          <DriveSyncProvider>
            <PieceSetProvider>
              <StatusBar style="light" />
              {/* Vista raíz oscura: si algo deja ver lo que hay detrás de las pantallas, que no sea blanco. */}
              <View style={{ flex: 1, backgroundColor: colors.bg }}>
                <WebColumn>
                  <ThemeProvider value={navTheme}>{fontsLoaded ? <AppStack /> : <Loading />}</ThemeProvider>
                </WebColumn>
              </View>
            </PieceSetProvider>
          </DriveSyncProvider>
        </I18nProvider>
      </SettingsProvider>
    </ProgressProvider>
  );
}

function AppStack() {
  const { loaded, saveBlocked } = useProgress();
  const { loaded: piecesLoaded } = usePieceSet();
  const { loaded: settingsLoaded } = useSettings();
  const { t } = useI18n();
  const ready = loaded && piecesLoaded && settingsLoaded;
  useReminderSync(ready);
  useRouteMeta();
  // Pantalla ancha (web): las pantallas ocupan toda la ventana y su contenido va en una columna de 480 px
  // (ColumnScrollView, así la barra de desplazamiento queda contra el borde). La bienvenida, que no se desplaza,
  // va encerrada en la columna entera (`inColumn`).
  const wide = useWideLayout();
  const inColumn = {
    contentStyle: { backgroundColor: colors.bg, ...(wide ? { width: '100%' as const, maxWidth: COLUMN_MAX, alignSelf: 'center' as const } : null) },
  };

  // Si lo guardado no se pudo leer, la persona tiene que saber que esta sesión no se guarda.
  useEffect(() => {
    if (ready && saveBlocked) showDialog(t('progress.saveBlocked.title'), t('progress.saveBlocked.message'));
  }, [ready, saveBlocked, t]);

  // La pantalla de carga (el caballo) se va cuando el progreso y los ajustes ya están listos.
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return <Loading />;
  return (
    // Las pantallas entran deslizándose desde la derecha, con la de abajo corriéndose un poco (más suave
    // que la animación por defecto de Android). La bienvenida y el resultado aparecen con un fundido.
    <ColumnContext.Provider value={wide ? COLUMN_MAX : null}>
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'ios_from_right' }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="apertura/[id]" />
      <Stack.Screen name="bot/[id]" />
      <Stack.Screen name="piezas" />
      <Stack.Screen name="tableros" />
      <Stack.Screen name="historial-bots" />
      <Stack.Screen name="puzzle" />
      <Stack.Screen name="ajustes" />
      <Stack.Screen name="analisis-libre" />
      <Stack.Screen name="importar-partida" />
      <Stack.Screen name="revision" />
      <Stack.Screen name="quiz-partida" />
      <Stack.Screen name="creditos" />
      <Stack.Screen name="instalar" />
      <Stack.Screen name="privacidad" />
      <Stack.Screen name="terminos" />
      <Stack.Screen name="bienvenida" options={{ gestureEnabled: false, animation: 'fade', ...inColumn }} />
      {/* Sin gesto de volver: abandonar la partida pasa por la confirmación */}
      <Stack.Screen name="partida" options={{ gestureEnabled: false }} />
      {/* Sin gesto de volver: la salida de la lección pasa por la confirmación */}
      <Stack.Screen name="leccion/[id]" options={{ gestureEnabled: false }} />
      <Stack.Screen name="resultado" options={{ gestureEnabled: false, animation: 'fade' }} />
    </Stack>
    </ColumnContext.Provider>
  );
}

function Loading() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}
