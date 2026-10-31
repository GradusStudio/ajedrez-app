import React from 'react';
import { ColorValue } from 'react-native';
import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { useI18n } from '../../i18n/I18nContext';
import { useProgress } from '../../progress/ProgressContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabIcon, TabIconName } from '../../components/TabIcon';
import { colors, fonts } from '../../theme';

// Las 5 pestañas de mapa-de-pantallas.md más Análisis (tablero libre).
const icon = (name: TabIconName) => {
  const TabBarIcon = ({ color }: { color: ColorValue }) => <TabIcon name={name} color={color} />;
  return TabBarIcon;
};

export default function TabsLayout() {
  const { progress } = useProgress();
  const { t } = useI18n();
  // Con la barra del sistema oculta, el margen inferior que da Android es 0 y la barra queda pegada
  // al borde (las esquinas redondeadas la cortan). Por eso la altura y el margen se fijan aquí.
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 10);
  // La primera vez, antes de las pestañas, la bienvenida.
  if (!progress.profile.onboarded) return <Redirect href="/bienvenida" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.surfaceRaised,
          borderTopWidth: 2,
          height: 62 + bottom,
          paddingTop: 6,
          paddingBottom: bottom,
        },
        // 6 pestañas en un celular: etiqueta chica para que entren todas
        tabBarLabelStyle: { fontFamily: fonts.bold, fontSize: 11 },
        sceneStyle: { backgroundColor: colors.bg },
        // Cambio de pestaña con un fundido corto, en vez del corte seco.
        animation: 'fade',
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.learn'), tabBarIcon: icon('learn') }} />
      <Tabs.Screen name="aperturas" options={{ title: t('tabs.openings'), tabBarIcon: icon('openings') }} />
      <Tabs.Screen name="puzzles" options={{ title: t('tabs.puzzles'), tabBarIcon: icon('puzzles') }} />
      <Tabs.Screen name="bots" options={{ title: t('tabs.bots'), tabBarIcon: icon('bots') }} />
      <Tabs.Screen name="analisis" options={{ title: t('tabs.analysis'), tabBarIcon: icon('analysis') }} />
      <Tabs.Screen name="perfil" options={{ title: t('tabs.profile'), tabBarIcon: icon('profile') }} />
    </Tabs>
  );
}
